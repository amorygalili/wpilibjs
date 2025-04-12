/**
 * Exact OutlineViewer Compatible Server
 * 
 * This server follows the exact protocol that OutlineViewer expects,
 * based on examination of the OutlineViewer source code.
 */

const WebSocket = require('ws');
const msgpack = require('@msgpack/msgpack');
const fs = require('fs');

// Create a log file
const logStream = fs.createWriteStream('outlineviewer-exact-server.log', { flags: 'a' });

// Log function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  console.log(message);
  logStream.write(logMessage);
}

// Create a WebSocket server
const wss = new WebSocket.Server({
  port: 5810,
  // Support both NT 4.0 and 4.1 protocols
  handleProtocols: (protocols, request) => {
    log('Client requested protocols: ' + JSON.stringify(Array.from(protocols)));
    
    // Convert Set to Array if needed
    const protocolArray = Array.isArray(protocols) ? protocols : Array.from(protocols);
    
    // Check if client supports NT 4.1
    if (protocolArray.indexOf('v4.1.networktables.first.wpi.edu') !== -1) {
      log('Using NT 4.1 protocol');
      return 'v4.1.networktables.first.wpi.edu';
    }
    
    // Fall back to NT 4.0
    if (protocolArray.indexOf('networktables.first.wpi.edu') !== -1) {
      log('Using NT 4.0 protocol');
      return 'networktables.first.wpi.edu';
    }
    
    // No supported protocol
    log('No supported protocol found');
    return false;
  }
});

// Define data types
const DataType = {
  Boolean: 0,
  Double: 1,
  Int: 2,
  Float: 3,
  String: 4,
  Raw: 5,
  BooleanArray: 16,
  DoubleArray: 17,
  IntArray: 18,
  FloatArray: 19,
  StringArray: 20
};

// Store topics
const topics = new Map();
let nextTopicId = 1;

// Handle connections
wss.on('connection', (ws, request) => {
  log(`Client connected from ${request.socket.remoteAddress}`);
  log(`Protocol: ${ws.protocol}`);
  
  // Handle messages
  ws.on('message', (data) => {
    try {
      if (data instanceof Buffer) {
        log(`Binary message received, length: ${data.length}`);
        log(`First 32 bytes: ${Array.from(data.slice(0, Math.min(32, data.length))).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
        
        try {
          // Try to decode as MessagePack
          const decoded = msgpack.decode(data);
          log(`Decoded MessagePack: ${JSON.stringify(decoded)}`);
          
          // Check if it's a subscription message
          if (Array.isArray(decoded) && decoded.length >= 3 && decoded[0] === -1) {
            // This appears to be a subscription message
            // Send all topics to the client
            sendAllTopics(ws);
          }
        } catch (error) {
          log(`Failed to decode MessagePack: ${error}`);
        }
      }
    } catch (error) {
      log(`Error processing message: ${error}`);
    }
  });
  
  // Handle close
  ws.on('close', () => {
    log('Client disconnected');
  });
  
  // Handle errors
  ws.on('error', (error) => {
    log(`WebSocket error: ${error}`);
  });
  
  // Create test topics
  createTestTopics();
  
  // Send all topics to the client
  sendAllTopics(ws);
});

// Create test topics
function createTestTopics() {
  if (topics.size === 0) {
    log('Creating test topics...');
    
    // Boolean
    createTopic('/server/boolean', 'boolean', DataType.Boolean, true);
    
    // Number
    createTopic('/server/number', 'double', DataType.Double, 3.14159);
    
    // String
    createTopic('/server/string', 'string', DataType.String, 'Hello from NT4 server!');
    
    // Boolean array
    createTopic('/server/boolean_array', 'boolean[]', DataType.BooleanArray, [true, false, true]);
    
    // Number array
    createTopic('/server/number_array', 'double[]', DataType.DoubleArray, [1.1, 2.2, 3.3, 4.4]);
    
    // String array
    createTopic('/server/string_array', 'string[]', DataType.StringArray, ['one', 'two', 'three']);
    
    // Start updating a counter
    let counter = 0;
    const counterTopic = createTopic('/server/counter', 'double', DataType.Double, counter);
    
    setInterval(() => {
      updateTopicValue(counterTopic, DataType.Double, counter++);
      
      if (counter % 10 === 0) {
        log(`Counter updated: ${counter-1}`);
      }
    }, 1000);
    
    log(`Created ${topics.size} test topics`);
  }
}

// Create a topic
function createTopic(name, type, typeId, value) {
  const id = nextTopicId++;
  
  const topic = {
    id,
    name,
    type,
    typeId,
    properties: {
      persistent: true,
      retained: true,
      'rawType': type,
      'typeString': type,
      '.type': type,
      'source': 'nt4-server'
    },
    value: {
      type: typeId,
      value,
      timestamp: Date.now() * 1000
    }
  };
  
  topics.set(name, topic);
  log(`Created topic: ${name} (${type})`);
  
  return topic;
}

// Update a topic value
function updateTopicValue(topic, typeId, value) {
  topic.value = {
    type: typeId,
    value,
    timestamp: Date.now() * 1000
  };
  
  // Broadcast value to all clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      sendValue(client, topic.id, typeId, value, topic.value.timestamp);
    }
  });
}

// Send all topics to a client
function sendAllTopics(ws) {
  log(`Sending ${topics.size} topics to client...`);
  
  // Send each topic as a separate announce message
  for (const topic of topics.values()) {
    sendAnnounce(ws, topic);
    
    // Wait a short time between messages to avoid overwhelming the client
    setTimeout(() => {
      if (topic.value) {
        sendValue(ws, topic.id, topic.value.type, topic.value.value, topic.value.timestamp);
      }
    }, 100);
  }
  
  log('All topics sent to client');
}

// Send announce message to a client
function sendAnnounce(ws, topic) {
  // Create announce message exactly as expected by OutlineViewer
  const announceMessage = [{
    method: 'announce',
    params: {
      name: topic.name,
      id: topic.id,
      type: topic.type,
      properties: topic.properties,
      pubuid: topic.id  // Include pubuid as required by OutlineViewer
    }
  }];
  
  // Send as JSON
  const jsonMessage = JSON.stringify(announceMessage);
  ws.send(jsonMessage);
  log(`Sent announce message for ${topic.name}: ${jsonMessage}`);
}

// Send value message to a client
function sendValue(ws, id, type, value, timestamp) {
  // Based on WireEncoder.cpp, OutlineViewer expects a binary MessagePack message
  // with an array of 4 elements: [id, timestamp, type, value]
  try {
    const valueArray = [id, timestamp, type, value];
    const encoded = msgpack.encode(valueArray);
    ws.send(encoded);
    
    // Find topic name for this ID
    let topicName = 'unknown';
    for (const [name, topic] of topics.entries()) {
      if (topic.id === id) {
        topicName = name;
        break;
      }
    }
    
    // Log value updates (except for counter to reduce noise)
    if (!topicName.includes('counter')) {
      log(`Sent binary value message for ${topicName}: ${JSON.stringify(valueArray)}`);
    }
  } catch (error) {
    log(`Error encoding value message: ${error}`);
  }
}

// Start the server
log('Exact OutlineViewer Compatible Server started on port 5810');
log('Connect OutlineViewer to localhost:5810');
