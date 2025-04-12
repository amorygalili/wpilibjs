/**
 * Data Types Client Example
 * 
 * This example demonstrates all the supported data types in NetworkTables.
 * It creates a client that connects to a server and subscribes to entries
 * of each supported data type.
 */

import { NetworkTables } from '../src/api/NetworkTables';

// Create a new NetworkTables instance
const nt = new NetworkTables();

// Start the client
async function main() {
  console.log('Starting NetworkTables client to monitor different data types...');
  
  // Connect to the server on the default port
  await nt.connectAsClient();
  console.log('Connected to server successfully');
  
  // Get topics for each data type
  const booleanTopic = nt.getBoolean('types/boolean');
  const numberTopic = nt.getNumber('types/number');
  const stringTopic = nt.getString('types/string');
  const booleanArrayTopic = nt.getBooleanArray('types/booleanArray');
  const numberArrayTopic = nt.getNumberArray('types/numberArray');
  const stringArrayTopic = nt.getStringArray('types/stringArray');
  
  // Subscribe to value changes
  booleanTopic.on('valueChanged', (value) => {
    console.log(`Boolean value changed: ${value}`);
  });
  
  numberTopic.on('valueChanged', (value) => {
    console.log(`Number value changed: ${value}`);
  });
  
  stringTopic.on('valueChanged', (value) => {
    console.log(`String value changed: ${value}`);
  });
  
  booleanArrayTopic.on('valueChanged', (value) => {
    console.log(`Boolean array value changed: [${value.join(', ')}]`);
  });
  
  numberArrayTopic.on('valueChanged', (value) => {
    console.log(`Number array value changed: [${value.join(', ')}]`);
  });
  
  stringArrayTopic.on('valueChanged', (value) => {
    console.log(`String array value changed: [${value.join(', ')}]`);
  });
  
  // Check for persistence
  numberTopic.on('flagsChanged', (flags) => {
    console.log(`Number topic flags changed: ${flags}`);
    console.log(`Number topic is persistent: ${numberTopic.persistent}`);
  });
  
  // Print current values periodically
  setInterval(() => {
    console.log('\nCurrent NetworkTables values:');
    console.log(`- types/boolean: ${booleanTopic.value}`);
    console.log(`- types/number: ${numberTopic.value}`);
    console.log(`- types/string: ${stringTopic.value}`);
    console.log(`- types/booleanArray: [${booleanArrayTopic.value?.join(', ') || 'undefined'}]`);
    console.log(`- types/numberArray: [${numberArrayTopic.value?.join(', ') || 'undefined'}]`);
    console.log(`- types/stringArray: [${stringArrayTopic.value?.join(', ') || 'undefined'}]`);
    console.log(`- types/number is persistent: ${numberTopic.persistent}`);
  }, 5000);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Run the main function
main().catch(console.error);
