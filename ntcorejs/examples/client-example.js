/**
 * NetworkTables 4.1 Client Example
 * 
 * This is an example of how to use the NetworkTables 4.1 client.
 */

const { NetworkTablesClient, DataType } = require('../src/client');

// Create a client
const client = new NetworkTablesClient({
  host: 'localhost',
  port: 5810
});

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
  
  // Publish some topics
  publishTestTopics();
});

// Handle disconnection
client.on('disconnected', () => {
  console.log('Disconnected from server');
});

// Handle topic announced
client.on('topicAnnounced', (name, type, id, properties) => {
  console.log(`Topic announced: ${name} (${type}) with ID ${id}`);
  console.log(`Properties: ${JSON.stringify(properties)}`);
});

// Handle topic unannounced
client.on('topicUnannounced', (name) => {
  console.log(`Topic unannounced: ${name}`);
});

// Handle properties changed
client.on('propertiesChanged', (name, properties) => {
  console.log(`Properties changed for topic ${name}: ${JSON.stringify(properties)}`);
});

// Handle value changed
client.on('valueChanged', (name, value, timestamp, type) => {
  console.log(`Value changed for topic ${name}: ${JSON.stringify(value)}`);
});

// Publish test topics
function publishTestTopics() {
  console.log('Publishing test topics...');
  
  // Boolean
  const booleanPubuid = client.publish('/client/boolean', 'boolean', {
    persistent: true,
    retained: true
  });
  
  // Number
  const numberPubuid = client.publish('/client/number', 'double', {
    persistent: true,
    retained: true
  });
  
  // String
  const stringPubuid = client.publish('/client/string', 'string', {
    persistent: true,
    retained: true
  });
  
  // Boolean array
  const booleanArrayPubuid = client.publish('/client/boolean_array', 'boolean[]', {
    persistent: true,
    retained: true
  });
  
  // Number array
  const numberArrayPubuid = client.publish('/client/number_array', 'double[]', {
    persistent: true,
    retained: true
  });
  
  // String array
  const stringArrayPubuid = client.publish('/client/string_array', 'string[]', {
    persistent: true,
    retained: true
  });
  
  // Set initial values
  setTimeout(() => {
    client.setValue(booleanPubuid, true, DataType.Boolean);
    client.setValue(numberPubuid, 3.14159, DataType.Double);
    client.setValue(stringPubuid, 'Hello from ntcorejs!', DataType.String);
    client.setValue(booleanArrayPubuid, [true, false, true], DataType.BooleanArray);
    client.setValue(numberArrayPubuid, [1.1, 2.2, 3.3, 4.4], DataType.DoubleArray);
    client.setValue(stringArrayPubuid, ['one', 'two', 'three'], DataType.StringArray);
    
    console.log('Initial values set');
  }, 1000);
  
  // Start updating a counter
  let counter = 0;
  const counterPubuid = client.publish('/client/counter', 'double', {
    persistent: true,
    retained: true
  });
  
  // Update counter periodically
  setInterval(() => {
    client.setValue(counterPubuid, counter++, DataType.Double);
    
    if (counter % 10 === 0) {
      console.log(`Counter updated: ${counter-1}`);
    }
  }, 1000);
}

// Connect to the server
client.connect();

// Handle process termination
process.on('SIGINT', () => {
  console.log('Disconnecting from server...');
  client.disconnect();
  process.exit(0);
});
