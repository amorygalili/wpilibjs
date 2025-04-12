const WebSocket = require('ws');

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 5820 });

console.log('Server started on port 5820');

// Handle connections
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Handle messages
  ws.on('message', (message) => {
    console.log(`Received: ${message}`);
    
    // Echo the message back
    ws.send(`Echo: ${message}`);
  });
  
  // Handle disconnections
  ws.on('close', () => {
    console.log('Client disconnected');
  });
  
  // Send a welcome message
  ws.send('Welcome to the server!');
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping server...');
  wss.close();
  process.exit(0);
});
