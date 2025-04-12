/**
 * Minimal NetworkTables Server for OutlineViewer
 * 
 * This is a minimal server that focuses solely on the protocol that OutlineViewer expects.
 */

const WebSocket = require('ws');
const msgpack = require('@msgpack/msgpack');

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
  console.log(`Client connected: ${request.socket.remoteAddress}`);
  console.log(`Protocol: ${ws.protocol}`);
  
  // Handle client subscription message
  ws.on('message', (data) => {
    try {
      if (data instanceof Buffer) {
        console.log(`Binary message received, length: ${data.length}`);
        console.log(`First 16 bytes: ${Array.from(data.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
        
        try {
          // Try to decode as MessagePack
          const decoded = msgpack.decode(data);
          console.log(`Decoded MessagePack: ${JSON.stringify(decoded)}`);
          
          // Check if it's a subscription message
          if (Array.isArray(decoded) && decoded.length >= 3 && decoded[0] === -1) {
            // This appears to be a subscription message
            // Send all topics to the client
            sendAllTopics(ws);
          }
        } catch (error) {
          console.error(`Failed to decode MessagePack: ${error}`);
        }
      }
    } catch (error) {
      console.error(`Error processing message: ${error}`);
    }
  });
  
  // Handle close
  ws.on('close', () => {
    console.log('Client disconnected');
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error: ${error}`);
  });
  
  // Create test topics
  createTestTopics();
  
  // Send all topics to the client
  sendAllTopics(ws);
});

// Create test topics
function createTestTopics() {
  if (topics.size === 0) {
    console.log('Creating test topics...');
    
    // Boolean
    createTopic('/test/boolean', 'boolean', DataType.Boolean, true);
    
    // Number
    createTopic('/test/number', 'double', DataType.Double, 3.14159);
    
    // String
    createTopic('/test/string', 'string', DataType.String, 'Hello from ntcorejs!');
    
    // Boolean array
    createTopic('/test/boolean_array', 'boolean[]', DataType.BooleanArray, [true, false, true]);
    
    // Number array
    createTopic('/test/number_array', 'double[]', DataType.DoubleArray, [1.1, 2.2, 3.3, 4.4]);
    
    // String array
    createTopic('/test/string_array', 'string[]', DataType.StringArray, ['one', 'two', 'three']);
    
    console.log(`Created ${topics.size} test topics`);
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
      'source': 'ntcorejs'
    },
    value: {
      type: typeId,
      value,
      timestamp: Date.now() * 1000
    }
  };
  
  topics.set(name, topic);
  console.log(`Created topic: ${name} (${type})`);
  
  return topic;
}

// Send all topics to a client
function sendAllTopics(ws) {
  console.log(`Sending ${topics.size} topics to client...`);
  
  // Send each topic as a separate announce message
  for (const topic of topics.values()) {
    // Create announce message
    const announceMessage = [{
      method: 'announce',
      params: {
        name: topic.name,
        id: topic.id,
        type: topic.type,
        properties: topic.properties,
        pubuid: topic.id
      }
    }];
    
    // Send as MessagePack
    try {
      const encoded = msgpack.encode(announceMessage);
      console.log(`Sending topic ${topic.name} announce message, length: ${encoded.length}`);
      ws.send(encoded);
    } catch (error) {
      console.error(`Error encoding announce message for ${topic.name}: ${error}`);
    }
    
    // Send value message
    try {
      const valueMessage = {
        id: topic.id,
        timestamp: topic.value.timestamp,
        type: topic.value.type,
        value: topic.value.value
      };
      
      const encoded = msgpack.encode(valueMessage);
      console.log(`Sending topic ${topic.name} value message, length: ${encoded.length}`);
      ws.send(encoded);
    } catch (error) {
      console.error(`Error encoding value message for ${topic.name}: ${error}`);
    }
  }
  
  console.log('All topics sent to client');
}

// Start the server
console.log('Server started on port 5810');
console.log('Connect OutlineViewer to localhost:5810');
