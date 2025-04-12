/**
 * NetworkTables Server Test for OutlineViewer (Version 3)
 *
 * This example creates a NetworkTables server and a client that publishes various data types
 * for testing with OutlineViewer.
 */

import { NetworkTablesServer, NetworkTablesServerEvent } from '../src/server';
import { NetworkTablesClient, NetworkTablesClientEvent } from '../src/client';
import { DataType } from '../src/types';

// Create a server
const server = new NetworkTablesServer({
  port: 5810, // Standard NT port
  persistentFilePath: './networktables.json'
});

// Create a client that will connect to our server
const client = new NetworkTablesClient({
  serverHost: 'localhost',
  serverPort: 5810,
  clientName: 'ntcorejs-test-client'
});

// Store publication IDs and their announcement status
const publications = new Map<number, { name: string, announced: boolean }>();

// Set up server event handlers
server.on(NetworkTablesServerEvent.Started, (port) => {
  console.log(`Server started on port ${port}`);
  console.log('Connect OutlineViewer to localhost:5810');

  // Connect the client to the server
  client.connect();
});

server.on(NetworkTablesServerEvent.ClientConnected, (clientId) => {
  console.log(`Client connected to server: ${clientId}`);
});

server.on(NetworkTablesServerEvent.ClientDisconnected, (clientId) => {
  console.log(`Client disconnected from server: ${clientId}`);
});

server.on(NetworkTablesServerEvent.TopicPublished, (topic) => {
  console.log(`Topic published: ${topic.name} (${topic.type})`);
});

server.on(NetworkTablesServerEvent.TopicUnpublished, (topic) => {
  console.log(`Topic unpublished: ${topic.name}`);
});

server.on(NetworkTablesServerEvent.ValueChanged, (topicName, value) => {
  // Don't log counter updates to reduce noise
  if (!topicName.includes('counter')) {
    console.log(`Value changed on server: ${topicName} = ${JSON.stringify(value)}`);
  }
});

// Set up client event handlers
client.on(NetworkTablesClientEvent.Connected, () => {
  console.log('Client connected to server');

  // Publish some test values after a short delay
  setTimeout(publishTestValues, 2000);
});

client.on(NetworkTablesClientEvent.Disconnected, () => {
  console.log('Client disconnected from server');
});

client.on(NetworkTablesClientEvent.TopicAnnounced, (topic) => {
  console.log(`Topic announced to client: ${topic.name} (${topic.type})`);

  // Find the publication for this topic and mark it as announced
  for (const [pubId, pub] of publications.entries()) {
    if (pub.name === topic.name) {
      publications.set(pubId, { ...pub, announced: true });
      console.log(`Marked topic ${topic.name} as announced`);
      break;
    }
  }
});

client.on(NetworkTablesClientEvent.ValueChanged, (topicName, value) => {
  // Don't log counter updates to reduce noise
  if (!topicName.includes('counter')) {
    console.log(`Value changed on client: ${topicName} = ${JSON.stringify(value)}`);
  }
});

// Start the server
server.start();

// Function to publish test values of different types
function publishTestValues() {
  console.log('Publishing test values...');

  // Subscribe to all topics
  const subId = client.subscribe(['']);
  console.log(`Subscribed with ID: ${subId}`);

  // Boolean
  const booleanPubId = client.publish('/test/boolean', 'boolean', { persistent: true });
  publications.set(booleanPubId, { name: '/test/boolean', announced: false });
  console.log(`Published /test/boolean with ID: ${booleanPubId}`);

  // Number (double)
  const numberPubId = client.publish('/test/number', 'double', { persistent: true });
  publications.set(numberPubId, { name: '/test/number', announced: false });
  console.log(`Published /test/number with ID: ${numberPubId}`);

  // String
  const stringPubId = client.publish('/test/string', 'string', { persistent: true });
  publications.set(stringPubId, { name: '/test/string', announced: false });
  console.log(`Published /test/string with ID: ${stringPubId}`);

  // Boolean array
  const boolArrayPubId = client.publish('/test/boolean_array', 'boolean[]', { persistent: true });
  publications.set(boolArrayPubId, { name: '/test/boolean_array', announced: false });
  console.log(`Published /test/boolean_array with ID: ${boolArrayPubId}`);

  // Number array
  const numberArrayPubId = client.publish('/test/number_array', 'double[]', { persistent: true });
  publications.set(numberArrayPubId, { name: '/test/number_array', announced: false });
  console.log(`Published /test/number_array with ID: ${numberArrayPubId}`);

  // String array
  const stringArrayPubId = client.publish('/test/string_array', 'string[]', { persistent: true });
  publications.set(stringArrayPubId, { name: '/test/string_array', announced: false });
  console.log(`Published /test/string_array with ID: ${stringArrayPubId}`);

  // Counter
  const counterPubId = client.publish('/test/counter', 'double', { persistent: true });
  publications.set(counterPubId, { name: '/test/counter', announced: false });
  console.log(`Published /test/counter with ID: ${counterPubId}`);

  // Set initial values once topics are announced
  setTimeout(setInitialValues, 1000);
}

// Set initial values for all topics
function setInitialValues() {
  console.log('Setting initial values...');

  // Set values for all announced topics
  for (const [pubId, pub] of publications.entries()) {
    if (pub.announced) {
      try {
        switch (pub.name) {
          case '/test/boolean':
            client.setValue(pubId, true);
            console.log(`Set ${pub.name} = true`);
            break;
          case '/test/number':
            client.setValue(pubId, 3.14159);
            console.log(`Set ${pub.name} = 3.14159`);
            break;
          case '/test/string':
            client.setValue(pubId, 'Hello from ntcorejs!');
            console.log(`Set ${pub.name} = 'Hello from ntcorejs!'`);
            break;
          case '/test/boolean_array':
            client.setValue(pubId, [true, false, true]);
            console.log(`Set ${pub.name} = [true, false, true]`);
            break;
          case '/test/number_array':
            client.setValue(pubId, [1.1, 2.2, 3.3, 4.4]);
            console.log(`Set ${pub.name} = [1.1, 2.2, 3.3, 4.4]`);
            break;
          case '/test/string_array':
            client.setValue(pubId, ['one', 'two', 'three']);
            console.log(`Set ${pub.name} = ['one', 'two', 'three']`);
            break;
        }
      } catch (error) {
        console.error(`Error setting value for ${pub.name}:`, error);
      }
    } else {
      console.log(`Waiting for topic ${pub.name} to be announced...`);
    }
  }

  // Check if all topics are announced
  const allAnnounced = Array.from(publications.values()).every(pub => pub.announced);
  if (!allAnnounced) {
    // Try again in 1 second
    setTimeout(setInitialValues, 1000);
  } else {
    // Start updating counter
    startCounter();
  }
}

// Start updating counter
function startCounter() {
  console.log('Starting counter updates...');

  // Find the counter publication ID
  let counterPubId: number | undefined;
  for (const [pubId, pub] of publications.entries()) {
    if (pub.name === '/test/counter') {
      counterPubId = pubId;
      break;
    }
  }

  if (counterPubId !== undefined) {
    let counter = 0;
    setInterval(() => {
      try {
        client.setValue(counterPubId!, counter++);
        if (counter % 10 === 0) {
          console.log(`Counter updated: ${counter-1}`);
        }
      } catch (error) {
        console.error('Error updating counter:', error);
      }
    }, 1000);
  }
}

console.log('Server starting...');
