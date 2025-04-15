/**
 * NetworkTables client example that connects to OutlineViewer using NetworkTableInstance.
 * 
 * This example demonstrates how to:
 * 1. Connect to OutlineViewer (running as a server)
 * 2. Publish topic values
 * 3. Update values periodically
 * 
 * To use this example:
 * 1. Start OutlineViewer and configure it as a server
 * 2. Run this example with: npx ts-node examples/outlineviewer-client-nt-instance.ts
 * 3. Observe the data exchange between this client and OutlineViewer
 */

import { NetworkTableInstance } from '../src';

// Configuration
const SERVER_ADDRESS = 'localhost';
const SERVER_PORT = 5810;
const CLIENT_NAME = 'NT4-Example-Client';

// Get the default NetworkTables instance
const ntInstance = NetworkTableInstance.getDefault();

// Track published topics for cleanup
const publishedTopics: string[] = [];

// Set up event listeners for connection status
let isConnected = false;
const connectionCheckInterval = setInterval(() => {
  const newConnectedState = ntInstance.isConnected();
  if (newConnectedState && !isConnected) {
    // Just connected
    console.log('Connected to NetworkTables server!');
    onConnect();
  } else if (!newConnectedState && isConnected) {
    // Just disconnected
    console.log('Disconnected from NetworkTables server!');
  }
  isConnected = newConnectedState;
}, 1000);

// Connection callback
function onConnect(): void {
  // Publish some example topics
  publishExampleTopics();

  // Start updating values periodically
  startPeriodicUpdates();
}

// Publish example topics with different data types
function publishExampleTopics(): void {
  console.log('Publishing example topics...');
  
  // Get tables for organization
  const exampleTable = ntInstance.getTable('example');
  
  // Boolean entry
  const booleanEntry = exampleTable.getEntry('boolean');
  booleanEntry.setBoolean(true);
  publishedTopics.push('example/boolean');
  
  // Number entry
  const numberEntry = exampleTable.getEntry('number');
  numberEntry.setDouble(42.5);
  publishedTopics.push('example/number');
  
  // String entry
  const stringEntry = exampleTable.getEntry('string');
  stringEntry.setString('Hello from NT4 client!');
  publishedTopics.push('example/string');
  
  // Boolean array entry
  const booleanArrayEntry = exampleTable.getEntry('boolean_array');
  booleanArrayEntry.setBooleanArray([true, false, true]);
  publishedTopics.push('example/boolean_array');
  
  // Number array entry
  const numberArrayEntry = exampleTable.getEntry('number_array');
  numberArrayEntry.setDoubleArray([1.1, 2.2, 3.3]);
  publishedTopics.push('example/number_array');
  
  // String array entry
  const stringArrayEntry = exampleTable.getEntry('string_array');
  stringArrayEntry.setStringArray(['one', 'two', 'three']);
  publishedTopics.push('example/string_array');
  
  // Counter entry (will be updated periodically)
  const counterEntry = exampleTable.getEntry('counter');
  counterEntry.setDouble(0);
  publishedTopics.push('example/counter');
  
  // Timestamp entry (will be updated periodically)
  const timestampEntry = exampleTable.getEntry('timestamp');
  timestampEntry.setString(new Date().toISOString());
  publishedTopics.push('example/timestamp');
}

// Start periodic updates of some topics
function startPeriodicUpdates(): void {
  let counter = 0;
  const exampleTable = ntInstance.getTable('example');

  // Update counter and timestamp every second
  setInterval(() => {
    // Update counter
    counter++;
    const counterEntry = exampleTable.getEntry('counter');
    counterEntry.setDouble(counter);

    // Update timestamp
    const timestampEntry = exampleTable.getEntry('timestamp');
    timestampEntry.setString(new Date().toISOString());

    // Update a random value
    const randomValue = Math.random() * 100;
    const numberEntry = exampleTable.getEntry('number');
    numberEntry.setDouble(randomValue);
  }, 1000);
}

// Handle cleanup on exit
function cleanup(): void {
  console.log('Cleaning up...');
  
  // Clear the connection check interval
  clearInterval(connectionCheckInterval);
  
  // Disconnect from server
  ntInstance.stopClient();
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Shutting down...');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM. Shutting down...');
  cleanup();
  process.exit(0);
});

// Connect to the server
console.log(`Connecting to NetworkTables server at ${SERVER_ADDRESS}:${SERVER_PORT}...`);
ntInstance.startClient4(CLIENT_NAME, SERVER_ADDRESS, SERVER_PORT);

console.log('NT4 client started. Press Ctrl+C to exit.');
