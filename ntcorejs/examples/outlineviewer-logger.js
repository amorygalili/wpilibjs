/**
 * NetworkTables Message Logger for OutlineViewer
 *
 * This is a minimal server that logs all messages from OutlineViewer
 * to help understand the protocol.
 */

const WebSocket = require('ws');
const fs = require('fs');

// Try to load MessagePack if available
let msgpack;
try {
  msgpack = require('@msgpack/msgpack');
  console.log('MessagePack library loaded');
} catch (error) {
  console.log('MessagePack library not available, install with: npm install @msgpack/msgpack');
}

// Create a WebSocket server
const wss = new WebSocket.Server({
  port: 5810,
  // Support both NT 4.0 and 4.1 protocols
  handleProtocols: (protocols, request) => {
    console.log('Client requested protocols:', protocols);

    // Convert Set to Array if needed
    const protocolArray = Array.isArray(protocols) ? protocols : Array.from(protocols);

    // Check if client supports NT 4.1
    if (protocolArray.indexOf('v4.1.networktables.first.wpi.edu') !== -1) {
      console.log('Using NT 4.1 protocol');
      return 'v4.1.networktables.first.wpi.edu';
    }

    // Fall back to NT 4.0
    if (protocolArray.indexOf('networktables.first.wpi.edu') !== -1) {
      console.log('Using NT 4.0 protocol');
      return 'networktables.first.wpi.edu';
    }

    // No supported protocol
    console.log('No supported protocol found');
    return false;
  }
});

// Create a log file
const logStream = fs.createWriteStream('outlineviewer-messages.log', { flags: 'a' });

// Log function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  console.log(message);
  logStream.write(logMessage);
}

// Handle connections
wss.on('connection', (ws, request) => {
  log(`Client connected: ${request.socket.remoteAddress}`);
  log(`Protocol: ${ws.protocol}`);

  // Handle messages
  ws.on('message', (data) => {
    try {
      if (data instanceof Buffer) {
        log(`Binary message received, length: ${data.length}`);
        log(`First 32 bytes: ${Array.from(data.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);

        // Try to decode as MessagePack if available
        if (msgpack) {
          try {
            const decoded = msgpack.decode(data);
            log(`Decoded MessagePack: ${JSON.stringify(decoded)}`);
          } catch (mpError) {
            log(`Failed to decode MessagePack: ${mpError}`);
          }
        }

        // Try to parse as JSON
        try {
          const jsonString = data.toString('utf8');
          log(`As UTF-8: ${jsonString}`);

          try {
            const jsonData = JSON.parse(jsonString);
            log(`Parsed JSON: ${JSON.stringify(jsonData)}`);
          } catch (jsonError) {
            // Not valid JSON
          }
        } catch (error) {
          log(`Not valid UTF-8`);
        }
      } else if (typeof data === 'string') {
        log(`Text message received: ${data}`);

        try {
          const jsonData = JSON.parse(data);
          log(`Parsed JSON: ${JSON.stringify(jsonData)}`);
        } catch (jsonError) {
          // Not valid JSON
        }
      }
    } catch (error) {
      log(`Error processing message: ${error}`);
    }
  });

  // Handle close
  ws.on('close', () => {
    log('Client disconnected');
  });

  // Handle errors
  ws.on('error', (error) => {
    log(`WebSocket error: ${error}`);
  });

  // Send a simple announce message
  try {
    // Create announce message
    const announceData = [{
      method: 'announce',
      params: {
        name: '/test/hello',
        id: 1,
        type: 'string',
        properties: {
          persistent: true,
          retained: true,
          'rawType': 'string',
          'typeString': 'string',
          '.type': 'string',
          'source': 'ntcorejs'
        },
        pubuid: 1
      }
    }];

    // Send as JSON
    const announceMessage = JSON.stringify(announceData);
    log(`Sending JSON announce message: ${announceMessage}`);
    ws.send(announceMessage);

    // Send as MessagePack if available
    if (msgpack) {
      try {
        const encodedAnnounce = msgpack.encode(announceData);
        log(`Sending MessagePack announce message, length: ${encodedAnnounce.length}`);
        ws.send(encodedAnnounce);
      } catch (mpError) {
        log(`Failed to encode MessagePack announce: ${mpError}`);
      }
    }

    // Create value message
    const valueData = {
      id: 1,
      timestamp: Date.now() * 1000,
      type: 4, // String type
      value: 'Hello from ntcorejs!'
    };

    // Send as JSON
    const valueMessage = JSON.stringify(valueData);
    log(`Sending JSON value message: ${valueMessage}`);
    ws.send(valueMessage);

    // Send as MessagePack if available
    if (msgpack) {
      try {
        const encodedValue = msgpack.encode(valueData);
        log(`Sending MessagePack value message, length: ${encodedValue.length}`);
        ws.send(encodedValue);
      } catch (mpError) {
        log(`Failed to encode MessagePack value: ${mpError}`);
      }
    }

    // Create more test topics
    createTestTopics(ws);
  } catch (error) {
    log(`Error sending message: ${error}`);
  }
});

// Create test topics
function createTestTopics(ws) {
  // Define test topics
  const topics = [
    { name: '/test/boolean', type: 'boolean', typeId: 0, value: true },
    { name: '/test/number', type: 'double', typeId: 1, value: 3.14159 },
    { name: '/test/string', type: 'string', typeId: 4, value: 'Hello from ntcorejs!' },
    { name: '/test/boolean_array', type: 'boolean[]', typeId: 16, value: [true, false, true] },
    { name: '/test/number_array', type: 'double[]', typeId: 17, value: [1.1, 2.2, 3.3, 4.4] },
    { name: '/test/string_array', type: 'string[]', typeId: 20, value: ['one', 'two', 'three'] }
  ];

  // Create and send topics
  topics.forEach((topic, index) => {
    const id = index + 2; // Start from ID 2 (ID 1 is already used)

    try {
      // Create announce message
      const announceData = [{
        method: 'announce',
        params: {
          name: topic.name,
          id,
          type: topic.type,
          properties: {
            persistent: true,
            retained: true,
            'rawType': topic.type,
            'typeString': topic.type,
            '.type': topic.type,
            'source': 'ntcorejs'
          },
          pubuid: id
        }
      }];

      // Send as JSON
      const announceMessage = JSON.stringify(announceData);
      log(`Sending JSON announce message for ${topic.name}: ${announceMessage}`);
      ws.send(announceMessage);

      // Send as MessagePack if available
      if (msgpack) {
        try {
          const encodedAnnounce = msgpack.encode(announceData);
          log(`Sending MessagePack announce message for ${topic.name}, length: ${encodedAnnounce.length}`);
          ws.send(encodedAnnounce);
        } catch (mpError) {
          log(`Failed to encode MessagePack announce for ${topic.name}: ${mpError}`);
        }
      }

      // Create value message
      const valueData = {
        id,
        timestamp: Date.now() * 1000,
        type: topic.typeId,
        value: topic.value
      };

      // Send as JSON
      const valueMessage = JSON.stringify(valueData);
      log(`Sending JSON value message for ${topic.name}: ${valueMessage}`);
      ws.send(valueMessage);

      // Send as MessagePack if available
      if (msgpack) {
        try {
          const encodedValue = msgpack.encode(valueData);
          log(`Sending MessagePack value message for ${topic.name}, length: ${encodedValue.length}`);
          ws.send(encodedValue);
        } catch (mpError) {
          log(`Failed to encode MessagePack value for ${topic.name}: ${mpError}`);
        }
      }
    } catch (error) {
      log(`Error sending message for ${topic.name}: ${error}`);
    }
  });
}

log('Server started on port 5810');
log('Connect OutlineViewer to localhost:5810');
