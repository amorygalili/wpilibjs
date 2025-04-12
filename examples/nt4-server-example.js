/**
 * NT4 Server Example
 * 
 * This example creates an NT4 server that publishes some test topics
 * and logs all client interactions.
 */

const WebSocket = require('ws');
const msgpack = require('@msgpack/msgpack');

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

// Handle connections
wss.on('connection', (ws, request) => {
  const clientId = request.socket.remoteAddress + ':' + request.socket.remotePort;
  console.log(`Client connected: ${clientId}`);
  console.log(`Protocol: ${ws.protocol}`);

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
      if (data instanceof Buffer) {
        console.log('Binary message received, length:', data.length);
        
        // Log the first 16 bytes as hex
        const hexData = Array.from(data.slice(0, Math.min(16, data.length))).map(b => b.toString(16).padStart(2, '0')).join(' ');
        console.log(`First 16 bytes: ${hexData}`);
        
        try {
          // Try to decode as MessagePack
          const decoded = msgpack.decode(data);
          console.log('Decoded MessagePack:', JSON.stringify(decoded));
          
          // Check if it's a time synchronization message
          if (Array.isArray(decoded) && decoded.length === 4 && decoded[0] === -1) {
            handleTimeSyncMessage(ws, decoded);
            return;
          }
          
          // Check if it's a value update
          if (Array.isArray(decoded) && decoded.length === 4 && typeof decoded[0] === 'number' && decoded[0] >= 0) {
            handleValueMessage(ws, decoded, clientId);
            return;
          }
          
          console.log('Unknown binary message format:', JSON.stringify(decoded));
        } catch (mpError) {
          console.error('Failed to decode MessagePack:', mpError);

          // Try to parse as JSON
          try {
            const jsonString = data.toString('utf8');
            console.log('As UTF-8 string:', jsonString);
            
            const jsonData = JSON.parse(jsonString);
            console.log('Parsed JSON:', jsonData);

            // Handle JSON message
            handleJsonMessage(ws, jsonData, clientId);
          } catch (jsonError) {
            console.error('Failed to parse as JSON:', jsonError);
          }
        }
      } else if (typeof data === 'string') {
        console.log('Text message received:', data);

        // Try to parse as JSON
        try {
          const jsonData = JSON.parse(data);
          console.log('Parsed JSON:', jsonData);

          // Handle JSON message
          handleJsonMessage(ws, jsonData, clientId);
        } catch (jsonError) {
          console.error('Failed to parse JSON:', jsonError);
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Handle close
  ws.on('close', () => {
    console.log(`Client disconnected: ${clientId}`);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Handle JSON message
function handleJsonMessage(ws, message, clientId) {
  // Check if it's an array (control message)
  if (Array.isArray(message)) {
    for (const msg of message) {
      handleControlMessage(ws, msg, clientId);
    }
  } else {
    console.warn('Received unknown JSON message format:', message);
  }
}

// Handle control message
function handleControlMessage(ws, message, clientId) {
  if (!message.method) {
    console.warn('Invalid control message, missing method:', message);
    return;
  }

  console.log(`Processing method: ${message.method} from client ${clientId}`);

  switch (message.method) {
    case 'publish':
      handlePublish(ws, message.params, clientId);
      break;
    case 'unpublish':
      handleUnpublish(ws, message.params, clientId);
      break;
    case 'subscribe':
      handleSubscribe(ws, message.params, clientId);
      break;
    case 'unsubscribe':
      handleUnsubscribe(ws, message.params, clientId);
      break;
    case 'setproperties':
      handleSetProperties(ws, message.params, clientId);
      break;
    default:
      console.warn('Unknown method:', message.method);
  }
}

// Handle publish message
function handlePublish(ws, params, clientId) {
  const { name, type, pubuid, properties } = params;

  console.log(`!!! CLIENT PUBLISHING TOPIC !!!`);
  console.log(`Client: ${clientId}`);
  console.log(`Name: ${name}`);
  console.log(`Type: ${type}`);
  console.log(`PubUID: ${pubuid}`);
  console.log(`Properties:`, properties);

  // Check if topic already exists
  if (topics.has(name)) {
    // Update existing topic
    const topic = topics.get(name);
    
    topic.type = type;

    // Update properties
    for (const [key, value] of Object.entries(properties)) {
      if (value === null) {
        delete topic.properties[key];
      } else {
        topic.properties[key] = value;
      }
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

    // Broadcast topic to all clients
    broadcastTopic(topic);
  }
}

// Handle unpublish message
function handleUnpublish(ws, params, clientId) {
  const { pubuid } = params;

  console.log(`!!! CLIENT UNPUBLISHING TOPIC !!!`);
  console.log(`Client: ${clientId}`);
  console.log(`PubUID: ${pubuid}`);

  // Find topic by pubuid
  for (const [name, topic] of topics.entries()) {
    if (topic.properties.pubuid === pubuid) {
      console.log(`Found topic ${name} with ID ${topic.id} for pubuid ${pubuid}`);

      // Remove topic
      topics.delete(name);

      // Broadcast unannounce to all clients
      broadcastUnannounce(name);

      break;
    }
  }
}

// Handle subscribe message
function handleSubscribe(ws, params, clientId) {
  const { subuid, topics: topicPatterns, options = {} } = params;

  console.log(`!!! CLIENT SUBSCRIBING !!!`);
  console.log(`Client: ${clientId}`);
  console.log(`SubUID: ${subuid}`);
  console.log('Topic patterns:', topicPatterns);
  console.log('Options:', options);

  // Send current values for matching topics
  for (const topic of topics.values()) {
    if (topicMatchesPatterns(topic.name, topicPatterns, options)) {
      console.log(`Topic ${topic.name} matches subscription patterns`);
      
      // Send value if available
      if (topic.value) {
        sendValueToClient(ws, topic.id, topic.value.type, topic.value.value, topic.value.timestamp);    
      }
    }
  }
}

// Handle unsubscribe message
function handleUnsubscribe(ws, params, clientId) {
  const { subuid } = params;

  console.log(`!!! CLIENT UNSUBSCRIBING !!!`);
  console.log(`Client: ${clientId}`);
  console.log(`SubUID: ${subuid}`);
}

// Handle set properties message
function handleSetProperties(ws, params, clientId) {
  const { name, update } = params;

  console.log(`!!! CLIENT SETTING PROPERTIES !!!`);
  console.log(`Client: ${clientId}`);
  console.log(`Topic: ${name}`);
  console.log('Properties update:', update);

  // Check if topic exists
  if (topics.has(name)) {
    const topic = topics.get(name);

    // Update properties
    for (const [key, value] of Object.entries(update)) {
      if (value === null) {
        console.log(`Removing property ${key} from topic ${name}`);
        delete topic.properties[key];
      } else {
        console.log(`Setting property ${key} = ${JSON.stringify(value)} for topic ${name}`);
        topic.properties[key] = value;
      }
    }

    // Broadcast properties to all clients
    broadcastProperties(name, topic.properties);
  } else {
    console.log(`Topic ${name} not found`);
  }
}

// Handle value message
function handleValueMessage(ws, message, clientId) {
  const [id, timestamp, type, value] = message;

  console.log(`!!! CLIENT UPDATING VALUE !!!`);
  console.log(`Client: ${clientId}`);
  console.log(`ID: ${id}`);
  console.log(`Type: ${type}`);
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Value:`, value);

  // Find topic by ID
  let found = false;
  for (const [name, topic] of topics.entries()) {
    if (topic.id === id) {
      console.log(`Found topic ${name} with ID ${id}`);
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
    console.log(`No topic found with ID ${id}`);
  }
}

// Handle time synchronization message
function handleTimeSyncMessage(ws, message) {
  // message format: [-1, clientIndex, sequenceNumber, clientTime]
  const [messageType, clientIndex, sequenceNumber, clientTime] = message;
  
  console.log(`Received time sync message: type=${messageType}, clientIndex=${clientIndex}, seq=${sequenceNumber}, clientTime=${clientTime}`);
  
  // Respond with a time sync response
  const serverTime = Date.now() * 1000; // Convert to microseconds
  const response = [-1, clientIndex, sequenceNumber, clientTime, serverTime];
  
  console.log(`Sending time sync response:`, response);
  
  // Send as binary MessagePack
  const encoded = msgpack.encode(response);
  ws.send(encoded);
}

// Check if topic matches patterns
function topicMatchesPatterns(topicName, patterns, options) {
  const prefixMatch = options.prefix === true;
  
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
      properties: topic.properties,
      pubuid: topic.id
    }
  };

  const jsonMessage = JSON.stringify([message]);
  ws.send(jsonMessage);
  
  console.log(`Announced topic ${topic.name} to client`);
}

// Send value to client
function sendValueToClient(ws, id, type, value, timestamp) {    
  const message = [id, timestamp, type, value];
  
  // Send as binary MessagePack
  const encoded = msgpack.encode(message);
  ws.send(encoded);
  
  console.log(`Sent value for ID ${id} to client`);
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
      pubuid: topic.id
    }
  };

  // Send as JSON array
  const jsonMessage = JSON.stringify([message]);
  broadcast(jsonMessage);

  console.log(`Topic announced: ${topic.name} (${topic.type})`);
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

  console.log(`Topic unannounced: ${name}`);
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

  console.log(`Properties updated for topic: ${name}`);
}

// Broadcast value to all clients
function broadcastValue(id, type, value, timestamp) {
  // Create value message
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
    console.log(`Value updated for ${topicName}: id=${id}, type=${type}`);
    console.log('Value:', value);
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

// Create or update a topic
function createTopic(name, type, properties, value) {
  // Add standard properties
  const enhancedProperties = {
    ...properties,
    persistent: true,  // Make topic persistent
    retained: true,    // Retain values
    'rawType': type,   // Raw type information
    'typeString': type, // Type as string
    '.type': type,     // Type with dot prefix (used by some clients)
    'source': 'nt4-server-example' // Source of the topic
  };

  // Check if topic already exists
  if (topics.has(name)) {
    // Update existing topic
    const topic = topics.get(name);

    // Update properties
    topic.properties = enhancedProperties;

    // Update value
    if (value !== undefined) {
      topic.value = {
        type: getTypeId(type),
        value,
        timestamp: Date.now() * 1000
      };

      // Broadcast value
      broadcastValue(topic.id, topic.value.type, topic.value.value, topic.value.timestamp);
    }

    return topic;
  } else {
    // Create new topic
    const id = nextTopicId++;
    const topic = {
      id,
      name,
      type,
      properties: enhancedProperties,
      value: value !== undefined ? {
        type: getTypeId(type),
        value,
        timestamp: Date.now() * 1000
      } : null
    };

    topics.set(name, topic);

    // Announce new topic to all clients
    broadcastTopic(topic);

    // Broadcast value if available
    if (topic.value) {
      broadcastValue(topic.id, topic.value.type, topic.value.value, topic.value.timestamp);
    }

    console.log(`Created topic ${name} with ID ${topic.id}:`);
    console.log(`Type: ${type} (ID: ${getTypeId(type)})`);
    console.log('Properties:', enhancedProperties);
    console.log('Value:', value);

    return topic;
  }
}

// Update a topic's value
function updateTopic(name, value, timestamp) {
  const topic = topics.get(name);
  if (!topic) {
    console.error(`Topic ${name} not found`);
    return;
  }
  
  // Set timestamp if not provided
  if (timestamp === undefined) {
    timestamp = Date.now() * 1000; // Convert to microseconds
  }
  
  // Update topic value
  topic.value = {
    type: getTypeId(topic.type),
    value,
    timestamp
  };
  
  // Broadcast to all clients
  broadcastValue(topic.id, topic.value.type, topic.value.value, topic.value.timestamp);
}

// Create test topics
console.log('Creating test topics...');

// Boolean
createTopic('/test/boolean', 'boolean', {}, true);

// Number
createTopic('/test/number', 'double', {}, 3.14159);

// String
createTopic('/test/string', 'string', {}, 'Hello from NT4 Server!');

// Boolean array
createTopic('/test/boolean_array', 'boolean[]', {}, [true, false, true]);

// Number array
createTopic('/test/number_array', 'double[]', {}, [1.1, 2.2, 3.3, 4.4]);

// String array
createTopic('/test/string_array', 'string[]', {}, ['one', 'two', 'three']);

// Update counter periodically
let counter = 0;
createTopic('/test/counter', 'double', {}, counter);

// Update counter every second
setInterval(() => {
  updateTopic('/test/counter', counter++);
  
  if (counter % 10 === 0) {
    console.log(`Counter updated: ${counter-1}`);
  }
}, 1000);

console.log('Server is running on port 5810');
console.log('Connect OutlineViewer to localhost:5810');

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping server...');
  wss.close();
  process.exit(0);
});
