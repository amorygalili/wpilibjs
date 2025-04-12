/**
 * Minimal simulation server.
 * 
 * This script starts a WebSocket server that can communicate with the MinimalSimulationUI.html.
 */

const WebSocket = require('ws');

// Create the WebSocket server
const server = new WebSocket.Server({ port: 8085 });
console.log('WebSocket server started on port 8085');

// Robot state
const robotState = {
  enabled: false,
  autonomous: false,
  test: false,
  time: 0
};

// Connected clients
const clients = new Set();

// Handle WebSocket connections
server.on('connection', (ws) => {
  console.log('Client connected');
  clients.add(ws);

  // Send the current robot state
  sendRobotState(ws);

  // Handle messages from the client
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(message);
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Handle messages from clients
function handleMessage(message) {
  if (message.type === 'control_word') {
    robotState.enabled = message.data.enabled;
    robotState.autonomous = message.data.autonomous;
    robotState.test = message.data.test;

    console.log(`Robot state changed: enabled=${robotState.enabled}, autonomous=${robotState.autonomous}, test=${robotState.test}`);

    // Broadcast the updated robot state to all clients
    broadcastRobotState();
  }
}

// Send the robot state to a client
function sendRobotState(ws) {
  const message = {
    type: 'robot_state',
    data: {
      enabled: robotState.enabled,
      autonomous: robotState.autonomous,
      test: robotState.test,
      time: robotState.time
    }
  };

  ws.send(JSON.stringify(message));
}

// Broadcast the robot state to all clients
function broadcastRobotState() {
  const message = {
    type: 'robot_state',
    data: {
      enabled: robotState.enabled,
      autonomous: robotState.autonomous,
      test: robotState.test,
      time: robotState.time
    }
  };

  const messageStr = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Update the robot time
setInterval(() => {
  robotState.time += 0.02;
  broadcastRobotState();
}, 20);

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping WebSocket server...');
  
  server.close(() => {
    console.log('WebSocket server stopped');
    process.exit(0);
  });
});
