/**
 * NetworkTables Server for OutlineViewer - Publish Capture
 * 
 * This server is specifically designed to capture publish messages from OutlineViewer.
 */

const WebSocket = require('ws');
const msgpack = require('@msgpack/msgpack');
const fs = require('fs');

// Create a log file
const logStream = fs.createWriteStream('outlineviewer-publish-capture.log', { flags: 'a' });

// Enhanced logging function
function log(message, data) {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] ${message}`;
  
  if (data !== undefined) {
    if (typeof data === 'object') {
      try {
        logMessage += '\n' + JSON.stringify(data, null, 2);
      } catch (e) {
        logMessage += ' [Object cannot be stringified]';
      }
    } else {
      logMessage += ' ' + data;
    }
  }
  
  console.log(logMessage);
  logStream.write(logMessage + '\n');
}

// Create a WebSocket server
const wss = new WebSocket.Server({
  port: 5810,
  // Support both NT 4.0 and 4.1 protocols
  handleProtocols: (protocols, request) => {
    log('Client requested protocols:', protocols);

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

// Handle connections
wss.on('connection', (ws, request) => {
  log('Client connected:', request.socket.remoteAddress);
  log('Protocol:', ws.protocol);

  // Create some test topics
  createTestTopics();

  // Send all existing topics to the new client
  for (const topic of topics.values()) {
    // Announce topic
    announceTopicToClient(ws, topic);

    // Send value if available
    if (topic.value) {
      sendValueToClient(ws, topic.id, topic.value.type, topic.value.value, topic.value.timestamp);      
    }
  }

  // Handle messages
  ws.on('message', (data) => {
    try {
      log('Received message, type:', typeof data);
      
      if (data instanceof Buffer) {
        log('Binary message received, length:', data.length);
        
        // Log the entire buffer as hex
        const hexData = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' ');
        log(`Full binary data: ${hexData}`);
        
        try {
          // Try to decode as MessagePack
          const decoded = msgpack.decode(data);
          log('Decoded MessagePack:', decoded);
          
          // Check if it's a time synchronization message
          if (Array.isArray(decoded) && decoded.length === 4 && decoded[0] === -1) {
            handleTimeSyncMessage(ws, decoded);
            return;
          }
          
          // Handle decoded message
          handleMessage(ws, decoded);
        } catch (mpError) {
          log('Failed to decode MessagePack:', mpError);

          // Try to parse as JSON
          try {
            const jsonString = data.toString('utf8');
            log('As UTF-8 string:', jsonString);
            
            try {
              const jsonData = JSON.parse(jsonString);
              log('Parsed JSON:', jsonData);

              // Handle JSON message
              handleMessage(ws, jsonData);
            } catch (jsonError) {
              log('Failed to parse JSON:', jsonError);
            }
          } catch (error) {
            log('Not valid UTF-8:', error);
          }
        }
      } else if (typeof data === 'string') {
        log('Text message received:', data);

        // Try to parse as JSON
        try {
          const jsonData = JSON.parse(data);
          log('Parsed JSON:', jsonData);

          // Handle JSON message
          handleMessage(ws, jsonData);
        } catch (jsonError) {
          log('Failed to parse JSON:', jsonError);
        }
      }
    } catch (error) {
      log('Error processing message:', error);
    }
  });

  // Handle close
  ws.on('close', () => {
    log('Client disconnected');
  });

  // Handle errors
  ws.on('error', (error) => {
    log('WebSocket error:', error);
  });
});

// Handle time synchronization message
function handleTimeSyncMessage(ws, message) {
  // message format: [-1, clientIndex, sequenceNumber, clientTime]
  const [messageType, clientIndex, sequenceNumber, clientTime] = message;
  
  log(`Received time sync message: type=${messageType}, clientIndex=${clientIndex}, seq=${sequenceNumber}, clientTime=${clientTime}`);
  
  // Respond with a time sync response
  const serverTime = Date.now() * 1000; // Convert to microseconds
  const response = [-1, clientIndex, sequenceNumber, clientTime, serverTime];
  
  log(`Sending time sync response:`, response);
  
  // Send as binary MessagePack
  const encoded = msgpack.encode(response);
  ws.send(encoded);
}

// Handle message
function handleMessage(ws, message) {
  // Check if it's an array (control message)
  if (Array.isArray(message)) {
    log('Received array message with', message.length, 'elements');
    for (const msg of message) {
      handleControlMessage(ws, msg);
    }
  }
  // Check if it's a value update
  else if (typeof message === 'object' && message.id !== undefined) {
    log('Received value update message for ID', message.id);
    handleValueMessage(ws, message);
  } else {
    log('Received unknown message format:', message);
  }
}

// Handle control message
function handleControlMessage(ws, message) {
  log('Control message:', message);

  if (!message.method) {
    log('Invalid control message, missing method:', message);
    return;
  }

  log(`Processing method: ${message.method} with params:`, message.params);

  switch (message.method) {
    case 'publish':
      handlePublish(ws, message);
      break;
    case 'unpublish':
      handleUnpublish(ws, message);
      break;
    case 'subscribe':
      handleSubscribe(ws, message);
      break;
    case 'unsubscribe':
      handleUnsubscribe(ws, message);
      break;
    case 'setproperties':
      handleSetProperties(ws, message);
      break;
    default:
      log('Unknown method:', message.method);
  }
}

// Handle publish message
function handlePublish(ws, message) {
  const { name, type, pubuid, properties } = message.params;

  log(`!!! CLIENT PUBLISHING TOPIC !!!`);
  log(`Name: ${name}`);
  log(`Type: ${type}`);
  log(`PubUID: ${pubuid}`);
  log(`Properties:`, properties);

  // Check if topic already exists
  if (topics.has(name)) {
    // Update existing topic
    const topic = topics.get(name);
    log(`Updating existing topic ${name} with ID ${topic.id}`);
    
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
      value: null
    };

    topics.set(name, topic);
    log(`Created new topic ${name} with ID ${id}`);

    // Broadcast topic to all clients
    broadcastTopic(topic);
  }
}

// Handle unpublish message
function handleUnpublish(ws, message) {
  const { pubuid } = message.params;

  log(`Client unpublishing topic with pubuid: ${pubuid}`);

  // Find topic by pubuid
  for (const [name, topic] of topics.entries()) {
    if (topic.properties.pubuid === pubuid) {
      log(`Found topic ${name} with ID ${topic.id} for pubuid ${pubuid}`);

      // Remove topic
      topics.delete(name);

      // Broadcast unannounce to all clients
      broadcastUnannounce(name);

      break;
    }
  }
}

// Handle subscribe message
function handleSubscribe(ws, message) {
  const { subuid, topics: topicPatterns, options = {} } = message.params;

  log(`Client subscribing with subuid: ${subuid}`);
  log('Topic patterns:', topicPatterns);
  log('Options:', options);

  // Send current values for matching topics
  for (const topic of topics.values()) {
    if (topicMatchesPatterns(topic.name, topicPatterns, options)) {
      log(`Topic ${topic.name} matches subscription patterns`);
      
      // Send value if available
      if (topic.value) {
        sendValueToClient(ws, topic.id, topic.value.type, topic.value.value, topic.value.timestamp);    
      }
    }
  }
}

// Handle unsubscribe message
function handleUnsubscribe(ws, message) {
  const { subuid } = message.params;

  log(`Client unsubscribing: ${subuid}`);
}

// Handle set properties message
function handleSetProperties(ws, message) {
  const { name, update } = message.params;

  log(`Client setting properties for topic: ${name}`);
  log('Properties update:', update);

  // Check if topic exists
  if (topics.has(name)) {
    const topic = topics.get(name);
    log(`Found topic ${name} with ID ${topic.id}`);

    // Update properties
    for (const [key, value] of Object.entries(update)) {
      if (value === null) {
        log(`Removing property ${key} from topic ${name}`);
        delete topic.properties[key];
      } else {
        log(`Setting property ${key} = ${JSON.stringify(value)} for topic ${name}`);
        topic.properties[key] = value;
      }
    }

    // Broadcast properties to all clients
    broadcastProperties(name, topic.properties);
  } else {
    log(`Topic ${name} not found`);
  }
}

// Handle value message
function handleValueMessage(ws, message) {
  const { id, timestamp, type, value } = message;

  log(`!!! CLIENT UPDATING VALUE !!!`);
  log(`ID: ${id}`);
  log(`Type: ${type}`);
  log(`Timestamp: ${timestamp}`);
  log(`Value:`, value);

  // Find topic by ID
  let found = false;
  for (const [name, topic] of topics.entries()) {
    if (topic.id === id) {
      log(`Found topic ${name} with ID ${id}`);
      found = true;

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

  if (!found) {
    log(`No topic found with ID ${id}`);
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

// Announce topic to client
function announceTopicToClient(ws, topic) {
  const message = {
    method: 'announce',
    params: {
      name: topic.name,
      id: topic.id,
      type: topic.type,
      properties: topic.properties
    }
  };

  const jsonMessage = JSON.stringify([message]);
  ws.send(jsonMessage);
  
  log(`Announced topic ${topic.name} to client`);
}

// Send value to client
function sendValueToClient(ws, id, type, value, timestamp) {    
  const message = [id, timestamp, type, value];
  
  // Send as binary MessagePack
  const encoded = msgpack.encode(message);
  ws.send(encoded);
  
  log(`Sent value for ID ${id} to client`);
}

// Broadcast topic to all clients
function broadcastTopic(topic) {
  const message = {
    method: 'announce',
    params: {
      name: topic.name,
      id: topic.id,
      type: topic.type,
      properties: topic.properties,
      pubuid: topic.id  // Include publication ID for OutlineViewer
    }
  };

  // Send as JSON array
  const jsonMessage = JSON.stringify([message]);
  broadcast(jsonMessage);

  log(`Topic announced: ${topic.name} (${topic.type})`);
}

// Broadcast unannounce to all clients
function broadcastUnannounce(name) {
  const message = {
    method: 'unannounce',
    params: {
      name
    }
  };

  const jsonMessage = JSON.stringify([message]);
  broadcast(jsonMessage);

  log(`Topic unannounced: ${name}`);
}

// Broadcast properties to all clients
function broadcastProperties(name, properties) {
  const message = {
    method: 'properties',
    params: {
      name,
      properties
    }
  };

  const jsonMessage = JSON.stringify([message]);
  broadcast(jsonMessage);

  log(`Properties updated for topic: ${name}`);
}

// Broadcast value to all clients
function broadcastValue(id, type, value, timestamp) {
  // Create value message with all required fields
  const message = [id, timestamp, type, value];
  
  // Send as binary MessagePack
  const encoded = msgpack.encode(message);
  broadcast(encoded);

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
    log(`Value updated for ${topicName}: id=${id}, type=${type}`);
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
}

// Create or update a topic
function createTopic(name, type, properties, value) {
  // Add standard properties that OutlineViewer expects
  const enhancedProperties = {
    ...properties,
    persistent: true,  // Make topic persistent
    retained: true,    // Retain values
    'rawType': type,   // Raw type information
    'typeString': type, // Type as string
    '.type': type,     // Type with dot prefix (used by some clients)
    'source': 'ntcorejs' // Source of the topic
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
    broadcastValue(topic.id, topic.value.type, topic.value.value, topic.value.timestamp);
  } else {
    // Create new topic
    const id = nextTopicId++;
    const topic = {
      id,
      name,
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
    broadcastTopic(topic);

    // Broadcast value
    if (topic.value) {
      broadcastValue(topic.id, topic.value.type, topic.value.value, topic.value.timestamp);
    }

    // Log detailed information
    log(`Created topic ${name} with ID ${topic.id}:`);
    log(`Type: ${type} (ID: ${getTypeId(type)})`);
    log('Properties:', enhancedProperties);
    log('Value:', value);
  }
}

// Get type ID from type string
function getTypeId(type) {
  switch (type) {
    case 'boolean': return DataType.Boolean;
    case 'double': return DataType.Double;
    case 'int': return DataType.Int;
    case 'float': return DataType.Float;
    case 'string': return DataType.String;
    case 'raw': return DataType.Raw;
    case 'rpc': return DataType.Raw;
    case 'msgpack': return DataType.Raw;
    case 'protobuf': return DataType.Raw;
    case 'boolean[]': return DataType.BooleanArray;
    case 'double[]': return DataType.DoubleArray;
    case 'int[]': return DataType.IntArray;
    case 'float[]': return DataType.FloatArray;
    case 'string[]': return DataType.StringArray;
    default: return DataType.Raw; // Default to raw
  }
}

// Start the server
log('Server started on port 5810');
log('Connect OutlineViewer to localhost:5810');
