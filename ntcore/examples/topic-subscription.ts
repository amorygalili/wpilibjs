/**
 * Topic Subscription Example
 * 
 * This example demonstrates how to subscribe to topic changes in NetworkTables.
 * It shows different ways to listen for value changes, flag changes, and entry deletion.
 */

import { NetworkTables } from '../src/api/NetworkTables';
import { NTEntryNotification } from '../src/types/NTTypes';

// Create a new NetworkTables instance
const nt = new NetworkTables();

// Start the client
async function main() {
  console.log('Starting NetworkTables client with topic subscriptions...');
  
  // Connect to the server on the default port
  await nt.connectAsClient();
  console.log('Connected to server successfully');
  
  // Method 1: Subscribe to specific topics
  const counterTopic = nt.getNumber('demo/counter');
  const messageTopic = nt.getString('demo/message');
  
  // Listen for value changes on specific topics
  counterTopic.on('valueChanged', (value) => {
    console.log(`[Method 1] Counter value changed: ${value}`);
  });
  
  messageTopic.on('valueChanged', (value) => {
    console.log(`[Method 1] Message value changed: ${value}`);
  });
  
  // Listen for flag changes
  counterTopic.on('flagsChanged', (flags) => {
    console.log(`[Method 1] Counter flags changed: ${flags}`);
    console.log(`[Method 1] Counter is persistent: ${counterTopic.persistent}`);
  });
  
  // Method 2: Global entry listener for all entries
  nt['_instance'].addEntryListener(
    (notification: NTEntryNotification) => {
      console.log(`[Method 2] Entry notification for ${notification.name}:`);
      console.log(`  Value: ${notification.value}`);
      console.log(`  Flags: ${notification.flags}`);
      console.log(`  Is new: ${notification.isNew}`);
      console.log(`  Is delete: ${notification.isDelete}`);
    },
    {
      notifyOnUpdate: true,
      notifyOnNew: true,
      notifyOnDelete: true,
      notifyOnFlagsChange: true,
      notifyImmediately: false
    }
  );
  
  // Method 3: Global entry listener with prefix filter
  nt['_instance'].addEntryListener(
    (notification: NTEntryNotification) => {
      console.log(`[Method 3] Robot entry notification for ${notification.name}:`);
      console.log(`  Value: ${notification.value}`);
    },
    {
      notifyOnUpdate: true,
      notifyOnNew: true,
      notifyOnDelete: false,
      notifyOnFlagsChange: false,
      notifyImmediately: false
    },
    'robot/'
  );
  
  // Create some entries to demonstrate the listeners
  console.log('Creating some entries to demonstrate the listeners...');
  
  // These will trigger the listeners
  counterTopic.value = 42;
  messageTopic.value = 'Hello, NetworkTables!';
  
  // Create a robot status entry (will trigger Method 2 and Method 3)
  const robotEnabled = nt.getBoolean('robot/enabled');
  robotEnabled.value = true;
  
  // Make the counter persistent (will trigger the flagsChanged listener)
  setTimeout(() => {
    console.log('\nChanging counter to persistent...');
    counterTopic.persistent = true;
  }, 2000);
  
  // Update values periodically
  let counter = 42;
  setInterval(() => {
    counter++;
    
    // Update values (will trigger the valueChanged listeners)
    counterTopic.value = counter;
    messageTopic.value = `Hello, NetworkTables! (${counter})`;
    robotEnabled.value = counter % 2 === 0; // Toggle between true and false
    
    console.log('\nUpdated values:');
    console.log(`- demo/counter: ${counterTopic.value}`);
    console.log(`- demo/message: ${messageTopic.value}`);
    console.log(`- robot/enabled: ${robotEnabled.value}`);
  }, 5000);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Run the main function
main().catch(console.error);
