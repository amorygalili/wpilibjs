import { NT4_Client, NT4_Topic } from '../src/index.js';

// Create a new NT4 client
const client = new NT4_Client(
  'localhost', // Server address - change to your OutlineViewer IP
  'NodeJS-Example', // Client name
  onTopicAnnounce,
  onTopicUnannounce,
  onNewTopicData,
  onConnect,
  onDisconnect
);

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
  console.log(`New data for ${topic.name}: ${value} (timestamp: ${timestamp_us})`);
}

// Connection callback
function onConnect(): void {
  console.log('Connected to NT server!');

  // Publish some topics
  client.publishTopic('example/number', 'double');
  client.publishTopic('example/string', 'string');
  client.publishTopic('example/boolean', 'boolean');
  client.publishTopic('example/array', 'double[]');

  // Set some properties
  client.setPersistent('example/number', true);

  // Subscribe to all topics
  client.subscribe([''], true);

  // Start sending data
  startPublishing();
}

// Disconnection callback
function onDisconnect(): void {
  console.log('Disconnected from NT server');
  stopPublishing();
}

let publishInterval: NodeJS.Timeout | null = null;
let counter = 0;

// Start publishing data
function startPublishing(): void {
  if (publishInterval === null) {
    publishInterval = setInterval(() => {
      counter++;

      // Publish different types of data
      client.addSample('example/number', counter);
      client.addSample('example/string', `Count: ${counter}`);
      client.addSample('example/boolean', counter % 2 === 0);
      client.addSample('example/array', [counter, counter * 2, counter * 3]);

      console.log(`Published data: counter = ${counter}`);
    }, 1000);
  }
}

// Stop publishing data
function stopPublishing(): void {
  if (publishInterval !== null) {
    clearInterval(publishInterval);
    publishInterval = null;
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down...');
  stopPublishing();
  client.disconnect();
  process.exit(0);
});

// Connect to the server
console.log('Connecting to NT server...');
client.connect();

// Keep the process running
console.log('Press Ctrl+C to exit');
