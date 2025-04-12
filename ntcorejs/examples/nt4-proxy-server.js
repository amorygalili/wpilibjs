/**
 * NetworkTables 4.1 Proxy Server
 * 
 * This proxy server sits between OutlineViewer and a real NetworkTables server,
 * logging all messages that are sent between the two.
 */

const WebSocket = require('ws');
const msgpack = require('@msgpack/msgpack');
const fs = require('fs');

// Create a log file
const logStream = fs.createWriteStream('nt4-proxy-server.log', { flags: 'a' });

// Log function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  console.log(message);
  logStream.write(logMessage);
}

// Configuration
const proxyPort = 5810;
const targetHost = 'localhost';
const targetPort = 5820; // The real NetworkTables server should be running on this port

// Create a WebSocket server
const wss = new WebSocket.Server({
  port: proxyPort,
  // Support both NT 4.0 and 4.1 protocols
  handleProtocols: (protocols, request) => {
    log('Client requested protocols: ' + JSON.stringify(Array.from(protocols)));
    
    // Convert Set to Array if needed
    const protocolArray = Array.isArray(protocols) ? protocols : Array.from(protocols);
    
    // Check if client supports NT 4.1
    if (protocolArray.indexOf('v4.1.networktables.first.wpi.edu') !== -1) {
      log('Using NT 4.1 protocol');
      return 'v4.1.networktables.first.wpi.edu';
    }
    
    // Fall back to NT 4.0
    if (protocolArray.indexOf('networktables.first.wpi.edu') !== -1) {
      log('Using NT 4.0 protocol');
      return 'networktables.first.wpi.edu';
    }
    
    // No supported protocol
    log('No supported protocol found');
    return false;
  }
});

// Handle connections
wss.on('connection', (clientWs, request) => {
  log(`Client connected from ${request.socket.remoteAddress}`);
  log(`Protocol: ${clientWs.protocol}`);
  
  // Connect to the target server
  const targetWs = new WebSocket(`ws://${targetHost}:${targetPort}`, [clientWs.protocol]);
  
  // Handle target connection
  targetWs.on('open', () => {
    log(`Connected to target server at ${targetHost}:${targetPort}`);
    log(`Protocol: ${targetWs.protocol}`);
    
    // Handle messages from client to target
    clientWs.on('message', (data) => {
      try {
        if (data instanceof Buffer) {
          log(`Client -> Target: Binary message, length: ${data.length}`);
          log(`First 32 bytes: ${Array.from(data.slice(0, Math.min(32, data.length))).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
          
          try {
            // Try to decode as MessagePack
            const decoded = msgpack.decode(data);
            log(`Decoded MessagePack: ${JSON.stringify(decoded)}`);
          } catch (error) {
            log(`Failed to decode MessagePack: ${error}`);
            
            // Try to parse as JSON
            try {
              const jsonString = data.toString('utf8');
              log(`As UTF-8: ${jsonString}`);
              
              try {
                const jsonData = JSON.parse(jsonString);
                log(`Parsed JSON: ${JSON.stringify(jsonData)}`);
              } catch (jsonError) {
                log(`Failed to parse JSON: ${jsonError}`);
              }
            } catch (error) {
              log(`Not valid UTF-8: ${error}`);
            }
          }
        } else if (typeof data === 'string') {
          log(`Client -> Target: Text message: ${data}`);
          
          try {
            const jsonData = JSON.parse(data);
            log(`Parsed JSON: ${JSON.stringify(jsonData)}`);
          } catch (error) {
            log(`Failed to parse JSON: ${error}`);
          }
        }
        
        // Forward the message to the target
        if (targetWs.readyState === WebSocket.OPEN) {
          targetWs.send(data);
        }
      } catch (error) {
        log(`Error processing client message: ${error}`);
      }
    });
    
    // Handle messages from target to client
    targetWs.on('message', (data) => {
      try {
        if (data instanceof Buffer) {
          log(`Target -> Client: Binary message, length: ${data.length}`);
          log(`First 32 bytes: ${Array.from(data.slice(0, Math.min(32, data.length))).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
          
          try {
            // Try to decode as MessagePack
            const decoded = msgpack.decode(data);
            log(`Decoded MessagePack: ${JSON.stringify(decoded)}`);
          } catch (error) {
            log(`Failed to decode MessagePack: ${error}`);
            
            // Try to parse as JSON
            try {
              const jsonString = data.toString('utf8');
              log(`As UTF-8: ${jsonString}`);
              
              try {
                const jsonData = JSON.parse(jsonString);
                log(`Parsed JSON: ${JSON.stringify(jsonData)}`);
              } catch (jsonError) {
                log(`Failed to parse JSON: ${jsonError}`);
              }
            } catch (error) {
              log(`Not valid UTF-8: ${error}`);
            }
          }
        } else if (typeof data === 'string') {
          log(`Target -> Client: Text message: ${data}`);
          
          try {
            const jsonData = JSON.parse(data);
            log(`Parsed JSON: ${JSON.stringify(jsonData)}`);
          } catch (error) {
            log(`Failed to parse JSON: ${error}`);
          }
        }
        
        // Forward the message to the client
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(data);
        }
      } catch (error) {
        log(`Error processing target message: ${error}`);
      }
    });
    
    // Handle client close
    clientWs.on('close', () => {
      log('Client disconnected');
      
      // Close the target connection
      if (targetWs.readyState === WebSocket.OPEN) {
        targetWs.close();
      }
    });
    
    // Handle target close
    targetWs.on('close', () => {
      log('Target disconnected');
      
      // Close the client connection
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close();
      }
    });
    
    // Handle client errors
    clientWs.on('error', (error) => {
      log(`Client WebSocket error: ${error}`);
    });
    
    // Handle target errors
    targetWs.on('error', (error) => {
      log(`Target WebSocket error: ${error}`);
    });
  });
  
  // Handle target connection errors
  targetWs.on('error', (error) => {
    log(`Error connecting to target server: ${error}`);
    
    // Close the client connection
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close();
    }
  });
});

// Start the server
log(`NetworkTables 4.1 Proxy Server started on port ${proxyPort}`);
log(`Forwarding to ${targetHost}:${targetPort}`);
log('Connect OutlineViewer to localhost:5810');
