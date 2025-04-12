/**
 * NetworkTables Server Test for OutlineViewer (Version 4)
 *
 * This example creates a NetworkTables server that uses MessagePack for binary encoding
 * to communicate with OutlineViewer.
 */

import WebSocket from 'ws';
import { encode, decode } from '@msgpack/msgpack';
import { NT4_SUBPROTOCOL, NT4_FALLBACK_SUBPROTOCOL } from '../src/protocol';

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

// Store topics
const topics = new Map<string, Topic>();
let nextTopicId = 1;

// Define topic interface
interface Topic {
  id: number;
  name: string;
  type: string;
  properties: Record<string, any>;
  value: {
    type: number;
    value: any;
    timestamp: number;
  } | null;
}

// Define data types
enum DataType {
  Boolean = 0,
  Double = 1,
  Int = 2,
  Float = 3,
  String = 4,
  Raw = 5,
  BooleanArray = 16,
  DoubleArray = 17,
  IntArray = 18,
  FloatArray = 19,
  StringArray = 20
}

// Handle connections
wss.on('connection', (ws, request) => {
  console.log('Client connected:', request.socket.remoteAddress);
  console.log('Protocol:', ws.protocol);

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
      // Try to decode as MessagePack
      if (data instanceof Buffer) {
        console.log('Binary message received, length:', data.length);
        console.log('First 16 bytes:', Array.from(data.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' '));

        try {
          // Try to decode as MessagePack
          const decoded = decode(data);
          console.log('Decoded MessagePack:', JSON.stringify(decoded));

          // Handle decoded message
          handleMessage(ws, decoded);
        } catch (mpError) {
          console.error('Failed to decode MessagePack:', mpError);

          // Try to parse as JSON
          try {
            const jsonString = data.toString('utf8');
            const jsonData = JSON.parse(jsonString);
            console.log('Parsed JSON:', jsonData);

            // Handle JSON message
            handleMessage(ws, jsonData);
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
          handleMessage(ws, jsonData);
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
    console.log('Client disconnected');
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Handle message
function handleMessage(ws: WebSocket, message: any) {
  // Check if it's an array (control message)
  if (Array.isArray(message)) {
    for (const msg of message) {
      handleControlMessage(ws, msg);
    }
  }
  // Check if it's a value update
  else if (typeof message === 'object' && message.id !== undefined) {
    handleValueMessage(ws, message);
  }
}

// Handle control message
function handleControlMessage(ws: WebSocket, message: any) {
  console.log('Control message:', message);

  if (!message.method) {
    console.error('Invalid control message, missing method:', message);
    return;
  }

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
      console.log('Unknown method:', message.method);
  }
}

// Handle publish message
function handlePublish(ws: WebSocket, message: any) {
  const { name, type, pubuid, properties } = message.params;

  console.log(`Client publishing topic: ${name} (${type})`);

  // Check if topic already exists
  if (topics.has(name)) {
    // Update existing topic
    const topic = topics.get(name)!;
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
    const topic: Topic = {
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
function handleUnpublish(ws: WebSocket, message: any) {
  const { pubuid } = message.params;

  // Find topic by pubuid
  for (const [name, topic] of topics.entries()) {
    if (topic.properties.pubuid === pubuid) {
      console.log(`Client unpublishing topic: ${name}`);

      // Remove topic
      topics.delete(name);

      // Broadcast unannounce to all clients
      broadcastUnannounce(name);

      break;
    }
  }
}

// Handle subscribe message
function handleSubscribe(ws: WebSocket, message: any) {
  const { subuid, topics: topicPatterns, options = {} } = message.params;

  console.log(`Client subscribing to topics: ${topicPatterns.join(', ')}`);

  // Send current values for matching topics
  for (const topic of topics.values()) {
    if (topicMatchesPatterns(topic.name, topicPatterns, options)) {
      // Send value if available
      if (topic.value) {
        sendValueToClient(ws, topic.id, topic.value.type, topic.value.value, topic.value.timestamp);
      }
    }
  }
}

// Handle unsubscribe message
function handleUnsubscribe(ws: WebSocket, message: any) {
  const { subuid } = message.params;

  console.log(`Client unsubscribing: ${subuid}`);
}

// Handle set properties message
function handleSetProperties(ws: WebSocket, message: any) {
  const { name, update } = message.params;

  console.log(`Client setting properties for topic: ${name}`);

  // Check if topic exists
  if (topics.has(name)) {
    const topic = topics.get(name)!;

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
function handleValueMessage(ws: WebSocket, message: any) {
  const { id, timestamp, type, value } = message;

  // Find topic by ID
  for (const topic of topics.values()) {
    if (topic.id === id) {
      console.log(`Client updating value for topic: ${topic.name}`);

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
function topicMatchesPatterns(topicName: string, patterns: string[], options: any): boolean {
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
function announceTopicToClient(ws: WebSocket, topic: Topic) {
  const message = {
    method: 'announce',
    params: {
      name: topic.name,
      id: topic.id,
      type: topic.type,
      properties: topic.properties
    }
  };

  ws.send(JSON.stringify([message]));
}

// Send value to client
function sendValueToClient(ws: WebSocket, id: number, type: number, value: any, timestamp: number) {
  const message = {
    id,
    timestamp,
    type,
    value
  };

  ws.send(JSON.stringify(message));
}

// Broadcast topic to all clients
function broadcastTopic(topic: Topic) {
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

  console.log(`Topic announced: ${topic.name} (${topic.type})`);
  console.log('Announce message:', jsonMessage);
}

// Broadcast unannounce to all clients
function broadcastUnannounce(name: string) {
  const message = {
    method: 'unannounce',
    params: {
      name
    }
  };

  broadcast(JSON.stringify([message]));

  console.log(`Topic unannounced: ${name}`);
}

// Broadcast properties to all clients
function broadcastProperties(name: string, properties: Record<string, any>) {
  const message = {
    method: 'properties',
    params: {
      name,
      properties
    }
  };

  broadcast(JSON.stringify([message]));

  console.log(`Properties updated for topic: ${name}`);
}

// Broadcast value to all clients
function broadcastValue(id: number, type: number, value: any, timestamp: number) {
  // Create value message with all required fields
  const message = {
    id,
    timestamp,
    type,
    value
  };

  // Send as JSON
  const jsonMessage = JSON.stringify(message);
  broadcast(jsonMessage);

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
    console.log(`Value updated for ${topicName}: id=${id}, type=${type}, value=${JSON.stringify(value)}`);
    console.log('Value message:', jsonMessage);
  }
}

// Broadcast message to all clients
function broadcast(message: string) {
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
function createTopic(name: string, type: string, properties: Record<string, any>, value: any) {
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
    const topic = topics.get(name)!;

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
    const topic: Topic = {
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
    console.log(`Updated topic ${name} with ID ${topic.id}:`);
    console.log(` - Type: ${type} (ID: ${getTypeId(type)})`);
    console.log(` - Properties:`, JSON.stringify(enhancedProperties));
    console.log(` - Value:`, JSON.stringify(value));
  }
}

// Get type ID from type string
function getTypeId(type: string): number {
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

// Create test topics
createTestTopics();

console.log('Server started on port 5810');
console.log('Connect OutlineViewer to localhost:5810');
