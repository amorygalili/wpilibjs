/**
 * Example of using the NetworkTables 4 bridge to connect our simulation to Shuffleboard and OutlineViewer.
 * 
 * This example connects to a NetworkTables server and bridges our internal NetworkTables
 * with the external NetworkTables server, allowing our simulation to communicate with
 * Shuffleboard and OutlineViewer.
 */
import { NT4Bridge } from '../src/network/NT4Bridge';
import { NT4Client } from '../src/network/NT4Client';
import { networkTables } from '../src/network/NetworkTablesInterface';

// Create a NetworkTables 4 client
const client = new NT4Client('ws://localhost:5810');

// Create a NetworkTables 4 bridge
const bridge = new NT4Bridge(client);

// Connect to the NetworkTables server
bridge.connect()
  .then(() => {
    console.log('Connected to NetworkTables server');

    // Create some topics in our internal NetworkTables
    const booleanTopic = networkTables.getBoolean('example/boolean');
    const numberTopic = networkTables.getNumber('example/number');
    const stringTopic = networkTables.getString('example/string');
    const booleanArrayTopic = networkTables.getBooleanArray('example/booleanArray');
    const numberArrayTopic = networkTables.getNumberArray('example/numberArray');
    const stringArrayTopic = networkTables.getStringArray('example/stringArray');
    const counterTopic = networkTables.getNumber('example/counter');

    // Set initial values
    booleanTopic.value = true;
    numberTopic.value = 42;
    stringTopic.value = 'Hello, NetworkTables!';
    booleanArrayTopic.value = [true, false, true];
    numberArrayTopic.value = [1, 2, 3, 4, 5];
    stringArrayTopic.value = ['Hello', 'NetworkTables', '!'];
    counterTopic.value = 0;

    // Update a value every second
    let counter = 0;
    setInterval(() => {
      counterTopic.value = counter++;
    }, 1000);

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('Disconnecting from NetworkTables server');
      bridge.disconnect();
      process.exit(0);
    });
  })
  .catch((error) => {
    console.error('Error connecting to NetworkTables server:', error);
  });
