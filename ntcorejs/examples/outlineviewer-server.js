/**
 * NetworkTables Server for OutlineViewer
 * 
 * This is a server that listens on both NT3 port (1735) and NT4 port (5810)
 * to try to be compatible with OutlineViewer.
 */

const WebSocket = require('ws');
const net = require('net');
const msgpack = require('@msgpack/msgpack');
const fs = require('fs');

// Create a log file
const logStream = fs.createWriteStream('outlineviewer-server.log', { flags: 'a' });

// Log function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  console.log(message);
  logStream.write(logMessage);
}

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

// Create a WebSocket server for NT4
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

// Create a TCP server for NT3
const tcpServer = net.createServer();

// Create test topics
function createTestTopics() {
  log('Creating test topics...');
  
  // Boolean
  createTopic('/server/boolean', 'boolean', true, DataType.Boolean, {
    persistent: true,
    retained: true
  });
  
  // Number
  createTopic('/server/number', 'double', 3.14159, DataType.Double, {
    persistent: true,
    retained: true
  });
  
  // String
  createTopic('/server/string', 'string', 'Hello from NT4 server!', DataType.String, {
    persistent: true,
    retained: true
  });
  
  // Boolean array
  createTopic('/server/boolean_array', 'boolean[]', [true, false, true], DataType.BooleanArray, {
    persistent: true,
    retained: true
  });
  
  // Number array
  createTopic('/server/number_array', 'double[]', [1.1, 2.2, 3.3, 4.4], DataType.DoubleArray, {
    persistent: true,
    retained: true
  });
  
  // String array
  createTopic('/server/string_array', 'string[]', ['one', 'two', 'three'], DataType.StringArray, {
    persistent: true,
    retained: true
  });
  
  // Start updating a counter
  let counter = 0;
  createTopic('/server/counter', 'double', counter, DataType.Double, {
    persistent: true,
    retained: true
  });
  
  // Update counter periodically
  setInterval(() => {
    updateTopicValue('/server/counter', counter++, DataType.Double);
    
    if (counter % 10 === 0) {
      log(`Counter updated: ${counter-1}`);
    }
  }, 1000);
}

// Create a topic
function createTopic(name, type, value, valueType, properties = {}) {
  // Check if topic already exists
  if (topics.has(name)) {
    log(`Topic ${name} already exists`);
    return;
  }
  
  // Create topic
  const id = nextTopicId++;
  const topic = {
    id,
    name,
    type,
    properties: { ...properties },
    value: {
      type: valueType,
      value,
      timestamp: Date.now() * 1000
    }
  };
  
  topics.set(name, topic);
  
  // Broadcast topic to all clients
  broadcastTopic(topic);
  
  log(`Topic created: ${name} (${type}) with ID ${id}`);
  
  return topic;
}

// Update a topic value
function updateTopicValue(name, value, type) {
  // Check if topic exists
  if (!topics.has(name)) {
    log(`Topic ${name} not found`);
    return;
  }
  
  // Get topic
  const topic = topics.get(name);
  
  // Update topic value
  topic.value = {
    type,
    value,
    timestamp: Date.now() * 1000
  };
  
  // Broadcast value to all clients
  broadcastValue(topic.id, type, value, topic.value.timestamp);
}

// Broadcast topic to all clients
function broadcastTopic(topic) {
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
  
  // Send to all clients
  const jsonMessage = JSON.stringify(announceMessage);
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(jsonMessage);
      
      // Send value if available
      if (topic.value !== null) {
        sendValue(client, topic.id, topic.value.type, topic.value.value, topic.value.timestamp);
      }
    }
  });
}

// Broadcast value to all clients
function broadcastValue(id, type, value, timestamp) {
  // Create value message - NetworkTables 4.1 expects an array with 4 elements: [id, timestamp, type, value]
  const valueMessage = [id, timestamp, type, value];
  
  // Send as binary MessagePack
  const encoded = msgpack.encode(valueMessage);
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(encoded);
    }
  });
}

// Send value message to a client
function sendValue(ws, id, type, value, timestamp) {
  // Create value message - NetworkTables 4.1 expects an array with 4 elements: [id, timestamp, type, value]
  const valueMessage = [id, timestamp, type, value];
  
  // Send as binary MessagePack
  const encoded = msgpack.encode(valueMessage);
  ws.send(encoded);
}

// Handle WebSocket connection
wss.on('connection', (ws, request) => {
  const clientAddress = request.socket.remoteAddress;
  log(`Client connected from ${clientAddress}`);
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
          
          // Handle binary message
          handleBinaryMessage(ws, decoded);
        } catch (mpError) {
          log(`Failed to decode MessagePack: ${mpError}`);
          
          // Try to parse as JSON
          try {
            const jsonString = data.toString('utf8');
            log(`As UTF-8: ${jsonString}`);
            
            try {
              const jsonData = JSON.parse(jsonString);
              log(`Parsed JSON: ${JSON.stringify(jsonData)}`);
              
              // Handle JSON message
              handleJsonMessage(ws, jsonData);
            } catch (jsonError) {
              log(`Failed to parse JSON: ${jsonError}`);
            }
          } catch (error) {
            log(`Not valid UTF-8: ${error}`);
          }
        }
      } else if (typeof data === 'string') {
        log(`Text message received: ${data}`);
        
        try {
          const jsonData = JSON.parse(data);
          log(`Parsed JSON: ${JSON.stringify(jsonData)}`);
          
          // Handle JSON message
          handleJsonMessage(ws, jsonData);
        } catch (jsonError) {
          log(`Failed to parse JSON: ${jsonError}`);
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
  
  // Send all topics to the client
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
    
    // Send as JSON
    const jsonMessage = JSON.stringify(announceMessage);
    ws.send(jsonMessage);
    
    // Send value if available
    if (topic.value !== null) {
      sendValue(ws, topic.id, topic.value.type, topic.value.value, topic.value.timestamp);
    }
  }
});

// Handle binary message
function handleBinaryMessage(ws, message) {
  // Check if it's a value update
  if (Array.isArray(message) && message.length === 4) {
    const [id, timestamp, type, value] = message;
    log(`Value update: id=${id}, type=${type}, value=${JSON.stringify(value)}`);
    
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
        broadcastValue(id, type, value, timestamp);
        
        break;
      }
    }
  }
}

// Handle JSON message
function handleJsonMessage(ws, message) {
  // Check if it's an array (control message)
  if (Array.isArray(message)) {
    for (const msg of message) {
      handleControlMessage(ws, msg);
    }
  }
}

// Handle control message
function handleControlMessage(ws, message) {
  if (!message.method) {
    log(`Invalid control message, missing method: ${JSON.stringify(message)}`);
    return;
  }
  
  log(`Control message: ${message.method}`);
  
  switch (message.method) {
    case 'subscribe':
      handleSubscribe(ws, message);
      break;
    case 'publish':
      handlePublish(ws, message);
      break;
    case 'unpublish':
      handleUnpublish(ws, message);
      break;
    case 'setproperties':
      handleSetProperties(ws, message);
      break;
    default:
      log(`Unknown method: ${message.method}`);
  }
}

// Handle subscribe message
function handleSubscribe(ws, message) {
  const { subuid, topics: topicPatterns, options = {} } = message.params;
  
  log(`Client subscribing to topics: ${topicPatterns ? topicPatterns.join(', ') : 'all'}`);
  
  // Send current values for matching topics
  for (const topic of topics.values()) {
    if (topicMatchesPatterns(topic.name, topicPatterns, options)) {
      // Send value if available
      if (topic.value !== null) {
        sendValue(ws, topic.id, topic.value.type, topic.value.value, topic.value.timestamp);
      }
    }
  }
}

// Handle publish message
function handlePublish(ws, message) {
  const { name, type, pubuid, properties } = message.params;
  
  log(`Client publishing topic: ${name} (${type})`);
  
  // Check if topic already exists
  if (topics.has(name)) {
    // Update existing topic
    const topic = topics.get(name);
    topic.type = type;
    
    // Update properties
    for (const [key, value] of Object.entries(properties)) {
      topic.properties[key] = value;
    }
    
    // Broadcast properties to all clients
    broadcastTopic(topic);
  } else {
    // Create new topic
    const id = nextTopicId++;
    const topic = {
      id,
      name,
      type,
      properties: { ...properties },
      value: null
    };
    
    topics.set(name, topic);
    
    // Broadcast topic to all clients
    broadcastTopic(topic);
    
    log(`Topic published: ${name} (${type}) with ID ${id}`);
  }
}

// Handle unpublish message
function handleUnpublish(ws, message) {
  const { pubuid } = message.params;
  
  // Find topic by pubuid
  for (const [name, topic] of topics.entries()) {
    if (topic.id === pubuid) {
      log(`Client unpublishing topic: ${name}`);
      
      // Remove topic
      topics.delete(name);
      
      // Broadcast unannounce to all clients
      const unannounceMessage = [{
        method: 'unannounce',
        params: {
          name
        }
      }];
      
      // Send to all clients
      const jsonMessage = JSON.stringify(unannounceMessage);
      
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(jsonMessage);
        }
      });
      
      break;
    }
  }
}

// Handle set properties message
function handleSetProperties(ws, message) {
  const { name, update } = message.params;
  
  log(`Client setting properties for topic: ${name}`);
  
  // Check if topic exists
  if (topics.has(name)) {
    const topic = topics.get(name);
    
    // Update properties
    for (const [key, value] of Object.entries(update)) {
      if (value === null) {
        delete topic.properties[key];
      } else {
        topic.properties[key] = value;
      }
    }
    
    // Broadcast properties to all clients
    const propertiesMessage = [{
      method: 'properties',
      params: {
        name,
        properties: topic.properties
      }
    }];
    
    // Send to all clients
    const jsonMessage = JSON.stringify(propertiesMessage);
    
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(jsonMessage);
      }
    });
  } else {
    log(`Topic ${name} not found`);
  }
}

// Check if topic matches patterns
function topicMatchesPatterns(topicName, patterns, options) {
  // If no patterns, match all
  if (!patterns || patterns.length === 0) {
    return true;
  }
  
  const prefixMatch = options.prefixMatch === true;
  
  for (const pattern of patterns) {
    if (prefixMatch) {
      if (topicName.startsWith(pattern)) {
        return true;
      }
    } else {
      if (topicName === pattern) {
        return true;
      }
    }
  }
  
  return false;
}

// Start the NT4 server
log('Starting NT4 server on port 5810...');
log('Starting NT3 server on port 1735...');

// Start the NT3 server
tcpServer.listen(1735, () => {
  log('NT3 server listening on port 1735');
});

// Handle NT3 connections
tcpServer.on('connection', (socket) => {
  const clientAddress = socket.remoteAddress;
  log(`NT3 client connected from ${clientAddress}`);
  
  // Handle data
  socket.on('data', (data) => {
    log(`NT3 data received, length: ${data.length}`);
    log(`First 32 bytes: ${Array.from(data.slice(0, Math.min(32, data.length))).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
  });
  
  // Handle close
  socket.on('close', () => {
    log('NT3 client disconnected');
  });
  
  // Handle errors
  socket.on('error', (error) => {
    log(`NT3 socket error: ${error}`);
  });
});

// Create test topics
createTestTopics();

// Handle process termination
process.on('SIGINT', () => {
  log('Stopping servers...');
  wss.close();
  tcpServer.close();
  process.exit(0);
});
