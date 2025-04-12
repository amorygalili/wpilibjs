/**
 * NetworkTables Client Example
 *
 * This example demonstrates how to use the NetworkTablesClient to connect to a
 * NetworkTables server, publish a topic, and set values.
 */

import { NetworkTablesClient, NetworkTablesClientEvent } from '../src/client';

// Create a client
const client = new NetworkTablesClient({
  serverHost: 'localhost',
  serverPort: 5820, // Match the server port
  clientName: 'example-client'
});

// Track if our topic has been announced
let topicAnnounced = false;

// Set up event handlers
client.on(NetworkTablesClientEvent.Connected, () => {
  console.log('Connected to server');

  // Subscribe to all topics
  const subId = client.subscribe(['']);
  console.log(`Subscribed with ID: ${subId}`);

  // Publish a topic
  const pubId = client.publish('/example/counter', 'double', {
    persistent: true
  });
  console.log(`Published topic with ID: ${pubId}`);

  // We'll use the global topicAnnounced variable

  // Start updating the counter
  let counter = 0;
  setInterval(() => {
    if (topicAnnounced) {
      try {
        client.setValue(pubId, counter++);
        console.log(`Set value: ${counter-1}`);
      } catch (error) {
        console.error('Error setting value:', error);
      }
    } else {
      console.log('Waiting for topic announcement...');
    }
  }, 1000);
});

client.on(NetworkTablesClientEvent.Disconnected, () => {
  console.log('Disconnected from server');
});

client.on(NetworkTablesClientEvent.TopicAnnounced, (topic) => {
  console.log(`Topic announced: ${topic.name} (${topic.type})`);

  // Check if our published topic was announced
  if (topic.name === '/example/counter') {
    topicAnnounced = true;
    console.log('Our topic was announced, starting to send values');
  }
});

client.on(NetworkTablesClientEvent.TopicUnannounced, (topic) => {
  console.log(`Topic unannounced: ${topic.name}`);
});

client.on(NetworkTablesClientEvent.ValueChanged, (topicName, value) => {
  console.log(`Value changed for ${topicName}: ${JSON.stringify(value.value)}`);
});

// Connect to the server
client.connect();

// Handle process termination
process.on('SIGINT', () => {
  console.log('Disconnecting...');
  client.disconnect();
  process.exit(0);
});
