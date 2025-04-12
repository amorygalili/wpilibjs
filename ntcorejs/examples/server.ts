/**
 * NetworkTables Server Example
 *
 * This example demonstrates how to use the NetworkTablesServer to create a
 * NetworkTables server, handle client connections, and receive values.
 */

import { NetworkTablesServer, NetworkTablesServerEvent } from '../src/server';

// Create a server
const server = new NetworkTablesServer({
  port: 5820, // Use a different port to avoid conflicts
  persistentFilePath: './networktables.json'
});

// Set up event handlers
server.on(NetworkTablesServerEvent.Started, (port) => {
  console.log(`Server started on port ${port}`);
});

server.on(NetworkTablesServerEvent.Stopped, () => {
  console.log('Server stopped');
});

server.on(NetworkTablesServerEvent.ClientConnected, (clientId) => {
  console.log(`Client connected: ${clientId}`);
});

server.on(NetworkTablesServerEvent.ClientDisconnected, (clientId) => {
  console.log(`Client disconnected: ${clientId}`);
});

server.on(NetworkTablesServerEvent.TopicPublished, (topic) => {
  console.log(`Topic published: ${topic.name} (${topic.type})`);
});

server.on(NetworkTablesServerEvent.TopicUnpublished, (topic) => {
  console.log(`Topic unpublished: ${topic.name}`);
});

server.on(NetworkTablesServerEvent.ValueChanged, (topicName, value) => {
  console.log(`Value changed for ${topicName}: ${JSON.stringify(value.value)}`);
});

// Start the server
server.start();

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping server...');
  server.stop();
  process.exit(0);
});
