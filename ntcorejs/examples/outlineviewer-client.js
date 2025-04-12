/**
 * NetworkTables 4.1 Client for OutlineViewer
 *
 * This is a client that connects to our server and publishes topics that OutlineViewer can display.
 */

const { NetworkTablesClient, DataType } = require('../src/client');
const fs = require('fs');

// Create a log file
const logStream = fs.createWriteStream('outlineviewer-client.log', { flags: 'a' });

// Log function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  console.log(message);
  logStream.write(logMessage);
}

// Create a client
const client = new NetworkTablesClient({
  host: 'localhost',
  port: 5810
});

// Store publications
const publications = new Map();

// Handle debug messages
client.on('debug', (message) => {
  log(`[DEBUG] ${message}`);
});

// Handle errors
client.on('error', (error) => {
  log(`[ERROR] ${error}`);
});

// Handle connection
client.on('connected', () => {
  log('Connected to server');

  // Publish some topics
  publishTestTopics();
});

// Handle disconnection
client.on('disconnected', () => {
  log('Disconnected from server');
});

// Handle topic announced
client.on('topicAnnounced', (name, type, id, properties) => {
  log(`Topic announced: ${name} (${type}) with ID ${id}`);
});

// Handle value changed
client.on('valueChanged', (name, value, timestamp, type) => {
  // Only log counter updates every 10 values to reduce noise
  if (!name.includes('counter') || Math.floor(value) % 10 === 0) {
    log(`Value changed for topic ${name}: ${JSON.stringify(value)}`);
  }
});

// Publish test topics
function publishTestTopics() {
  log('Publishing test topics...');

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

  // Store publications
  publications.set('boolean', booleanPubuid);
  publications.set('number', numberPubuid);
  publications.set('string', stringPubuid);
  publications.set('boolean_array', booleanArrayPubuid);
  publications.set('number_array', numberArrayPubuid);
  publications.set('string_array', stringArrayPubuid);

  // Set initial values
  setTimeout(() => {
    client.setValue(booleanPubuid, true, DataType.Boolean);
    client.setValue(numberPubuid, 3.14159, DataType.Double);
    client.setValue(stringPubuid, 'Hello from ntcorejs!', DataType.String);
    client.setValue(booleanArrayPubuid, [true, false, true], DataType.BooleanArray);
    client.setValue(numberArrayPubuid, [1.1, 2.2, 3.3, 4.4], DataType.DoubleArray);
    client.setValue(stringArrayPubuid, ['one', 'two', 'three'], DataType.StringArray);

    log('Initial values set');
  }, 1000);

  // Start updating a counter
  let counter = 0;
  const counterPubuid = client.publish('/client/counter', 'double', {
    persistent: true,
    retained: true
  });

  // Store counter publication
  publications.set('counter', counterPubuid);

  // Update counter periodically
  setInterval(() => {
    client.setValue(counterPubuid, counter++, DataType.Double);

    if (counter % 10 === 0) {
      log(`Counter updated: ${counter-1}`);
    }
  }, 1000);
}

// Connect to the server
client.connect();

// Handle process termination
process.on('SIGINT', () => {
  log('Disconnecting from server...');
  client.disconnect();
  process.exit(0);
});
