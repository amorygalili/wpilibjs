/**
 * Test script for WebSocket servers.
 * 
 * This script tests the WebSocket servers by creating a simple server and client.
 */

const WebSocket = require('ws');

// Create a WebSocket server
const server = new WebSocket.Server({ port: 8084 });

console.log('WebSocket server started on port 8084');

// Handle connections
server.on('connection', (ws) => {
  console.log('Client connected');

  // Send a message to the client
  ws.send(JSON.stringify({ type: 'hello', message: 'Hello from server!' }));

  // Handle messages from the client
  ws.on('message', (data) => {
    console.log('Received message from client:', data.toString());

    // Echo the message back to the client
    ws.send(data);
  });

  // Handle close
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Handle errors
server.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

// Create a WebSocket client
setTimeout(() => {
  console.log('Creating WebSocket client...');
  const client = new WebSocket('ws://localhost:8084');

  client.on('open', () => {
    console.log('Client connected to server');

    // Send a message to the server
    client.send(JSON.stringify({ type: 'hello', message: 'Hello from client!' }));
  });

  client.on('message', (data) => {
    console.log('Received message from server:', data.toString());
  });

  client.on('error', (error) => {
    console.error('WebSocket client error:', error);
  });

  client.on('close', () => {
    console.log('Client disconnected from server');
  });

  // Close the client after 5 seconds
  setTimeout(() => {
    console.log('Closing client...');
    client.close();
  }, 5000);

  // Close the server after 10 seconds
  setTimeout(() => {
    console.log('Closing server...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  }, 10000);
}, 1000);
