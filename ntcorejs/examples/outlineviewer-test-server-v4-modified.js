/**
 * NetworkTables 4.1 Server for OutlineViewer
 * 
 * This is a modified version of the v4 server that better logs responses from OutlineViewer
 * and handles new topics and values.
 */

const WebSocket = require('ws');
const msgpack = require('@msgpack/msgpack');
const fs = require('fs');

// Create a log file
const logStream = fs.createWriteStream('outlineviewer-test-server-v4-modified.log', { flags: 'a' });

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

// Create test topics
function createTestTopics() {
  log('Creating test topics...');
  
  // Boolean
  createTopic('/test/boolean', 'boolean', true, DataType.Boolean, {
    persistent: true,
    retained: true,
    rawType: 'boolean',
    typeString: 'boolean',
    '.type': 'boolean',
    source: 'ntcorejs'
  });
  
  // Number
  createTopic('/test/number', 'double', 3.14159, DataType.Double, {
    persistent: true,
    retained: true,
    rawType: 'double',
    typeString: 'double',
    '.type': 'double',
    source: 'ntcorejs'
  });
  
  // String
  createTopic('/test/string', 'string', 'Hello from ntcorejs!', DataType.String, {
    persistent: true,
    retained: true,
    rawType: 'string',
    typeString: 'string',
    '.type': 'string',
    source: 'ntcorejs'
  });
  
  // Boolean array
  createTopic('/test/boolean_array', 'boolean[]', [true, false, true], DataType.BooleanArray, {
    persistent: true,
    retained: true,
    rawType: 'boolean[]',
    typeString: 'boolean[]',
    '.type': 'boolean[]',
    source: 'ntcorejs'
  });
  
  // Number array
  createTopic('/test/number_array', 'double[]', [1.1, 2.2, 3.3, 4.4], DataType.DoubleArray, {
    persistent: true,
    retained: true,
    rawType: 'double[]',
    typeString: 'double[]',
    '.type': 'double[]',
    source: 'ntcorejs'
  });
  
  // String array
  createTopic('/test/string_array', 'string[]', ['one', 'two', 'three'], DataType.StringArray, {
    persistent: true,
    retained: true,
    rawType: 'string[]',
    typeString: 'string[]',
    '.type': 'string[]',
    source: 'ntcorejs'
  });
  
  // Start updating a counter
  let counter = 0;
  createTopic('/test/counter', 'double', counter, DataType.Double, {
    persistent: true,
    retained: true,
    rawType: 'double',
    typeString: 'double',
    '.type': 'double',
    source: 'ntcorejs'
  });
  
  // Update counter periodically
  setInterval(() => {
    updateTopicValue('/test/counter', counter++, DataType.Double);
    
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
  
  // Announce topic
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
  
  const announceJson = JSON.stringify(announceMessage);
  log(`Topic announced: ${name} (${type})`);
  log(`Announce message: ${announceJson}`);
  
  // Broadcast to all clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(announceJson);
      
      // Send value
      if (topic.value !== null) {
        sendValue(client, topic.id, topic.value.type, topic.value.value, topic.value.timestamp);
      }
    }
  });
  
  log(`Created topic ${name} with ID ${id}:
 - Type: ${type} (ID: ${valueType})
 - Properties: ${JSON.stringify(properties)}
 - Value: ${JSON.stringify(value)}`);
  
  return topic;
}

// Update a topic value
function updateTopicValue(name, value, valueType) {
  // Check if topic exists
  if (!topics.has(name)) {
    log(`Topic ${name} not found`);
    return;
  }
  
  // Get topic
  const topic = topics.get(name);
  
  // Update topic value
  topic.value = {
    type: valueType,
    value,
    timestamp: Date.now() * 1000
  };
  
  log(`Value updated for ${name}: id=${topic.id}, type=${valueType}, value=${JSON.stringify(value)}`);
  
  // Broadcast to all clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      sendValue(client, topic.id, valueType, value, topic.value.timestamp);
    }
  });
  
  log(`Updated topic ${name} with ID ${topic.id}:
 - Type: ${topic.type} (ID: ${valueType})
 - Properties: ${JSON.stringify(topic.properties)}
 - Value: ${JSON.stringify(value)}`);
}

// Send value to a client
function sendValue(client, id, type, value, timestamp) {
  // Create value message
  const valueMessage = [id, timestamp, type, value];
  
  // Send as binary MessagePack
  const encoded = msgpack.encode(valueMessage);
  client.send(encoded);
  
  log(`Sent value to client: id=${id}, type=${type}`);
}

// Handle WebSocket connection
wss.on('connection', (ws, request) => {
  const clientAddress = request.socket.remoteAddress;
  log(`Client connected: ${clientAddress}`);
  log(`Protocol: ${ws.protocol}`);
  
  // Send all topics to the client
  for (const topic of topics.values()) {
    // Announce topic
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
    
    const announceJson = JSON.stringify(announceMessage);
    ws.send(announceJson);
    log(`Announced topic to client: ${topic.name} (${topic.type})`);
    
    // Send value
    if (topic.value !== null) {
      sendValue(ws, topic.id, topic.value.type, topic.value.value, topic.value.timestamp);
    }
  }
  
  // Handle messages
  ws.on('message', (data) => {
    try {
      if (data instanceof Buffer) {
        log(`Binary message received, length: ${data.length}`);
        log(`First 16 bytes: ${Array.from(data.slice(0, Math.min(16, data.length))).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
        
        try {
          // Try to decode as MessagePack
          const decoded = msgpack.decode(data);
          log(`Decoded MessagePack: ${JSON.stringify(decoded)}`);
          
          // Check if it's a value update
          if (Array.isArray(decoded) && decoded.length === 4) {
            const [id, timestamp, type, value] = decoded;
            log(`Value update from client: id=${id}, type=${type}, value=${JSON.stringify(value)}`);
            
            // Find topic by ID
            let topicName = null;
            for (const [name, topic] of topics.entries()) {
              if (topic.id === id) {
                topicName = name;
                break;
              }
            }
            
            if (topicName) {
              // Update topic value
              const topic = topics.get(topicName);
              topic.value = {
                type,
                value,
                timestamp
              };
              
              log(`Updated topic ${topicName} with ID ${id}:
 - Type: ${topic.type} (ID: ${type})
 - Properties: ${JSON.stringify(topic.properties)}
 - Value: ${JSON.stringify(value)}`);
              
              // Broadcast to all other clients
              wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  sendValue(client, id, type, value, timestamp);
                }
              });
            } else {
              log(`Topic with ID ${id} not found`);
            }
          } else {
            // Try to parse as control message
            for (const item of decoded) {
              log(`Control message: ${item}`);
              
              if (typeof item === 'object' && item.method) {
                handleControlMessage(ws, item);
              } else {
                log(`Invalid control message, missing method: ${item}`);
              }
            }
          }
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
              if (Array.isArray(jsonData)) {
                for (const item of jsonData) {
                  if (item.method) {
                    handleControlMessage(ws, item);
                  } else {
                    log(`Invalid control message, missing method: ${JSON.stringify(item)}`);
                  }
                }
              }
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
          if (Array.isArray(jsonData)) {
            for (const item of jsonData) {
              if (item.method) {
                handleControlMessage(ws, item);
              } else {
                log(`Invalid control message, missing method: ${JSON.stringify(item)}`);
              }
            }
          }
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
});

// Handle control message
function handleControlMessage(ws, message) {
  const { method, params } = message;
  
  log(`Control method: ${method}`);
  log(`Control params: ${JSON.stringify(params)}`);
  
  switch (method) {
    case 'publish':
      handlePublish(ws, params);
      break;
    case 'unpublish':
      handleUnpublish(ws, params);
      break;
    case 'subscribe':
      handleSubscribe(ws, params);
      break;
    case 'unsubscribe':
      handleUnsubscribe(ws, params);
      break;
    case 'setproperties':
      handleSetProperties(ws, params);
      break;
    case 'announce':
      handleAnnounce(ws, params);
      break;
    case 'unannounce':
      handleUnannounce(ws, params);
      break;
    case 'properties':
      handleProperties(ws, params);
      break;
    default:
      log(`Unknown method: ${method}`);
  }
}

// Handle publish message
function handlePublish(ws, params) {
  const { name, type, pubuid, properties = {} } = params;
  
  log(`Client publishing topic: ${name} (${type})`);
  log(`Properties: ${JSON.stringify(properties)}`);
  
  // Check if topic already exists
  if (topics.has(name)) {
    // Update existing topic
    const topic = topics.get(name);
    topic.type = type;
    
    // Update properties
    for (const [key, value] of Object.entries(properties)) {
      topic.properties[key] = value;
    }
    
    log(`Updated existing topic ${name} with ID ${topic.id}`);
  } else {
    // Create new topic
    const id = nextTopicId++;
    const topic = {
      id,
      name,
      type,
      properties: { ...properties },
      value: null,
      pubuid
    };
    
    topics.set(name, topic);
    
    log(`Created new topic ${name} with ID ${id}`);
    
    // Announce topic to all clients
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
    
    const announceJson = JSON.stringify(announceMessage);
    
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(announceJson);
      }
    });
  }
}

// Handle unpublish message
function handleUnpublish(ws, params) {
  const { pubuid } = params;
  
  log(`Client unpublishing topic with pubuid: ${pubuid}`);
  
  // Find topic by pubuid
  for (const [name, topic] of topics.entries()) {
    if (topic.pubuid === pubuid) {
      // Remove topic
      topics.delete(name);
      
      log(`Removed topic ${name} with ID ${topic.id}`);
      
      // Announce removal to all clients
      const unannounceMessage = [{
        method: 'unannounce',
        params: {
          name
        }
      }];
      
      const unannounceJson = JSON.stringify(unannounceMessage);
      
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(unannounceJson);
        }
      });
      
      break;
    }
  }
}

// Handle subscribe message
function handleSubscribe(ws, params) {
  const { subuid, topics: topicPatterns = [''], options = {} } = params;
  
  log(`Client subscribing with subuid: ${subuid}`);
  log(`Topic patterns: ${JSON.stringify(topicPatterns)}`);
  log(`Options: ${JSON.stringify(options)}`);
  
  // Send matching topics
  for (const topic of topics.values()) {
    if (topicMatchesPatterns(topic.name, topicPatterns, options)) {
      // Send value
      if (topic.value !== null) {
        sendValue(ws, topic.id, topic.value.type, topic.value.value, topic.value.timestamp);
      }
    }
  }
}

// Handle unsubscribe message
function handleUnsubscribe(ws, params) {
  const { subuid } = params;
  
  log(`Client unsubscribing with subuid: ${subuid}`);
}

// Handle set properties message
function handleSetProperties(ws, params) {
  const { name, update } = params;
  
  log(`Client setting properties for topic: ${name}`);
  log(`Properties update: ${JSON.stringify(update)}`);
  
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
    
    log(`Properties updated for topic: ${name}`);
    
    // Broadcast properties to all clients
    const propertiesMessage = [{
      method: 'properties',
      params: {
        name,
        properties: topic.properties
      }
    }];
    
    const propertiesJson = JSON.stringify(propertiesMessage);
    
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(propertiesJson);
      }
    });
  } else {
    log(`Topic ${name} not found`);
  }
}

// Handle announce message
function handleAnnounce(ws, params) {
  const { name, id, type, properties, pubuid } = params;
  
  log(`Client announcing topic: ${name} (${type}) with ID ${id}`);
  log(`Properties: ${JSON.stringify(properties)}`);
  
  // Check if topic already exists
  if (topics.has(name)) {
    // Update existing topic
    const topic = topics.get(name);
    topic.type = type;
    topic.id = id;
    topic.pubuid = pubuid;
    
    // Update properties
    for (const [key, value] of Object.entries(properties)) {
      topic.properties[key] = value;
    }
    
    log(`Updated existing topic ${name} with ID ${id}`);
  } else {
    // Create new topic
    const topic = {
      id,
      name,
      type,
      properties: { ...properties },
      value: null,
      pubuid
    };
    
    topics.set(name, topic);
    
    log(`Created new topic ${name} with ID ${id}`);
  }
  
  // Broadcast to all other clients
  const announceMessage = [{
    method: 'announce',
    params: {
      name,
      id,
      type,
      properties,
      pubuid
    }
  }];
  
  const announceJson = JSON.stringify(announceMessage);
  
  wss.clients.forEach((client) => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(announceJson);
    }
  });
}

// Handle unannounce message
function handleUnannounce(ws, params) {
  const { name } = params;
  
  log(`Client unannouncing topic: ${name}`);
  
  // Remove topic
  if (topics.has(name)) {
    topics.delete(name);
    
    log(`Removed topic ${name}`);
    
    // Broadcast to all other clients
    const unannounceMessage = [{
      method: 'unannounce',
      params: {
        name
      }
    }];
    
    const unannounceJson = JSON.stringify(unannounceMessage);
    
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(unannounceJson);
      }
    });
  } else {
    log(`Topic ${name} not found`);
  }
}

// Handle properties message
function handleProperties(ws, params) {
  const { name, properties } = params;
  
  log(`Client setting properties for topic: ${name}`);
  log(`Properties: ${JSON.stringify(properties)}`);
  
  // Check if topic exists
  if (topics.has(name)) {
    const topic = topics.get(name);
    
    // Update properties
    for (const [key, value] of Object.entries(properties)) {
      if (value === null) {
        delete topic.properties[key];
      } else {
        topic.properties[key] = value;
      }
    }
    
    log(`Properties updated for topic: ${name}`);
    
    // Broadcast to all other clients
    const propertiesMessage = [{
      method: 'properties',
      params: {
        name,
        properties: topic.properties
      }
    }];
    
    const propertiesJson = JSON.stringify(propertiesMessage);
    
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(propertiesJson);
      }
    });
  } else {
    log(`Topic ${name} not found`);
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

// Start the server
log('Server started on port 5810');
log('Connect OutlineViewer to localhost:5810');

// Create test topics
createTestTopics();

// Handle process termination
process.on('SIGINT', () => {
  log('Stopping server...');
  wss.close();
  process.exit(0);
});
