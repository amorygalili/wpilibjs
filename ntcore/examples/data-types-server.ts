/**
 * Data Types Server Example
 *
 * This example demonstrates all the supported data types in NetworkTables.
 * It creates a server that publishes entries of each supported data type
 * and updates them periodically.
 */

import { NetworkTables } from '../src/api/NetworkTables';

// Create a new NetworkTables instance
const nt = new NetworkTables();

// Start the server
async function main() {
  console.log('Starting NetworkTables server with different data types...');

  // Start the server on the default port
  await nt.startServer();
  console.log('Server started successfully');

  // Create topics for each data type
  const booleanTopic = nt.getBoolean('types/boolean');
  const numberTopic = nt.getNumber('types/number');
  const stringTopic = nt.getString('types/string');
  const booleanArrayTopic = nt.getBooleanArray('types/booleanArray');
  const numberArrayTopic = nt.getNumberArray('types/numberArray');
  const stringArrayTopic = nt.getStringArray('types/stringArray');

  // Set initial values
  booleanTopic.value = false;
  numberTopic.value = 0;
  stringTopic.value = 'Hello, NetworkTables!';

  // Note: There are known issues with array type handling
  // We'll set these values in the update loop instead
  // booleanArrayTopic.value = [true, false, true];
  // numberArrayTopic.value = [1, 2, 3, 4, 5];
  // stringArrayTopic.value = ['Hello', 'Network', 'Tables'];

  // Make the number topic persistent
  numberTopic.persistent = true;

  console.log('Initial values set');

  // Update values periodically
  let counter = 0;
  setInterval(() => {
    counter++;

    // Update values
    booleanTopic.value = !booleanTopic.value;
    numberTopic.value = counter;
    stringTopic.value = `Hello, NetworkTables! (${counter})`;

    // Try to update array values, but catch any errors
    try {
      booleanArrayTopic.value = [counter % 2 === 0, counter % 3 === 0, counter % 5 === 0];
      numberArrayTopic.value = [counter, counter * 2, counter * 3, counter * 4, counter * 5];
      stringArrayTopic.value = [`Count: ${counter}`, `Double: ${counter * 2}`, `Square: ${counter * counter}`];
    } catch (error: any) {
      console.error('Error updating array values:', error.message);
    }

    // Print current values
    console.log('\nCurrent NetworkTables values:');
    console.log(`- types/boolean: ${booleanTopic.value}`);
    console.log(`- types/number: ${numberTopic.value}`);
    console.log(`- types/string: ${stringTopic.value}`);
    console.log(`- types/booleanArray: [${booleanArrayTopic.value?.join(', ') || 'undefined'}]`);
    console.log(`- types/numberArray: [${numberArrayTopic.value?.join(', ') || 'undefined'}]`);
    console.log(`- types/stringArray: [${stringArrayTopic.value?.join(', ') || 'undefined'}]`);
    console.log(`- types/number is persistent: ${numberTopic.persistent}`);
  }, 2000);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Run the main function
main().catch(console.error);
