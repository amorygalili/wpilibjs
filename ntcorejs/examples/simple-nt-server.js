const WebSocket = require('ws');

// Create a WebSocket server
const wss = new WebSocket.Server({
  port: 5810,
  // Support both NT 4.0 and 4.1 protocols
  handleProtocols: (protocols, request) => {
    console.log('Client requested protocols:', protocols);

    // Convert Set to Array if needed
    const protocolArray = Array.isArray(protocols) ? protocols : Array.from(protocols);

    // Check if client supports NT 4.1
    if (protocolArray.indexOf('v4.1.networktables.first.wpi.edu') !== -1) {
      console.log('Using NT 4.1 protocol');
      return 'v4.1.networktables.first.wpi.edu';
    }

    // Fall back to NT 4.0
    if (protocolArray.indexOf('networktables.first.wpi.edu') !== -1) {
      console.log('Using NT 4.0 protocol');
      return 'networktables.first.wpi.edu';
    }

    // No supported protocol
    console.log('No supported protocol found');
    return false;
  }
});

console.log('NetworkTables Server started on port 5810');

// Store topics
const topics = new Map();
let nextTopicId = 1;

// Handle connections
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send all existing topics to the new client
  for (const [name, topic] of topics.entries()) {
    const announceMessage = {
      method: 'announce',
      params: {
        name,
        id: topic.id,
        type: topic.type,
        properties: topic.properties
      }
    };

    ws.send(JSON.stringify([announceMessage]));

    // Send the current value if available
    if (topic.value) {
      const valueMessage = {
        id: topic.id,
        timestamp: topic.value.timestamp,
        type: topic.value.type,
        value: topic.value.value
      };

      ws.send(JSON.stringify(valueMessage));
    }
  }

  // Handle messages
  ws.on('message', (data) => {
    try {
      // Try to parse as JSON
      if (typeof data === 'string') {
        console.log('Text message received');
        const parsedData = JSON.parse(data);

        // Handle array of messages (control messages)
        if (Array.isArray(parsedData)) {
          for (const msg of parsedData) {
            handleControlMessage(ws, msg);
          }
        }
        // Handle value update
        else if (typeof parsedData === 'object' && parsedData.id) {
          handleValueMessage(ws, parsedData);
        }
      } else {
        // Handle binary data
        console.log('Binary message received');

        try {
          // Convert to Buffer
          let buffer;
          if (data instanceof Buffer) {
            buffer = data;
          } else if (data instanceof ArrayBuffer) {
            buffer = Buffer.from(data);
          } else {
            // For other types, try to convert to buffer
            buffer = Buffer.from(data);
          }

          console.log('Binary message, length:', buffer.length);
          console.log('First 16 bytes:', Array.from(buffer.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' '));

          // Try to parse as JSON
          try {
            const jsonString = buffer.toString('utf8');
            const parsedData = JSON.parse(jsonString);

            // Handle array of messages (control messages)
            if (Array.isArray(parsedData)) {
              for (const msg of parsedData) {
                handleControlMessage(ws, msg);
              }
            }
            // Handle value update
            else if (typeof parsedData === 'object' && parsedData.id) {
              handleValueMessage(ws, parsedData);
            }
          } catch (jsonError) {
            console.error('Failed to parse binary data as JSON:', jsonError);
          }
        } catch (bufferError) {
          console.error('Error processing binary message:', bufferError);
        }
      }
    } catch (error) {
      console.error('Failed to process message:', error);
    }
  });

  // Handle disconnections
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Handle control message
function handleControlMessage(ws, message) {
  console.log('Control message:', message);

  switch (message.method) {
    case 'publish':
      const { name, type, pubuid, properties } = message.params;

      // Check if topic already exists
      if (topics.has(name)) {
        // Update existing topic
        const topic = topics.get(name);
        topic.type = type;
        Object.assign(topic.properties, properties);

        // Notify all clients of property changes
        broadcastProperties(name, topic.properties);
      } else {
        // Create new topic
        const id = nextTopicId++;
        const topic = {
          id,
          type,
          properties: { ...properties },
          value: null
        };

        topics.set(name, topic);

        // Announce new topic to all clients
        broadcastAnnounce(name, id, type, properties);
      }
      break;

    case 'subscribe':
      // Nothing special to do for subscribe in this simple example
      console.log('Client subscribed to topics:', message.params.topics);
      break;
  }
}

// Handle value message
function handleValueMessage(ws, message) {
  const { id, timestamp, type, value } = message;

  // Find topic by ID
  for (const [name, topic] of topics.entries()) {
    if (topic.id === id) {
      // Update topic value
      topic.value = {
        timestamp,
        type,
        value
      };

      // Broadcast value to all clients
      broadcastValue(id, timestamp, type, value);

      console.log(`Value updated for topic ${name}:`, value);
      break;
    }
  }
}

// Broadcast announce message to all clients
function broadcastAnnounce(name, id, type, properties) {
  // Create announce message with all required fields
  const message = {
    method: 'announce',
    params: {
      name,
      id,
      type,
      properties,
      pubuid: id  // Include publication ID for OutlineViewer
    }
  };

  // Send as JSON array
  broadcast(JSON.stringify([message]));

  console.log(`Topic announced: ${name} (${type})`);
  console.log('Announce message:', JSON.stringify(message));
}

// Broadcast properties message to all clients
function broadcastProperties(name, properties) {
  const message = {
    method: 'properties',
    params: {
      name,
      properties
    }
  };

  broadcast(JSON.stringify([message]));

  console.log(`Properties updated for topic ${name}`);
}

// Broadcast value to all clients
function broadcastValue(id, timestamp, type, value) {
  // Create value message with all required fields
  const message = {
    id,
    timestamp,
    type,
    value
  };

  // Send as JSON
  broadcast(JSON.stringify(message));

  // Log value updates (except for counter to reduce noise)
  if (!topics.has('/test/counter') || topics.get('/test/counter').id !== id) {
    console.log(`Value updated: id=${id}, type=${type}, value=${JSON.stringify(value)}`);
  }
}

// Broadcast message to all clients
function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Create test topics
function createTestTopics() {
  // Boolean
  createTopic('/test/boolean', 'boolean', {}, true);

  // Number
  createTopic('/test/number', 'double', {}, 3.14159);

  // String
  createTopic('/test/string', 'string', {}, 'Hello from ntcorejs!');

  // Boolean array
  createTopic('/test/boolean_array', 'boolean[]', {}, [true, false, true]);

  // Number array
  createTopic('/test/number_array', 'double[]', {}, [1.1, 2.2, 3.3, 4.4]);

  // String array
  createTopic('/test/string_array', 'string[]', {}, ['one', 'two', 'three']);

  // Start updating counter
  let counter = 0;
  setInterval(() => {
    createTopic('/test/counter', 'double', {}, counter++);
  }, 1000);
}

// Create or update a topic
function createTopic(name, type, properties, value) {
  // Add standard properties that OutlineViewer expects
  const enhancedProperties = {
    ...properties,
    persistent: true,  // Make topic persistent
    retained: true,    // Retain values
    'rawType': type,   // Raw type information
    'typeString': type // Type as string
  };

  // Check if topic already exists
  if (topics.has(name)) {
    // Update existing topic
    const topic = topics.get(name);

    // Update properties
    topic.properties = enhancedProperties;

    // Update value
    topic.value = {
      type: getTypeId(type),
      value,
      timestamp: Date.now() * 1000
    };

    // Broadcast properties update
    broadcastProperties(name, topic.properties);

    // Broadcast value
    broadcastValue(topic.id, topic.value.timestamp, topic.value.type, topic.value.value);
  } else {
    // Create new topic
    const id = nextTopicId++;
    const topic = {
      id,
      type,
      properties: enhancedProperties,
      value: {
        type: getTypeId(type),
        value,
        timestamp: Date.now() * 1000
      }
    };

    topics.set(name, topic);

    // Announce new topic to all clients
    broadcastAnnounce(name, id, type, enhancedProperties);

    // Broadcast value
    broadcastValue(topic.id, topic.value.timestamp, topic.value.type, topic.value.value);
  }
}

// Get type ID from type string
function getTypeId(type) {
  switch (type) {
    case 'boolean': return 0;
    case 'double': return 1;
    case 'int': return 2;
    case 'float': return 3;
    case 'string': return 4;
    case 'raw': return 5;
    case 'rpc': return 5;
    case 'msgpack': return 5;
    case 'protobuf': return 5;
    case 'boolean[]': return 16;
    case 'double[]': return 17;
    case 'int[]': return 18;
    case 'float[]': return 19;
    case 'string[]': return 20;
    default: return 5; // Default to raw
  }
}

// Create test topics
createTestTopics();

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping server...');
  wss.close();
  process.exit(0);
});
