/**
 * NT4 Server Example
 * 
 * This example creates an NT4 server that publishes some test topics
 * and logs all client interactions.
 */

import { NT4_Server, NT4_Topic } from '../src/working-server/NT4_Server';

// Create a new NT4 server
const server = new NT4_Server(
  'NT4ServerExample',
  // Client connect callback
  (clientId: string) => {
    console.log(`[EVENT] Client connected: ${clientId}`);
  },
  // Client disconnect callback
  (clientId: string) => {
    console.log(`[EVENT] Client disconnected: ${clientId}`);
  },
  // Topic publish callback
  (topic: NT4_Topic, clientId: string) => {
    console.log(`[EVENT] Client ${clientId} published topic: ${topic.name} (${topic.type})`);
    console.log(`[EVENT] Topic properties:`, topic.properties);
  },
  // Topic unpublish callback
  (topic: NT4_Topic, clientId: string) => {
    console.log(`[EVENT] Client ${clientId} unpublished topic: ${topic.name}`);
  },
  // Topic update callback
  (topic: NT4_Topic, value: any, timestamp: number, clientId: string) => {
    console.log(`[EVENT] Client ${clientId} updated topic: ${topic.name}`);
    console.log(`[EVENT] New value:`, value);
    console.log(`[EVENT] Timestamp: ${timestamp}`);
  },
  // Subscribe callback
  (patterns: string[], options: any, clientId: string) => {
    console.log(`[EVENT] Client ${clientId} subscribed to patterns:`, patterns);
    console.log(`[EVENT] Subscription options:`, options);
  },
  // Unsubscribe callback
  (subuid: number, clientId: string) => {
    console.log(`[EVENT] Client ${clientId} unsubscribed from subscription ${subuid}`);
  }
);

// Start the server
server.start();

// Create some test topics
console.log('Creating test topics...');

// Boolean
const booleanTopic = server.createTopic('/test/boolean', 'boolean', {
  persistent: true,
  retained: true,
  source: 'nt4-server-example'
}, true);

// Number
const numberTopic = server.createTopic('/test/number', 'double', {
  persistent: true,
  retained: true,
  source: 'nt4-server-example'
}, 3.14159);

// String
const stringTopic = server.createTopic('/test/string', 'string', {
  persistent: true,
  retained: true,
  source: 'nt4-server-example'
}, 'Hello from NT4 Server!');

// Boolean array
const booleanArrayTopic = server.createTopic('/test/boolean_array', 'boolean[]', {
  persistent: true,
  retained: true,
  source: 'nt4-server-example'
}, [true, false, true]);

// Number array
const numberArrayTopic = server.createTopic('/test/number_array', 'double[]', {
  persistent: true,
  retained: true,
  source: 'nt4-server-example'
}, [1.1, 2.2, 3.3, 4.4]);

// String array
const stringArrayTopic = server.createTopic('/test/string_array', 'string[]', {
  persistent: true,
  retained: true,
  source: 'nt4-server-example'
}, ['one', 'two', 'three']);

// Update counter periodically
let counter = 0;
const counterTopic = server.createTopic('/test/counter', 'double', {
  persistent: true,
  retained: true,
  source: 'nt4-server-example'
}, counter);

// Update counter every second
setInterval(() => {
  server.updateTopic('/test/counter', counter++);
  
  if (counter % 10 === 0) {
    console.log(`Counter updated: ${counter-1}`);
  }
}, 1000);

console.log('Server is running on port 5810');
console.log('Connect OutlineViewer to localhost:5810');

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping server...');
  server.stop();
  process.exit(0);
});
