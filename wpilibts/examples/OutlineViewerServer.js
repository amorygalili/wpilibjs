/**
 * Simple NetworkTables server specifically designed to work with OutlineViewer.
 * 
 * This server implements the NT4 protocol in a way that's compatible with OutlineViewer.
 */
const WebSocket = require('ws');
const crypto = require('crypto');

// Create a WebSocket server
const server = new WebSocket.Server({ port: 5810 });

console.log('OutlineViewer-compatible NetworkTables server started on port 5810');

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
  
  // Create some default topics for OutlineViewer
  createDefaultTopics();
  
  // Send announce messages for all existing topics
  for (const [topicName, topic] of topics.entries()) {
    sendAnnounce(ws, topic);
    
    // Send the value if it exists
    if (topic.value !== null) {
      sendValue(ws, topic);
    }
  }
  
  // Handle messages from the client
  ws.on('message', (message) => {
    try {
      // Check if the message is a binary message (OutlineViewer sends binary messages)
      if (Buffer.isBuffer(message)) {
        console.log(`Received binary message from client ${clientId} (likely OutlineViewer)`);
        
        // Try to parse the binary message
        try {
          parseBinaryMessage(message, ws, clientId);
        } catch (error) {
          console.error('Error parsing binary message:', error);
        }
        
        return;
      }
      
      // Try to parse as JSON
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

// Create default topics
function createDefaultTopics() {
  // Create some default topics if they don't exist
  if (!topics.has('SmartDashboard/Test/Boolean')) {
    publishTopic('SmartDashboard/Test/Boolean', 'boolean', true);
  }
  
  if (!topics.has('SmartDashboard/Test/Number')) {
    publishTopic('SmartDashboard/Test/Number', 'double', 42.0);
  }
  
  if (!topics.has('SmartDashboard/Test/String')) {
    publishTopic('SmartDashboard/Test/String', 'string', 'Hello OutlineViewer!');
  }
  
  if (!topics.has('SmartDashboard/Test/BooleanArray')) {
    publishTopic('SmartDashboard/Test/BooleanArray', 'boolean[]', [true, false, true]);
  }
  
  if (!topics.has('SmartDashboard/Test/NumberArray')) {
    publishTopic('SmartDashboard/Test/NumberArray', 'double[]', [1, 2, 3, 4, 5]);
  }
  
  if (!topics.has('SmartDashboard/Test/StringArray')) {
    publishTopic('SmartDashboard/Test/StringArray', 'string[]', ['Hello', 'OutlineViewer', '!']);
  }
  
  // Update values periodically
  setInterval(updateValues, 1000);
}

// Update values periodically
function updateValues() {
  // Update boolean value
  if (topics.has('SmartDashboard/Test/Boolean')) {
    const topic = topics.get('SmartDashboard/Test/Boolean');
    topic.value = !topic.value;
    broadcastValue(topic);
  }
  
  // Update number value
  if (topics.has('SmartDashboard/Test/Number')) {
    const topic = topics.get('SmartDashboard/Test/Number');
    topic.value = Math.round(Math.random() * 100);
    broadcastValue(topic);
  }
  
  // Update string value
  if (topics.has('SmartDashboard/Test/String')) {
    const topic = topics.get('SmartDashboard/Test/String');
    topic.value = `Hello OutlineViewer! ${new Date().toLocaleTimeString()}`;
    broadcastValue(topic);
  }
}

// Parse binary message from OutlineViewer
function parseBinaryMessage(message, ws, clientId) {
  // OutlineViewer uses a binary protocol for NT4
  // We'll try to handle the most common message types
  
  // First byte is the message type
  const messageType = message[0];
  
  console.log(`Binary message type: ${messageType}`);
  
  // Handle subscription message (type 3)
  if (messageType === 3) {
    // This is a subscription request
    console.log('Received subscription request from OutlineViewer');
    
    // Create a subscription for all topics
    const subscriptionId = nextSubscriptionId++;
    subscriptions.set(subscriptionId, {
      clientId,
      topics: new Set(topics.keys())
    });
    
    // Send subscription acknowledgement
    const ackBuffer = Buffer.alloc(5);
    ackBuffer[0] = 4; // Subscription ACK message type
    ackBuffer.writeUInt32LE(subscriptionId, 1);
    ws.send(ackBuffer);
    
    // Send all topic values
    for (const topic of topics.values()) {
      sendValue(ws, topic);
    }
  }
}

// Publish a topic
function publishTopic(name, type, value) {
  const topicId = nextTopicId++;
  const timestamp = Date.now() * 1000;
  
  topics.set(name, {
    id: topicId,
    name,
    type,
    properties: {},
    value,
    timestamp
  });
  
  console.log(`Topic published: ${name} (id: ${topicId}, type: ${type})`);
  
  // Announce to all clients
  for (const client of clients.values()) {
    sendAnnounce(client, topics.get(name));
    sendValue(client, topics.get(name));
  }
  
  return topicId;
}

// Handle publish message
function handlePublish(params) {
  const { name, type, properties = {}, value } = params;
  
  // Check if topic already exists
  if (!topics.has(name)) {
    // Create new topic
    const topicId = nextTopicId++;
    topics.set(name, {
      id: topicId,
      name,
      type,
      properties,
      value: null,
      timestamp: Date.now() * 1000
    });
    
    // Announce new topic to all clients
    for (const client of clients.values()) {
      sendAnnounce(client, topics.get(name));
    }
    
    console.log(`Topic published: ${name} (id: ${topicId}, type: ${type})`);
  }
  
  // Update topic value if provided
  if (value !== undefined) {
    updateTopicValue(name, value);
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
      sendUnannounce(client, topic.id);
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
          sendValue(client, topic);
        }
      }
    }
  }
  
  // Send subscription acknowledgement
  const client = clients.get(clientId);
  if (client) {
    sendSubscribeAck(client, subscriptionId);
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
      sendUnsubscribeAck(client, id);
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
      sendProperties(client, topic);
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
    sendProperties(ws, topic);
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
    broadcastValue(topic);
    
    console.log(`Topic value updated: ${name} = ${JSON.stringify(value)}`);
  }
}

// Broadcast value to all subscribers
function broadcastValue(topic) {
  for (const subscription of subscriptions.values()) {
    if (subscription.topics.has(topic.name)) {
      const client = clients.get(subscription.clientId);
      if (client) {
        sendValue(client, topic);
      }
    }
  }
}

// Send announce message
function sendAnnounce(ws, topic) {
  ws.send(JSON.stringify({
    method: 'announce',
    params: {
      name: topic.name,
      id: topic.id,
      type: topic.type,
      properties: topic.properties
    }
  }));
}

// Send unannounce message
function sendUnannounce(ws, topicId) {
  ws.send(JSON.stringify({
    method: 'unannounce',
    params: {
      id: topicId
    }
  }));
}

// Send value message
function sendValue(ws, topic) {
  ws.send(JSON.stringify({
    method: 'value',
    params: {
      id: topic.id,
      value: topic.value,
      timestamp: topic.timestamp
    }
  }));
}

// Send properties message
function sendProperties(ws, topic) {
  ws.send(JSON.stringify({
    method: 'properties',
    params: {
      id: topic.id,
      properties: topic.properties
    }
  }));
}

// Send subscribe acknowledgement
function sendSubscribeAck(ws, subscriptionId) {
  ws.send(JSON.stringify({
    method: 'subscribe_ack',
    params: {
      id: subscriptionId
    }
  }));
}

// Send unsubscribe acknowledgement
function sendUnsubscribeAck(ws, subscriptionId) {
  ws.send(JSON.stringify({
    method: 'unsubscribe_ack',
    params: {
      id: subscriptionId
    }
  }));
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

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down OutlineViewer-compatible NetworkTables server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
