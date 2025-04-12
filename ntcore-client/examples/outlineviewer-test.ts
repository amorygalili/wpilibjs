import { NetworkTableInstance } from '../src/index.js';

/**
 * This example demonstrates how to use the ntcore-like API to communicate with OutlineViewer.
 * 
 * To use this example:
 * 1. Start OutlineViewer as a server (File > Start Server)
 * 2. Run this example with: pnpm run example:outlineviewer
 * 3. Watch the values update in OutlineViewer
 */

// Get the default NetworkTables instance
const inst = NetworkTableInstance.getDefault();

// Start the client
console.log('Connecting to NetworkTables server...');
inst.startClient4('NT4-OutlineViewer-Test', 'localhost');

// Get a table
const table = inst.getTable('OutlineViewerTest');

// Create entries for different data types
const booleanEntry = table.getEntry('Boolean');
const doubleEntry = table.getEntry('Double');
const stringEntry = table.getEntry('String');
const booleanArrayEntry = table.getEntry('BooleanArray');
const doubleArrayEntry = table.getEntry('DoubleArray');
const stringArrayEntry = table.getEntry('StringArray');

// Initialize values
booleanEntry.setBoolean(false);
doubleEntry.setDouble(0);
stringEntry.setString('Starting...');
booleanArrayEntry.setBooleanArray([true, false]);
doubleArrayEntry.setDoubleArray([0, 1, 2]);
stringArrayEntry.setStringArray(['Hello', 'OutlineViewer']);

// Create a counter
let counter = 0;

// Update values every second
const interval = setInterval(() => {
  counter++;
  
  // Update values
  booleanEntry.setBoolean(counter % 2 === 0);
  doubleEntry.setDouble(counter * 1.1);
  stringEntry.setString(`Count: ${counter}`);
  booleanArrayEntry.setBooleanArray([counter % 2 === 0, counter % 3 === 0]);
  doubleArrayEntry.setDoubleArray([counter, counter * 2, counter * 3]);
  stringArrayEntry.setStringArray([`Count: ${counter}`, `Timestamp: ${new Date().toISOString()}`]);
  
  // Print current values
  console.log(`Counter: ${counter}`);
  console.log(`Boolean: ${booleanEntry.getBoolean(false)}`);
  console.log(`Double: ${doubleEntry.getDouble(0)}`);
  console.log(`String: ${stringEntry.getString('')}`);
  console.log(`BooleanArray: ${booleanArrayEntry.getBooleanArray([])}`);
  console.log(`DoubleArray: ${doubleArrayEntry.getDoubleArray([])}`);
  console.log(`StringArray: ${stringArrayEntry.getStringArray([])}`);
  console.log('---');
  
  // Check if we're connected
  if (!inst.isConnected()) {
    console.log('Not connected to server. Trying to reconnect...');
  }
}, 1000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('Disconnecting from NetworkTables server...');
  clearInterval(interval);
  inst.stopClient();
  process.exit(0);
});
