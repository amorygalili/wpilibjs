/**
 * WPILib NetworkTables Client
 * 
 * This is a client that can connect to the WPILib NetworkTables server.
 * It will subscribe to all topics and log them.
 */

const WebSocket = require('ws');
const msgpack = require('@msgpack/msgpack');
const fs = require('fs');

// Create a log file
const logStream = fs.createWriteStream('wpilib-nt-client.log', { flags: 'a' });

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

// Create a WebSocket client
function connectToServer(host = 'localhost', port = 5810) {
  const url = `ws://${host}:${port}`;
  log(`Connecting to ${url}...`);
  
  const ws = new WebSocket(url, ['v4.1.networktables.first.wpi.edu', 'networktables.first.wpi.edu']);
  
  // Handle open
  ws.on('open', () => {
    log(`Connected to ${url}`);
    log(`Protocol: ${ws.protocol}`);
    
    // Subscribe to all topics
    sendSubscribeMessage(ws);
  });
  
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
          
          // Handle the message
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
              
              // Handle the message
              handleJsonMessage(ws, jsonData);
            } catch (jsonError) {
              // Not valid JSON
            }
          } catch (error) {
            log(`Not valid UTF-8`);
          }
        }
      } else if (typeof data === 'string') {
        log(`Text message received: ${data}`);
        
        try {
          const jsonData = JSON.parse(data);
          log(`Parsed JSON: ${JSON.stringify(jsonData)}`);
          
          // Handle the message
          handleJsonMessage(ws, jsonData);
        } catch (jsonError) {
          // Not valid JSON
        }
      }
    } catch (error) {
      log(`Error processing message: ${error}`);
    }
  });
  
  // Handle close
  ws.on('close', () => {
    log('Disconnected from server');
    
    // Try to reconnect after a delay
    setTimeout(() => {
      connectToServer(host, port);
    }, 5000);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    log(`WebSocket error: ${error}`);
  });
  
  return ws;
}

// Handle binary message
function handleBinaryMessage(ws, message) {
  // Check if it's a value update
  if (Array.isArray(message) && message.length === 4) {
    const [id, timestamp, type, value] = message;
    log(`Value update: id=${id}, type=${type}, value=${JSON.stringify(value)}`);
    
    // Find topic by ID
    for (const [name, topic] of topics.entries()) {
      if (topic.id === id) {
        log(`Value updated for topic ${name}: ${JSON.stringify(value)}`);
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
    case 'announce':
      handleAnnounce(ws, message);
      break;
    case 'unannounce':
      handleUnannounce(ws, message);
      break;
    case 'properties':
      handleProperties(ws, message);
      break;
    default:
      log(`Unknown method: ${message.method}`);
  }
}

// Handle announce message
function handleAnnounce(ws, message) {
  const { name, id, type, properties } = message.params;
  log(`Topic announced: ${name} (${type}) with ID ${id}`);
  log(`Properties: ${JSON.stringify(properties)}`);
  
  // Store the topic
  topics.set(name, {
    id,
    type,
    properties
  });
}

// Handle unannounce message
function handleUnannounce(ws, message) {
  const { name } = message.params;
  log(`Topic unannounced: ${name}`);
  
  // Remove the topic
  topics.delete(name);
}

// Handle properties message
function handleProperties(ws, message) {
  const { name, properties } = message.params;
  log(`Properties updated for topic ${name}: ${JSON.stringify(properties)}`);
  
  // Update topic properties
  if (topics.has(name)) {
    const topic = topics.get(name);
    topic.properties = { ...topic.properties, ...properties };
  }
}

// Send subscribe message
function sendSubscribeMessage(ws) {
  try {
    // Create subscribe message
    const subscribeMessage = [{
      method: 'subscribe',
      params: {
        subuid: 1,
        topics: [''],
        options: {
          prefixMatch: true
        }
      }
    }];
    
    // Send as JSON
    const jsonMessage = JSON.stringify(subscribeMessage);
    log(`Sending subscribe message: ${jsonMessage}`);
    ws.send(jsonMessage);
  } catch (error) {
    log(`Error sending subscribe message: ${error}`);
  }
}

// Start the client
log('WPILib NetworkTables Client');
log('Make sure a NetworkTables server is running');

// Get host and port from command line arguments
const host = process.argv[2] || 'localhost';
const port = parseInt(process.argv[3] || '5810', 10);

// Connect to the server
connectToServer(host, port);
