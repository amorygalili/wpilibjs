/**
 * NetworkTables 4.1 Debug Client
 * 
 * This is a debug client that connects to our server and logs all topics and values.
 */

const { NetworkTablesClient, DataType } = require('../src/client');

// Create a client
const client = new NetworkTablesClient({
  host: 'localhost',
  port: 5810
});

// Store topics
const topics = new Map();

// Handle debug messages
client.on('debug', (message) => {
  console.log(`[DEBUG] ${message}`);
});

// Handle errors
client.on('error', (error) => {
  console.error(`[ERROR] ${error}`);
});

// Handle connection
client.on('connected', () => {
  console.log('Connected to server');
});

// Handle disconnection
client.on('disconnected', () => {
  console.log('Disconnected from server');
});

// Handle topic announced
client.on('topicAnnounced', (name, type, id, properties) => {
  console.log(`Topic announced: ${name} (${type}) with ID ${id}`);
  console.log(`Properties: ${JSON.stringify(properties)}`);
  
  // Store topic
  topics.set(name, {
    id,
    type,
    properties,
    value: null
  });
  
  // Print all topics
  console.log('Current topics:');
  for (const [name, topic] of topics.entries()) {
    console.log(`  ${name} (${topic.type}): ${JSON.stringify(topic.value)}`);
  }
});

// Handle topic unannounced
client.on('topicUnannounced', (name) => {
  console.log(`Topic unannounced: ${name}`);
  
  // Remove topic
  topics.delete(name);
  
  // Print all topics
  console.log('Current topics:');
  for (const [name, topic] of topics.entries()) {
    console.log(`  ${name} (${topic.type}): ${JSON.stringify(topic.value)}`);
  }
});

// Handle properties changed
client.on('propertiesChanged', (name, properties) => {
  console.log(`Properties changed for topic ${name}: ${JSON.stringify(properties)}`);
  
  // Update topic properties
  if (topics.has(name)) {
    const topic = topics.get(name);
    topic.properties = properties;
  }
});

// Handle value changed
client.on('valueChanged', (name, value, timestamp, type) => {
  // Only log counter updates every 10 values to reduce noise
  if (!name.includes('counter') || Math.floor(value) % 10 === 0) {
    console.log(`Value changed for topic ${name}: ${JSON.stringify(value)}`);
  }
  
  // Update topic value
  if (topics.has(name)) {
    const topic = topics.get(name);
    topic.value = value;
  }
});

// Connect to the server
client.connect();

// Handle process termination
process.on('SIGINT', () => {
  console.log('Disconnecting from server...');
  client.disconnect();
  process.exit(0);
});
