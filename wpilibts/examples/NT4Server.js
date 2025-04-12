/**
 * Simple NetworkTables 4 server for testing.
 *
 * This script starts a WebSocket server that implements the NetworkTables 4 protocol.
 * It can be used for testing the NT4Bridge and NT4Client classes.
 */
const WebSocket = require('ws');

// Create a WebSocket server
const server = new WebSocket.Server({ port: 5810 });

console.log('NetworkTables 4 server started on port 5810');

// Map of topics
const topics = new Map();
let nextTopicId = 1;

// Map of clients
const clients = new Map();
let nextClientId = 1;

// Map of subscriptions
const subscriptions = new Map();
let nextSubscriptionId = 1;

// Handle new connections
server.on('connection', (ws) => {
  const clientId = nextClientId++;
  clients.set(clientId, ws);

  console.log(`Client ${clientId} connected`);

  // Send announce messages for all existing topics
  for (const [topicName, topic] of topics.entries()) {
    ws.send(JSON.stringify({
      method: 'announce',
      params: {
        name: topicName,
        id: topic.id,
        type: topic.type,
        properties: topic.properties
      }
    }));
  }

  // Handle messages from the client
  ws.on('message', (message) => {
    try {
      // Check if the message is a binary message (OutlineViewer sends binary messages)
      if (Buffer.isBuffer(message)) {
        console.log(`Received binary message from client ${clientId} (likely OutlineViewer)`);
        // For OutlineViewer, we'll just send some default topics
        sendDefaultTopicsToOutlineViewer(ws);
        return;
      }

      const data = JSON.parse(message);

      if (data.method === 'publish') {
        handlePublish(data.params);
      } else if (data.method === 'unpublish') {
        handleUnpublish(data.params);
      } else if (data.method === 'subscribe') {
        handleSubscribe(clientId, data.params);
      } else if (data.method === 'unsubscribe') {
        handleUnsubscribe(clientId, data.params);
      } else if (data.method === 'setproperties') {
        handleSetProperties(data.params);
      } else if (data.method === 'getproperties') {
        handleGetProperties(ws, data.params);
      } else {
        console.log(`Unknown method: ${data.method}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log(`Client ${clientId} disconnected`);

    // Remove client subscriptions
    for (const [subscriptionId, subscription] of subscriptions.entries()) {
      if (subscription.clientId === clientId) {
        subscriptions.delete(subscriptionId);
      }
    }

    // Remove client
    clients.delete(clientId);
  });
});

// Handle publish message
function handlePublish(params) {
  const { name, type, properties = {} } = params;

  // Check if topic already exists
  if (!topics.has(name)) {
    // Create new topic
    const topicId = nextTopicId++;
    topics.set(name, {
      id: topicId,
      type,
      properties,
      value: null,
      timestamp: Date.now() * 1000
    });

    // Announce new topic to all clients
    for (const client of clients.values()) {
      client.send(JSON.stringify({
        method: 'announce',
        params: {
          name,
          id: topicId,
          type,
          properties
        }
      }));
    }

    console.log(`Topic published: ${name} (id: ${topicId}, type: ${type})`);
  }

  // Update topic value if provided
  if (params.value !== undefined) {
    updateTopicValue(name, params.value);
  }
}

// Handle unpublish message
function handleUnpublish(params) {
  const { name } = params;

  // Check if topic exists
  if (topics.has(name)) {
    const topic = topics.get(name);

    // Remove topic
    topics.delete(name);

    // Notify all clients
    for (const client of clients.values()) {
      client.send(JSON.stringify({
        method: 'unannounce',
        params: {
          id: topic.id
        }
      }));
    }

    console.log(`Topic unpublished: ${name} (id: ${topic.id})`);
  }
}

// Handle subscribe message
function handleSubscribe(clientId, params) {
  const { topics: topicSelectors = [], options = {} } = params;
  const subscriptionId = nextSubscriptionId++;

  // Create subscription
  subscriptions.set(subscriptionId, {
    clientId,
    topicSelectors,
    options,
    topics: new Set()
  });

  // Find matching topics
  for (const [topicName, topic] of topics.entries()) {
    if (matchesTopic(topicName, topicSelectors)) {
      subscriptions.get(subscriptionId).topics.add(topicName);

      // Send initial value if requested
      if (options.immediate && topic.value !== null) {
        const client = clients.get(clientId);
        if (client) {
          client.send(JSON.stringify({
            method: 'value',
            params: {
              id: topic.id,
              value: topic.value,
              timestamp: topic.timestamp
            }
          }));
        }
      }
    }
  }

  // Send subscription acknowledgement
  const client = clients.get(clientId);
  if (client) {
    client.send(JSON.stringify({
      method: 'subscribe_ack',
      params: {
        id: subscriptionId
      }
    }));
  }

  console.log(`Client ${clientId} subscribed to topics (id: ${subscriptionId})`);
}

// Handle unsubscribe message
function handleUnsubscribe(clientId, params) {
  const { id } = params;

  // Check if subscription exists
  if (subscriptions.has(id) && subscriptions.get(id).clientId === clientId) {
    // Remove subscription
    subscriptions.delete(id);

    // Send unsubscribe acknowledgement
    const client = clients.get(clientId);
    if (client) {
      client.send(JSON.stringify({
        method: 'unsubscribe_ack',
        params: {
          id
        }
      }));
    }

    console.log(`Client ${clientId} unsubscribed (id: ${id})`);
  }
}

// Handle set properties message
function handleSetProperties(params) {
  const { name, properties } = params;

  // Check if topic exists
  if (topics.has(name)) {
    const topic = topics.get(name);

    // Update properties
    topic.properties = { ...topic.properties, ...properties };

    // Notify all clients
    for (const client of clients.values()) {
      client.send(JSON.stringify({
        method: 'properties',
        params: {
          id: topic.id,
          properties: topic.properties
        }
      }));
    }

    console.log(`Topic properties updated: ${name}`);
  }
}

// Handle get properties message
function handleGetProperties(ws, params) {
  const { name } = params;

  // Check if topic exists
  if (topics.has(name)) {
    const topic = topics.get(name);

    // Send properties
    ws.send(JSON.stringify({
      method: 'properties',
      params: {
        id: topic.id,
        properties: topic.properties
      }
    }));
  }
}

// Update topic value
function updateTopicValue(name, value) {
  // Check if topic exists
  if (topics.has(name)) {
    const topic = topics.get(name);
    const timestamp = Date.now() * 1000;

    // Update topic value
    topic.value = value;
    topic.timestamp = timestamp;

    // Notify subscribers
    for (const subscription of subscriptions.values()) {
      if (subscription.topics.has(name)) {
        const client = clients.get(subscription.clientId);
        if (client) {
          client.send(JSON.stringify({
            method: 'value',
            params: {
              id: topic.id,
              value,
              timestamp
            }
          }));
        }
      }
    }

    console.log(`Topic value updated: ${name} = ${JSON.stringify(value)}`);
  }
}

// Check if a topic matches any of the selectors
function matchesTopic(topicName, selectors) {
  // If no selectors, match all topics
  if (selectors.length === 0) {
    return true;
  }

  // Check each selector
  for (const selector of selectors) {
    if (selector.all) {
      return true;
    }

    if (selector.prefix && topicName.startsWith(selector.prefix)) {
      return true;
    }

    if (selector.name && topicName === selector.name) {
      return true;
    }
  }

  return false;
}

// Send default topics to OutlineViewer
function sendDefaultTopicsToOutlineViewer(ws) {
  // Create some default topics for OutlineViewer
  if (!topics.has('OutlineViewerTest/Boolean/Value')) {
    handlePublish({
      name: 'OutlineViewerTest/Boolean/Value',
      type: 'boolean',
      value: true
    });
  }

  if (!topics.has('OutlineViewerTest/Number/Value')) {
    handlePublish({
      name: 'OutlineViewerTest/Number/Value',
      type: 'double',
      value: 42
    });
  }

  if (!topics.has('OutlineViewerTest/String/Value')) {
    handlePublish({
      name: 'OutlineViewerTest/String/Value',
      type: 'string',
      value: 'Hello OutlineViewer!'
    });
  }

  // Send all topics to the client
  for (const [topicName, topic] of topics.entries()) {
    ws.send(JSON.stringify({
      method: 'announce',
      params: {
        name: topicName,
        id: topic.id,
        type: topic.type,
        properties: topic.properties
      }
    }));

    // Send the value if it exists
    if (topic.value !== null) {
      ws.send(JSON.stringify({
        method: 'value',
        params: {
          id: topic.id,
          value: topic.value,
          timestamp: topic.timestamp
        }
      }));
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down NetworkTables 4 server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);  // This ensures the process actually exits
  });
  
  // Add a timeout to force exit if server.close() hangs
  setTimeout(() => {
    console.log('Force closing server after timeout');
    process.exit(1);
  }, 1000);
});

