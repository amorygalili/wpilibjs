const WebSocket = require('ws');

// Create a WebSocket client
const ws = new WebSocket('ws://localhost:5820');

// Handle connection open
ws.on('open', () => {
  console.log('Connected to server');
  
  // Send a message
  ws.send('Hello from client!');
  
  // Send a message every second
  setInterval(() => {
    ws.send(`Time: ${new Date().toISOString()}`);
  }, 1000);
});

// Handle messages
ws.on('message', (message) => {
  console.log(`Received: ${message}`);
});

// Handle errors
ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Handle disconnection
ws.on('close', () => {
  console.log('Disconnected from server');
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Disconnecting...');
  ws.terminate();
  process.exit(0);
});
