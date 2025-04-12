/**
 * Direct implementation of the NT4 protocol for OutlineViewer.
 *
 * This server implements the NT4 protocol directly, using the same format as WPILib.
 */
const WebSocket = require('ws');
const crypto = require('crypto');

// Create a WebSocket server
const server = new WebSocket.Server({ port: 5810 });

console.log('NT4 Direct Server started on port 5810');

// Map of topics
const topics = new Map();
let nextTopicId = 0;

// Map of clients
const clients = new Map();
let nextClientId = 0;

// Create some default topics
createDefaultTopics();

// Handle new connections
server.on('connection', (ws) => {
  const clientId = nextClientId++;
  clients.set(clientId, ws);

  console.log(`Client ${clientId} connected`);

  // Send announce messages for all existing topics
  for (const topic of topics.values()) {
    sendAnnounce(ws, topic);
    sendValue(ws, topic);
  }

  // Handle messages from the client
  ws.on('message', (message) => {
    try {
      // Check if the message is binary
      if (Buffer.isBuffer(message)) {
        handleBinaryMessage(message, ws, clientId);
        return;
      }

      // Try to parse as JSON
      const data = JSON.parse(message);
      console.log('Received JSON message:', data);
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log(`Client ${clientId} disconnected`);
    clients.delete(clientId);
  });
});

// Create default topics
function createDefaultTopics() {
  // Create some default topics with leading slashes
  addTopic('/SmartDashboard/Test/Boolean', 'boolean', true);
  addTopic('/SmartDashboard/Test/Number', 'double', 42.0);
  addTopic('/SmartDashboard/Test/String', 'string', 'Hello OutlineViewer!');
  addTopic('/SmartDashboard/Test/BooleanArray', 'boolean[]', [true, false, true]);
  addTopic('/SmartDashboard/Test/NumberArray', 'double[]', [1, 2, 3, 4, 5]);
  addTopic('/SmartDashboard/Test/StringArray', 'string[]', ['Hello', 'OutlineViewer', '!']);

  // Add some topics without the SmartDashboard prefix
  addTopic('/Test/Boolean', 'boolean', false);
  addTopic('/Test/Number', 'double', 3.14159);
  addTopic('/Test/String', 'string', 'Direct test topic');

  // Update values periodically
  setInterval(updateValues, 1000);
}

// Update values periodically
function updateValues() {
  // Update boolean values
  const booleanTopics = [
    topics.get('/SmartDashboard/Test/Boolean'),
    topics.get('/Test/Boolean')
  ];

  for (const topic of booleanTopics) {
    if (topic) {
      topic.value = !topic.value;
      broadcastValue(topic);
    }
  }

  // Update number values
  const numberTopics = [
    topics.get('/SmartDashboard/Test/Number'),
    topics.get('/Test/Number')
  ];

  for (const topic of numberTopics) {
    if (topic) {
      topic.value = Math.round(Math.random() * 100);
      broadcastValue(topic);
    }
  }

  // Update string values
  const stringTopics = [
    topics.get('/SmartDashboard/Test/String'),
    topics.get('/Test/String')
  ];

  for (const topic of stringTopics) {
    if (topic) {
      topic.value = `Hello OutlineViewer! ${new Date().toLocaleTimeString()}`;
      broadcastValue(topic);
    }
  }
}

// Handle binary message
function handleBinaryMessage(message, ws, clientId) {
  // First byte is the message type
  const messageType = message[0];

  console.log(`Binary message type: ${messageType}`);

  // Handle subscription message (type 3)
  if (messageType === 3) {
    // This is a subscription request
    console.log('Received subscription request from OutlineViewer');

    // Read subscription ID
    const subscriptionId = message.readUInt32LE(1);
    console.log(`Subscription ID: ${subscriptionId}`);

    // Send subscription acknowledgement
    const ackBuffer = Buffer.alloc(5);
    ackBuffer[0] = 4; // Subscription ACK message type
    ackBuffer.writeUInt32LE(subscriptionId, 1); // Subscription ID
    ws.send(ackBuffer);

    // Send all topic values
    for (const topic of topics.values()) {
      sendValue(ws, topic);
    }
  }
  // Handle client hello message (type 0)
  else if (messageType === 0) {
    console.log('Received client hello message from OutlineViewer');

    // Send server hello response
    const helloBuffer = Buffer.alloc(9);
    helloBuffer[0] = 1; // Server hello message type
    helloBuffer.writeUInt32LE(0x0400, 1); // Protocol version (4.0.0)
    helloBuffer.writeUInt32LE(0, 5); // Server time (0 for now)
    ws.send(helloBuffer);

    // Announce all topics
    for (const topic of topics.values()) {
      sendAnnounce(ws, topic);
    }
  }
}

// Add a topic
function addTopic(name, type, value) {
  const topic = {
    name,
    id: nextTopicId++,
    type,
    properties: {},
    value,
    timestamp: Date.now() * 1000
  };

  topics.set(name, topic);
  console.log(`Topic added: ${name} (id: ${topic.id}, type: ${type})`);

  return topic;
}

// Send announce message
function sendAnnounce(ws, topic) {
  // Create announce message
  const nameBuffer = Buffer.from(topic.name, 'utf8');
  const typeBuffer = Buffer.from(topic.type, 'utf8');

  // Calculate message size
  const messageSize = 1 + 4 + 4 + nameBuffer.length + 4 + typeBuffer.length + 4;

  // Create message buffer
  const buffer = Buffer.alloc(messageSize);

  // Write message type (0x00 = announce)
  buffer[0] = 0x00;

  // Write topic ID
  buffer.writeUInt32LE(topic.id, 1);

  // Write name length and name
  buffer.writeUInt32LE(nameBuffer.length, 5);
  nameBuffer.copy(buffer, 9);

  // Write type length and type
  buffer.writeUInt32LE(typeBuffer.length, 9 + nameBuffer.length);
  typeBuffer.copy(buffer, 13 + nameBuffer.length);

  // Write properties count (0 for now)
  buffer.writeUInt32LE(0, 13 + nameBuffer.length + typeBuffer.length);

  // Send message
  ws.send(buffer);
}

// Send value message
function sendValue(ws, topic) {
  // Create value message based on type
  let valueBuffer;

  if (topic.type === 'boolean') {
    valueBuffer = Buffer.alloc(1);
    valueBuffer[0] = topic.value ? 1 : 0;
  } else if (topic.type === 'double') {
    valueBuffer = Buffer.alloc(8);
    valueBuffer.writeDoubleLE(topic.value, 0);
  } else if (topic.type === 'string') {
    const strBuffer = Buffer.from(topic.value, 'utf8');
    valueBuffer = Buffer.alloc(4 + strBuffer.length);
    valueBuffer.writeUInt32LE(strBuffer.length, 0);
    strBuffer.copy(valueBuffer, 4);
  } else if (topic.type === 'boolean[]') {
    valueBuffer = Buffer.alloc(4 + topic.value.length);
    valueBuffer.writeUInt32LE(topic.value.length, 0);
    for (let i = 0; i < topic.value.length; i++) {
      valueBuffer[4 + i] = topic.value[i] ? 1 : 0;
    }
  } else if (topic.type === 'double[]') {
    valueBuffer = Buffer.alloc(4 + topic.value.length * 8);
    valueBuffer.writeUInt32LE(topic.value.length, 0);
    for (let i = 0; i < topic.value.length; i++) {
      valueBuffer.writeDoubleLE(topic.value[i], 4 + i * 8);
    }
  } else if (topic.type === 'string[]') {
    // Calculate total size
    let totalSize = 4; // Array length
    const strBuffers = [];
    for (const str of topic.value) {
      const strBuffer = Buffer.from(str, 'utf8');
      strBuffers.push(strBuffer);
      totalSize += 4 + strBuffer.length; // String length + string data
    }

    // Create buffer
    valueBuffer = Buffer.alloc(totalSize);
    valueBuffer.writeUInt32LE(topic.value.length, 0);

    // Write strings
    let offset = 4;
    for (const strBuffer of strBuffers) {
      valueBuffer.writeUInt32LE(strBuffer.length, offset);
      strBuffer.copy(valueBuffer, offset + 4);
      offset += 4 + strBuffer.length;
    }
  } else {
    console.error(`Unsupported type: ${topic.type}`);
    return;
  }

  // Calculate message size
  const messageSize = 1 + 4 + 8 + valueBuffer.length;

  // Create message buffer
  const buffer = Buffer.alloc(messageSize);

  // Write message type (0x02 = value)
  buffer[0] = 0x02;

  // Write topic ID
  buffer.writeUInt32LE(topic.id, 1);

  // Write timestamp
  const timestamp = BigInt(topic.timestamp);
  buffer.writeBigUInt64LE(timestamp, 5);

  // Write value
  valueBuffer.copy(buffer, 13);

  // Send message
  ws.send(buffer);
}

// Broadcast value to all clients
function broadcastValue(topic) {
  for (const client of clients.values()) {
    sendValue(client, topic);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down NT4 Direct Server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
