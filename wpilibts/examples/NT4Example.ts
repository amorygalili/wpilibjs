/**
 * Example of using the NetworkTables 4 client to communicate with Shuffleboard and OutlineViewer.
 * 
 * This example connects to a NetworkTables server and publishes some values that can be
 * viewed in Shuffleboard or OutlineViewer.
 */
import { NT4Client, NT4DataType } from '../src/network/NT4Client';

// Create a NetworkTables 4 client
const client = new NT4Client('ws://localhost:5810');

// Connect to the NetworkTables server
client.connect()
  .then(() => {
    console.log('Connected to NetworkTables server');

    // Subscribe to all topics
    client.subscribe({
      all: true,
      immediate: true
    });

    // Listen for topic announcements
    client.addAnnouncementListener((topic) => {
      console.log('Topic announced:', topic.name, 'Type:', topic.type);
    });

    // Listen for topic unannouncements
    client.addUnAnnouncementListener((topicName, topicId) => {
      console.log('Topic unannounced:', topicName, 'ID:', topicId);
    });

    // Listen for value changes on a specific topic
    client.addValueListener('example/counter', (value, timestamp) => {
      console.log('Counter value changed:', value, 'Timestamp:', timestamp);
    });

    // Publish some values
    client.publish('example/boolean', true, NT4DataType.Boolean);
    client.publish('example/number', 42, NT4DataType.Double);
    client.publish('example/string', 'Hello, NetworkTables!', NT4DataType.String);
    client.publish('example/booleanArray', [true, false, true], NT4DataType.BooleanArray);
    client.publish('example/numberArray', [1, 2, 3, 4, 5], NT4DataType.DoubleArray);
    client.publish('example/stringArray', ['Hello', 'NetworkTables', '!'], NT4DataType.StringArray);

    // Update a value every second
    let counter = 0;
    setInterval(() => {
      client.publish('example/counter', counter++, NT4DataType.Double);
    }, 1000);

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('Disconnecting from NetworkTables server');
      client.disconnect();
      process.exit(0);
    });
  })
  .catch((error) => {
    console.error('Error connecting to NetworkTables server:', error);
  });
