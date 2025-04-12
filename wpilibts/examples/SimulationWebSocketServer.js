/**
 * Standalone WebSocket server for the simulation example.
 *
 * This script starts two WebSocket servers:
 * - NetworkTables WebSocket server on port 8082
 * - HALSim WebSocket server on port 8083
 */

const WebSocket = require('ws');

// Create the NetworkTables WebSocket server
const ntServer = new WebSocket.Server({ port: 8082 });
console.log('NetworkTables WebSocket server started on port 8082');

// Create the HALSim WebSocket server
const halSimServer = new WebSocket.Server({ port: 8083 });
console.log('HALSim WebSocket server started on port 8083');

// Track connected clients
let ntClientCount = 0;
let halSimClientCount = 0;

// Store the current state
const robotState = {
  leftMotor: 0,
  rightMotor: 0,
  encoder: 0,
  limitSwitch: false,
  potentiometer: 0,
  enabled: false,
  mode: 'Disabled'
};

// Store the device states
const deviceStates = {
  digitalInputs: {
    0: { value: false }
  },
  analogInputs: {
    0: { voltage: 0 }
  },
  pwms: {
    0: { speed: 0, position: 0 },
    1: { speed: 0, position: 0 }
  },
  encoders: {
    0: { count: 0, period: 0, direction: false }
  }
};

// Handle NetworkTables WebSocket connections
ntServer.on('connection', (ws) => {
  ntClientCount++;
  console.log(`Client connected to NetworkTables WebSocket server (${ntClientCount} clients connected)`);

  // Send the list of available topics
  const topics = [
    'Robot/LeftMotor',
    'Robot/RightMotor',
    'Robot/Encoder',
    'Robot/LimitSwitch',
    'Robot/Potentiometer',
    'Robot/Enabled',
    'Robot/Mode'
  ];

  const message = {
    type: 'topicsList',
    topics
  };

  ws.send(JSON.stringify(message));

  // Send the current state of all topics
  sendNTValueChanged(ws, 'Robot/LeftMotor', robotState.leftMotor);
  sendNTValueChanged(ws, 'Robot/RightMotor', robotState.rightMotor);
  sendNTValueChanged(ws, 'Robot/Encoder', robotState.encoder);
  sendNTValueChanged(ws, 'Robot/LimitSwitch', robotState.limitSwitch);
  sendNTValueChanged(ws, 'Robot/Potentiometer', robotState.potentiometer);
  sendNTValueChanged(ws, 'Robot/Enabled', robotState.enabled);
  sendNTValueChanged(ws, 'Robot/Mode', robotState.mode);

  // Handle messages from the client
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message from NetworkTables client:', message);

      // Echo the message back to the client
      ws.send(data);

      // If it's a setValue message, update the state and broadcast it to all clients
      if (message.type === 'setValue') {
        // Update the state
        const key = message.key;
        const value = message.value;

        switch (key) {
          case 'Robot/LeftMotor':
            robotState.leftMotor = value;
            // Also update the corresponding HALSim device
            deviceStates.pwms[0].speed = value;
            broadcastHALSimDeviceValueChanged('pwm', 0, 'speed', value);
            break;
          case 'Robot/RightMotor':
            robotState.rightMotor = value;
            // Also update the corresponding HALSim device
            deviceStates.pwms[1].speed = value;
            broadcastHALSimDeviceValueChanged('pwm', 1, 'speed', value);
            break;
          case 'Robot/Enabled':
            robotState.enabled = value;
            break;
          case 'Robot/Mode':
            robotState.mode = value;
            break;
          default:
            // No state update for unknown keys
            break;
        }

        // Broadcast to all clients
        broadcastNTValueChanged(key, value);
      }
    } catch (error) {
      console.error('Error handling NetworkTables WebSocket message:', error);
    }
  });

  // Handle close
  ws.on('close', () => {
    ntClientCount--;
    console.log(`Client disconnected from NetworkTables WebSocket server (${ntClientCount} clients connected)`);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('NetworkTables WebSocket client error:', error);
  });
});

// Handle HALSim WebSocket connections
halSimServer.on('connection', (ws) => {
  halSimClientCount++;
  console.log(`Client connected to HALSim WebSocket server (${halSimClientCount} clients connected)`);

  // Send the list of available devices
  const devices = [
    {
      type: 'digitalInput',
      index: 0,
      properties: ['value']
    },
    {
      type: 'analogInput',
      index: 0,
      properties: ['voltage']
    },
    {
      type: 'pwm',
      index: 0,
      properties: ['speed', 'position']
    },
    {
      type: 'pwm',
      index: 1,
      properties: ['speed', 'position']
    },
    {
      type: 'encoder',
      index: 0,
      properties: ['count', 'period', 'direction']
    }
  ];

  const message = {
    type: 'devicesList',
    devices
  };

  ws.send(JSON.stringify(message));

  // Send the current state of all devices
  sendHALSimDeviceValueChanged(ws, 'digitalInput', 0, 'value', deviceStates.digitalInputs[0].value);
  sendHALSimDeviceValueChanged(ws, 'analogInput', 0, 'voltage', deviceStates.analogInputs[0].voltage);
  sendHALSimDeviceValueChanged(ws, 'pwm', 0, 'speed', deviceStates.pwms[0].speed);
  sendHALSimDeviceValueChanged(ws, 'pwm', 1, 'speed', deviceStates.pwms[1].speed);
  sendHALSimDeviceValueChanged(ws, 'encoder', 0, 'count', deviceStates.encoders[0].count);

  // Handle messages from the client
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message from HALSim client:', message);

      // Echo the message back to the client
      ws.send(data);

      // If it's a setDeviceValue message, update the state and broadcast it to all clients
      if (message.type === 'setDeviceValue') {
        // Update the state
        const deviceType = message.deviceType;
        const deviceIndex = message.deviceIndex;
        const property = message.property;
        const value = message.value;

        switch (deviceType) {
          case 'digitalInput':
            if (deviceIndex === 0 && property === 'value') {
              deviceStates.digitalInputs[0].value = Boolean(value);
              // Also update the corresponding NetworkTables topic
              robotState.limitSwitch = Boolean(value);
              broadcastNTValueChanged('Robot/LimitSwitch', Boolean(value));
            }
            break;
          case 'analogInput':
            if (deviceIndex === 0 && property === 'voltage') {
              deviceStates.analogInputs[0].voltage = Number(value);
              // Also update the corresponding NetworkTables topic
              robotState.potentiometer = Number(value);
              broadcastNTValueChanged('Robot/Potentiometer', Number(value));
            }
            break;
          case 'pwm':
            if (deviceIndex === 0 && property === 'speed') {
              deviceStates.pwms[0].speed = Number(value);
              // Also update the corresponding NetworkTables topic
              robotState.leftMotor = Number(value);
              broadcastNTValueChanged('Robot/LeftMotor', Number(value));
            } else if (deviceIndex === 1 && property === 'speed') {
              deviceStates.pwms[1].speed = Number(value);
              // Also update the corresponding NetworkTables topic
              robotState.rightMotor = Number(value);
              broadcastNTValueChanged('Robot/RightMotor', Number(value));
            }
            break;
          case 'encoder':
            if (deviceIndex === 0 && property === 'count') {
              deviceStates.encoders[0].count = Number(value);
              // Also update the corresponding NetworkTables topic
              robotState.encoder = Number(value);
              broadcastNTValueChanged('Robot/Encoder', Number(value));
            }
            break;
          default:
            // No state update for unknown device types
            break;
        }

        // Broadcast to all clients
        broadcastHALSimDeviceValueChanged(deviceType, deviceIndex, property, value);
      }
    } catch (error) {
      console.error('Error handling HALSim WebSocket message:', error);
    }
  });

  // Handle close
  ws.on('close', () => {
    halSimClientCount--;
    console.log(`Client disconnected from HALSim WebSocket server (${halSimClientCount} clients connected)`);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('HALSim WebSocket client error:', error);
  });
});

// Handle NetworkTables WebSocket server errors
ntServer.on('error', (error) => {
  console.error('NetworkTables WebSocket server error:', error);
});

// Handle HALSim WebSocket server errors
halSimServer.on('error', (error) => {
  console.error('HALSim WebSocket server error:', error);
});

/**
 * Send a NetworkTables valueChanged message to a client.
 *
 * @param {WebSocket} ws The WebSocket connection.
 * @param {string} key The topic key.
 * @param {any} value The topic value.
 */
function sendNTValueChanged(ws, key, value) {
  const message = {
    type: 'valueChanged',
    key,
    value
  };

  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Broadcast a NetworkTables valueChanged message to all clients.
 *
 * @param {string} key The topic key.
 * @param {any} value The topic value.
 */
function broadcastNTValueChanged(key, value) {
  ntServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      sendNTValueChanged(client, key, value);
    }
  });
}

/**
 * Send a HALSim deviceValueChanged message to a client.
 *
 * @param {WebSocket} ws The WebSocket connection.
 * @param {string} deviceType The device type.
 * @param {number} deviceIndex The device index.
 * @param {string} property The device property.
 * @param {any} value The device value.
 */
function sendHALSimDeviceValueChanged(ws, deviceType, deviceIndex, property, value) {
  const message = {
    type: 'deviceValueChanged',
    deviceType,
    deviceIndex,
    property,
    value
  };

  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Broadcast a HALSim deviceValueChanged message to all clients.
 *
 * @param {string} deviceType The device type.
 * @param {number} deviceIndex The device index.
 * @param {string} property The device property.
 * @param {any} value The device value.
 */
function broadcastHALSimDeviceValueChanged(deviceType, deviceIndex, property, value) {
  halSimServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      sendHALSimDeviceValueChanged(client, deviceType, deviceIndex, property, value);
    }
  });
}

// Simulate robot behavior
setInterval(() => {
  // Only simulate if the robot is enabled
  if (robotState.enabled) {
    // Update encoder count based on motor speeds
    const averageSpeed = (robotState.leftMotor + robotState.rightMotor) / 2;
    robotState.encoder += Math.round(averageSpeed * 5);
    deviceStates.encoders[0].count = robotState.encoder;

    // Update limit switch based on encoder count
    robotState.limitSwitch = robotState.encoder > 1000;
    deviceStates.digitalInputs[0].value = robotState.limitSwitch;

    // Update potentiometer based on encoder count (0-5V range)
    robotState.potentiometer = Math.min(5, Math.max(0, robotState.encoder / 200));
    deviceStates.analogInputs[0].voltage = robotState.potentiometer;

    // Broadcast the updated values
    broadcastNTValueChanged('Robot/Encoder', robotState.encoder);
    broadcastNTValueChanged('Robot/LimitSwitch', robotState.limitSwitch);
    broadcastNTValueChanged('Robot/Potentiometer', robotState.potentiometer);

    broadcastHALSimDeviceValueChanged('encoder', 0, 'count', robotState.encoder);
    broadcastHALSimDeviceValueChanged('digitalInput', 0, 'value', robotState.limitSwitch);
    broadcastHALSimDeviceValueChanged('analogInput', 0, 'voltage', robotState.potentiometer);
  }
}, 100); // Update every 100ms

// Keep the script running
console.log('WebSocket servers are running. Press Ctrl+C to stop.');

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping WebSocket servers...');

  ntServer.close(() => {
    console.log('NetworkTables WebSocket server stopped');
  });

  halSimServer.close(() => {
    console.log('HALSim WebSocket server stopped');
  });

  process.exit(0);
});
