/**
 * Simple test program that just starts the NetworkTables server.
 * 
 * This program starts the NetworkTables server on port 1735 and waits for connections.
 */
import { networkTables } from '../src';

// Start the NetworkTables server
console.log('Starting NetworkTables server on port 1735...');

networkTables.startServer(1735).then(() => {
  console.log('NetworkTables server started successfully');
  
  // Create some test topics
  console.log('Creating test topics...');
  
  // Boolean values
  const booleanValue = networkTables.getBoolean('SmartDashboard/Test/Boolean', false);
  const booleanArray = networkTables.getBooleanArray('SmartDashboard/Test/BooleanArray', [false, true, false]);
  
  // Number values
  const numberValue = networkTables.getNumber('SmartDashboard/Test/Number', 42);
  const numberArray = networkTables.getNumberArray('SmartDashboard/Test/NumberArray', [1, 2, 3, 4, 5]);
  
  // String values
  const stringValue = networkTables.getString('SmartDashboard/Test/String', 'Hello OutlineViewer!');
  const stringArray = networkTables.getStringArray('SmartDashboard/Test/StringArray', ['Hello', 'OutlineViewer', '!']);
  
  console.log('Test topics created');
  console.log('Waiting for connections...');
  
  // Update values periodically
  let counter = 0;
  setInterval(() => {
    counter++;
    
    // Update boolean values
    booleanValue.value = counter % 2 === 0;
    booleanArray.value = [counter % 3 === 0, counter % 5 === 0, counter % 7 === 0];
    
    // Update number values
    numberValue.value = counter;
    numberArray.value = [counter % 10, (counter % 10) * 2, (counter % 10) * 3, (counter % 10) * 4, (counter % 10) * 5];
    
    // Update string values
    stringValue.value = `Hello OutlineViewer! Counter: ${counter}`;
    stringArray.value = [`Counter: ${counter}`, `Even: ${counter % 2 === 0}`, `Odd: ${counter % 2 === 1}`];
    
    if (counter % 10 === 0) {
      console.log(`Updated values (counter: ${counter})`);
    }
  }, 1000);
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Shutting down NetworkTables server...');
    process.exit(0);
  });
}).catch((error) => {
  console.error('Failed to start NetworkTables server:', error);
});
