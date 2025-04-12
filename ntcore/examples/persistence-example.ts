/**
 * Persistence Example
 *
 * This example demonstrates how to use persistent entries in NetworkTables.
 * Persistent entries are saved to disk and restored when the server restarts.
 */

import { NetworkTables } from '../src/api/NetworkTables';
import { NTEntryFlags } from '../src/types/NTTypes';

// Create a new NetworkTables instance
const nt = new NetworkTables();

// Start the server
async function main() {
  console.log('Starting NetworkTables server with persistent entries...');

  // Start the server on the default port
  await nt.startServer();
  console.log('Server started successfully');

  // Create topics - some persistent, some not
  const persistentCounter = nt.getNumber('persistent/counter');
  const persistentMessage = nt.getString('persistent/message');
  const persistentSettings = nt.getNumberArray('persistent/settings');

  const regularCounter = nt.getNumber('regular/counter');
  const regularMessage = nt.getString('regular/message');

  // Set initial values
  persistentCounter.value = 0;
  persistentMessage.value = 'This message is persistent';

  regularCounter.value = 0;
  regularMessage.value = 'This message is not persistent';

  // Try to set array values, but catch any errors
  try {
    persistentSettings.value = [1, 2, 3, 4, 5];
  } catch (error: any) {
    console.error('Error setting array value:', error.message);
  }

  // Make the persistent topics actually persistent
  persistentCounter.persistent = true;
  persistentMessage.persistent = true;
  persistentSettings.persistent = true;

  console.log('Initial values set');
  console.log('Persistent entries will be saved to disk and restored on restart');
  console.log('Regular entries will be lost on restart');

  // Print the flags for each entry
  console.log('\nEntry flags:');
  console.log(`- persistent/counter: ${nt['_instance'].getFlags('persistent/counter')}`);
  console.log(`- persistent/message: ${nt['_instance'].getFlags('persistent/message')}`);
  console.log(`- persistent/settings: ${nt['_instance'].getFlags('persistent/settings')}`);
  console.log(`- regular/counter: ${nt['_instance'].getFlags('regular/counter')}`);
  console.log(`- regular/message: ${nt['_instance'].getFlags('regular/message')}`);

  // Update values periodically
  let counter = 0;
  setInterval(() => {
    counter++;

    // Update values
    persistentCounter.value = counter;
    persistentMessage.value = `This message is persistent (${counter})`;

    regularCounter.value = counter;
    regularMessage.value = `This message is not persistent (${counter})`;

    // Try to update array values, but catch any errors
    try {
      persistentSettings.value = [counter, counter * 2, counter * 3];
    } catch (error: any) {
      console.error('Error updating array value:', error.message);
    }

    // Print current values
    console.log('\nCurrent NetworkTables values:');
    console.log(`- persistent/counter: ${persistentCounter.value}`);
    console.log(`- persistent/message: ${persistentMessage.value}`);
    console.log(`- persistent/settings: [${persistentSettings.value?.join(', ') || 'undefined'}]`);
    console.log(`- regular/counter: ${regularCounter.value}`);
    console.log(`- regular/message: ${regularMessage.value}`);

    // Print persistence status
    console.log('\nPersistence status:');
    console.log(`- persistent/counter: ${persistentCounter.persistent}`);
    console.log(`- persistent/message: ${persistentMessage.persistent}`);
    console.log(`- persistent/settings: ${persistentSettings.persistent}`);
    console.log(`- regular/counter: ${regularCounter.persistent}`);
    console.log(`- regular/message: ${regularMessage.persistent}`);

    console.log('\nRestart the server to see which values are restored');
  }, 5000);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Run the main function
main().catch(console.error);
