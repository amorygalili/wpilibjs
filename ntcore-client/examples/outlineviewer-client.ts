/**
 * NetworkTables client example that connects to OutlineViewer.
 * 
 * This example demonstrates how to:
 * 1. Connect to OutlineViewer (running as a server)
 * 2. Subscribe to all topics
 * 3. Print changes to topics
 * 4. Publish topic values
 * 
 * To use this example:
 * 1. Start OutlineViewer and configure it as a server
 * 2. Run this example with: npx ts-node examples/outlineviewer-client.ts
 * 3. Observe the data exchange between this client and OutlineViewer
 */

import { NT4_Client, NT4_Topic } from '../src/NT4';

// Configuration
const SERVER_ADDRESS = 'localhost';
const SERVER_PORT = 5810;
const CLIENT_NAME = 'NT4-Example-Client';

// Create a new NT4 client
const client = new NT4_Client(
  SERVER_ADDRESS,
  CLIENT_NAME,
  onTopicAnnounce,
  onTopicUnannounce,
  onNewTopicData,
  onConnect,
  onDisconnect,
  SERVER_PORT
);

// Track published topics for cleanup
const publishedTopics: string[] = [];

// Topic announcement callback
function onTopicAnnounce(topic: NT4_Topic): void {
  console.log(`Topic announced: ${topic.name} (type: ${topic.type})`);
}

// Topic unannouncement callback
function onTopicUnannounce(topic: NT4_Topic): void {
  console.log(`Topic unannounced: ${topic.name}`);
}

// New topic data callback
function onNewTopicData(topic: NT4_Topic, timestamp_us: number, value: unknown): void {
  const timestamp = new Date(timestamp_us / 1000).toISOString();
  console.log(`[${timestamp}] New data for ${topic.name}: ${JSON.stringify(value)}`);
}

// Connection callback
function onConnect(): void {
  console.log('Connected to NetworkTables server!');

  // Subscribe to all topics
  console.log('Subscribing to all topics...');
  client.subscribe(['/'], true);

  // Publish some example topics
  publishExampleTopics();

  // Start updating values periodically
  startPeriodicUpdates();
}

// Disconnection callback
function onDisconnect(): void {
  console.log('Disconnected from NetworkTables server!');
}

// Publish example topics with different data types
function publishExampleTopics(): void {
  console.log('Publishing example topics...');

  // Boolean topic
  client.publishTopic('/example/boolean', 'boolean');
  publishedTopics.push('/example/boolean');
  client.addSample('/example/boolean', true);

  // Number topic
  client.publishTopic('/example/number', 'double');
  publishedTopics.push('/example/number');
  client.addSample('/example/number', 42.5);

  // String topic
  client.publishTopic('/example/string', 'string');
  publishedTopics.push('/example/string');
  client.addSample('/example/string', 'Hello from NT4 client!');

  // Boolean array topic
  client.publishTopic('/example/boolean_array', 'boolean[]');
  publishedTopics.push('/example/boolean_array');
  client.addSample('/example/boolean_array', [true, false, true]);

  // Number array topic
  client.publishTopic('/example/number_array', 'double[]');
  publishedTopics.push('/example/number_array');
  client.addSample('/example/number_array', [1.1, 2.2, 3.3]);

  // String array topic
  client.publishTopic('/example/string_array', 'string[]');
  publishedTopics.push('/example/string_array');
  client.addSample('/example/string_array', ['one', 'two', 'three']);

  // Counter topic (will be updated periodically)
  client.publishTopic('/example/counter', 'int');
  publishedTopics.push('/example/counter');
  client.addSample('/example/counter', 0);

  // Timestamp topic (will be updated periodically)
  client.publishTopic('/example/timestamp', 'string');
  publishedTopics.push('/example/timestamp');
  client.addSample('/example/timestamp', new Date().toISOString());
}

// Start periodic updates of some topics
function startPeriodicUpdates(): void {
  let counter = 0;

  // Update counter and timestamp every second
  setInterval(() => {
    // Update counter
    counter++;
    client.addSample('/example/counter', counter);

    // Update timestamp
    client.addSample('/example/timestamp', new Date().toISOString());

    // Update a random value
    const randomValue = Math.random() * 100;
    client.addSample('/example/number', randomValue);
  }, 1000);
}

// Handle cleanup on exit
function cleanup(): void {
  console.log('Cleaning up...');
  
  // Unpublish all topics
  publishedTopics.forEach(topic => {
    try {
      client.unpublishTopic(topic);
    } catch (error) {
      console.error(`Error unpublishing topic ${topic}:`, error);
    }
  });
  
  // Disconnect from server
  client.disconnect();
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
client.connect();

console.log('NT4 client started. Press Ctrl+C to exit.');
