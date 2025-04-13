/**
 * Simple NetworkTables test to isolate the issue with setting values.
 */

import { NetworkTableInstance } from 'ntcore-client';

// Get the default NetworkTables instance
const ntInstance = NetworkTableInstance.getDefault();

// Connect to the NetworkTables server
console.log('Connecting to NetworkTables server...');
ntInstance.startClient4('SimpleNTTest', 'localhost');

// Wait for connection
let connected = false;
const checkConnectionInterval = setInterval(() => {
  if (ntInstance.isConnected() && !connected) {
    connected = true;
    console.log('Connected to NetworkTables server!');
    
    // Once connected, publish topics and set values
    publishTopics();
  }
}, 1000);

function publishTopics() {
  console.log('Publishing topics...');
  
  // Get a table
  const testTable = ntInstance.getTable('TestTable');
  
  // Create topics directly
  const stringTopic = ntInstance.getTopic(testTable.getPath() + '/StringValue');
  const numberTopic = ntInstance.getTopic(testTable.getPath() + '/NumberValue');
  const booleanTopic = ntInstance.getTopic(testTable.getPath() + '/BooleanValue');
  
  // Publish the topics with their types
  console.log('Publishing topics with types...');
  stringTopic.publish('string');
  numberTopic.publish('double');
  booleanTopic.publish('boolean');
  
  // Get entries for the topics
  const stringEntry = testTable.getEntry('StringValue');
  const numberEntry = testTable.getEntry('NumberValue');
  const booleanEntry = testTable.getEntry('BooleanValue');
  
  // Set values
  console.log('Setting values...');
  stringEntry.setString('Hello from SimpleNTTest!');
  numberEntry.setDouble(42.5);
  booleanEntry.setBoolean(true);
  
  console.log('Values set. Check OutlineViewer to see if they appear.');
  
  // Update values periodically
  let counter = 0;
  setInterval(() => {
    counter++;
    console.log(`Updating values (${counter})...`);
    stringEntry.setString(`Hello from SimpleNTTest! (${counter})`);
    numberEntry.setDouble(42.5 + counter);
    booleanEntry.setBoolean(counter % 2 === 0);
  }, 2000);
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('Cleaning up...');
  clearInterval(checkConnectionInterval);
  ntInstance.stopClient();
  process.exit(0);
});

console.log('SimpleNTTest running. Press Ctrl+C to exit.');
