/**
 * NetworkTables 4.1 Server Example
 * 
 * This is an example of how to use the NetworkTables 4.1 server.
 */

const { NetworkTablesServer, DataType } = require('../src/server');

// Create a server
const server = new NetworkTablesServer({
  port: 5810
});

// Handle debug messages
server.on('debug', (message) => {
  console.log(`[DEBUG] ${message}`);
});

// Handle server started
server.on('started', () => {
  console.log('Server started');
  
  // Create some test topics
  createTestTopics();
});

// Handle server stopped
server.on('stopped', () => {
  console.log('Server stopped');
});

// Handle client connected
server.on('clientConnected', (clientId, clientInfo) => {
  console.log(`Client ${clientId} connected from ${clientInfo.address}`);
});

// Handle client disconnected
server.on('clientDisconnected', (clientId) => {
  console.log(`Client ${clientId} disconnected`);
});

// Handle topic published
server.on('topicPublished', (name, type, id, properties, clientId) => {
  console.log(`Client ${clientId} published topic: ${name} (${type}) with ID ${id}`);
});

// Handle topic unpublished
server.on('topicUnpublished', (name, clientId) => {
  console.log(`Client ${clientId} unpublished topic: ${name}`);
});

// Handle topic subscribed
server.on('topicSubscribed', (topicPatterns, options, clientId) => {
  console.log(`Client ${clientId} subscribed to topics: ${topicPatterns.join(', ')}`);
});

// Handle topic unsubscribed
server.on('topicUnsubscribed', (subuid, clientId) => {
  console.log(`Client ${clientId} unsubscribed: ${subuid}`);
});

// Handle value changed
server.on('valueChanged', (name, value, timestamp, type, clientId) => {
  console.log(`Value changed for topic ${name}: ${JSON.stringify(value)} (from client ${clientId})`);
});

// Handle properties changed
server.on('propertiesChanged', (name, properties, clientId) => {
  console.log(`Properties changed for topic ${name}: ${JSON.stringify(properties)} (from client ${clientId})`);
});

// Create test topics
function createTestTopics() {
  console.log('Creating test topics...');
  
  // Boolean
  server.createTopic('/server/boolean', 'boolean', true, DataType.Boolean, {
    persistent: true,
    retained: true
  });
  
  // Number
  server.createTopic('/server/number', 'double', 3.14159, DataType.Double, {
    persistent: true,
    retained: true
  });
  
  // String
  server.createTopic('/server/string', 'string', 'Hello from NT4 server!', DataType.String, {
    persistent: true,
    retained: true
  });
  
  // Boolean array
  server.createTopic('/server/boolean_array', 'boolean[]', [true, false, true], DataType.BooleanArray, {
    persistent: true,
    retained: true
  });
  
  // Number array
  server.createTopic('/server/number_array', 'double[]', [1.1, 2.2, 3.3, 4.4], DataType.DoubleArray, {
    persistent: true,
    retained: true
  });
  
  // String array
  server.createTopic('/server/string_array', 'string[]', ['one', 'two', 'three'], DataType.StringArray, {
    persistent: true,
    retained: true
  });
  
  // Start updating a counter
  let counter = 0;
  server.createTopic('/server/counter', 'double', counter, DataType.Double, {
    persistent: true,
    retained: true
  });
  
  // Update counter periodically
  setInterval(() => {
    server.updateTopicValue('/server/counter', counter++, DataType.Double);
    
    if (counter % 10 === 0) {
      console.log(`Counter updated: ${counter-1}`);
    }
  }, 1000);
}

// Start the server
server.start();

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping server...');
  server.stop();
  process.exit(0);
});
