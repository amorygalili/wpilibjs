/**
 * Simple NetworkTables 4.1 Server
 * 
 * This is a simple server that implements the NetworkTables 4.1 protocol.
 * It can be used to test our implementation with OutlineViewer.
 */

const WebSocket = require('ws');
const fs = require('fs');

// Create a log file
const logStream = fs.createWriteStream('simple-nt4-server.log', { flags: 'a' });

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

// Store topics
const topics = new Map();
let nextTopicId = 1;

// Store clients
const clients = new Map();
let nextClientId = 1;

// Handle connections
wss.on('connection', (ws, request) => {
  const clientId = nextClientId++;
  const clientInfo = {
    id: clientId,
    address: request.socket.remoteAddress,
    protocol: ws.protocol,
    subscriptions: new Map()
  };
  
  clients.set(clientId, clientInfo);
  
  log(`Client ${clientId} connected from ${clientInfo.address}`);
  log(`Protocol: ${clientInfo.protocol}`);
  
  // Handle messages
  ws.on('message', (data) => {
    try {
      if (data instanceof Buffer) {
        log(`Binary message from client ${clientId}, length: ${data.length}`);
        log(`First 32 bytes: ${Array.from(data.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
        
        // Try to parse as JSON
        try {
          const jsonString = data.toString('utf8');
          log(`As UTF-8: ${jsonString}`);
          
          try {
            const jsonData = JSON.parse(jsonString);
            log(`Parsed JSON: ${JSON.stringify(jsonData)}`);
            
            // Handle the message
            handleMessage(ws, clientInfo, jsonData);
          } catch (jsonError) {
            // Not valid JSON
            log(`Not valid JSON: ${jsonError}`);
          }
        } catch (error) {
          log(`Not valid UTF-8: ${error}`);
        }
      } else if (typeof data === 'string') {
        log(`Text message from client ${clientId}: ${data}`);
        
        try {
          const jsonData = JSON.parse(data);
          log(`Parsed JSON: ${JSON.stringify(jsonData)}`);
          
          // Handle the message
          handleMessage(ws, clientInfo, jsonData);
        } catch (jsonError) {
          log(`Not valid JSON: ${jsonError}`);
        }
      }
    } catch (error) {
      log(`Error processing message from client ${clientId}: ${error}`);
    }
  });
  
  // Handle close
  ws.on('close', () => {
    log(`Client ${clientId} disconnected`);
    clients.delete(clientId);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    log(`WebSocket error for client ${clientId}: ${error}`);
  });
  
  // Create test topics
  createTestTopics();
  
  // Send all topics to the client
  for (const topic of topics.values()) {
    sendAnnounce(ws, topic);
  }
});

// Handle message
function handleMessage(ws, clientInfo, message) {
  // Check if it's an array (control message)
  if (Array.isArray(message)) {
    for (const msg of message) {
      handleControlMessage(ws, clientInfo, msg);
    }
  } 
  // Check if it's a value update
  else if (typeof message === 'object' && message.id !== undefined) {
    handleValueMessage(ws, clientInfo, message);
  }
}

// Handle control message
function handleControlMessage(ws, clientInfo, message) {
  if (!message.method) {
    log(`Invalid control message from client ${clientInfo.id}, missing method: ${JSON.stringify(message)}`);
    return;
  }
  
  log(`Control message from client ${clientInfo.id}: ${message.method}`);
  
  switch (message.method) {
    case 'publish':
      handlePublish(ws, clientInfo, message);
      break;
    case 'unpublish':
      handleUnpublish(ws, clientInfo, message);
      break;
    case 'subscribe':
      handleSubscribe(ws, clientInfo, message);
      break;
    case 'unsubscribe':
      handleUnsubscribe(ws, clientInfo, message);
      break;
    case 'setproperties':
      handleSetProperties(ws, clientInfo, message);
      break;
    default:
      log(`Unknown method from client ${clientInfo.id}: ${message.method}`);
  }
}

// Handle publish message
function handlePublish(ws, clientInfo, message) {
  const { name, type, pubuid, properties } = message.params;
  
  log(`Client ${clientInfo.id} publishing topic: ${name} (${type})`);
  
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
    broadcastProperties(name, topic.properties);
  } else {
    // Create new topic
    const id = nextTopicId++;
    const topic = {
      id,
      name,
      type,
      properties: { ...properties },
      value: null,
      publisher: clientInfo.id,
      pubuid
    };
    
    topics.set(name, topic);
    
    // Broadcast topic to all clients
    broadcastTopic(topic);
  }
}

// Handle unpublish message
function handleUnpublish(ws, clientInfo, message) {
  const { pubuid } = message.params;
  
  // Find topic by pubuid
  for (const [name, topic] of topics.entries()) {
    if (topic.publisher === clientInfo.id && topic.pubuid === pubuid) {
      log(`Client ${clientInfo.id} unpublishing topic: ${name}`);
      
      // Remove topic
      topics.delete(name);
      
      // Broadcast unannounce to all clients
      broadcastUnannounce(name);
      
      break;
    }
  }
}

// Handle subscribe message
function handleSubscribe(ws, clientInfo, message) {
  const { subuid, topics: topicPatterns, options = {} } = message.params;
  
  log(`Client ${clientInfo.id} subscribing to topics: ${topicPatterns.join(', ')}`);
  
  // Store subscription
  clientInfo.subscriptions.set(subuid, {
    patterns: topicPatterns,
    options
  });
  
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

// Handle unsubscribe message
function handleUnsubscribe(ws, clientInfo, message) {
  const { subuid } = message.params;
  
  log(`Client ${clientInfo.id} unsubscribing: ${subuid}`);
  
  // Remove subscription
  clientInfo.subscriptions.delete(subuid);
}

// Handle set properties message
function handleSetProperties(ws, clientInfo, message) {
  const { name, update } = message.params;
  
  log(`Client ${clientInfo.id} setting properties for topic: ${name}`);
  
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
    broadcastProperties(name, topic.properties);
  }
}

// Handle value message
function handleValueMessage(ws, clientInfo, message) {
  const { id, timestamp, type, value } = message;
  
  // Find topic by ID
  for (const [name, topic] of topics.entries()) {
    if (topic.id === id) {
      log(`Client ${clientInfo.id} updating value for topic: ${name}`);
      
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

// Check if topic matches patterns
function topicMatchesPatterns(topicName, patterns, options) {
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

// Send announce message to a client
function sendAnnounce(ws, topic) {
  const message = [{
    method: 'announce',
    params: {
      name: topic.name,
      id: topic.id,
      type: topic.type,
      properties: topic.properties
    }
  }];
  
  ws.send(JSON.stringify(message));
  
  // Send value if available
  if (topic.value !== null) {
    sendValue(ws, topic.id, topic.value.type, topic.value.value, topic.value.timestamp);
  }
}

// Send value message to a client
function sendValue(ws, id, type, value, timestamp) {
  const message = {
    id,
    timestamp,
    type,
    value
  };
  
  ws.send(JSON.stringify(message));
}

// Broadcast topic to all clients
function broadcastTopic(topic) {
  const message = [{
    method: 'announce',
    params: {
      name: topic.name,
      id: topic.id,
      type: topic.type,
      properties: topic.properties
    }
  }];
  
  broadcast(JSON.stringify(message));
  
  log(`Topic announced: ${topic.name} (${topic.type})`);
}

// Broadcast unannounce to all clients
function broadcastUnannounce(name) {
  const message = [{
    method: 'unannounce',
    params: {
      name
    }
  }];
  
  broadcast(JSON.stringify(message));
  
  log(`Topic unannounced: ${name}`);
}

// Broadcast properties to all clients
function broadcastProperties(name, properties) {
  const message = [{
    method: 'properties',
    params: {
      name,
      properties
    }
  }];
  
  broadcast(JSON.stringify(message));
  
  log(`Properties updated for topic: ${name}`);
}

// Broadcast value to all clients
function broadcastValue(id, type, value, timestamp) {
  const message = {
    id,
    timestamp,
    type,
    value
  };
  
  broadcast(JSON.stringify(message));
  
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
    log(`Value updated for ${topicName}: id=${id}, type=${type}, value=${JSON.stringify(value)}`);
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
  if (topics.size === 0) {
    log('Creating test topics...');
    
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
    },
    publisher: 0, // Server is publisher
    pubuid: id
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
  
  broadcastValue(topic.id, typeId, value, topic.value.timestamp);
}

// Start the server
log('Simple NetworkTables 4.1 Server started on port 5810');
log('Connect OutlineViewer to localhost:5810');
