import { NetworkTableInstance } from '../src/index.js';

/**
 * This example focuses solely on establishing a connection to a NetworkTables server.
 * It tries multiple server addresses and ports to help diagnose connection issues.
 */

// Get the default NetworkTables instance
const inst = NetworkTableInstance.getDefault();

// Define possible server addresses and ports to try
const serverConfigs = [
  { address: 'localhost', port: 5810, description: 'Default NT4 port' },
  { address: '127.0.0.1', port: 5810, description: 'Default NT4 port with explicit IP' },
  { address: 'localhost', port: 1735, description: 'Default NT3 port' },
  { address: '127.0.0.1', port: 1735, description: 'Default NT3 port with explicit IP' },
  // Add more configurations if needed
];

// Try each server configuration
let currentConfigIndex = 0;
let connected = false;

function tryNextConfig() {
  if (currentConfigIndex >= serverConfigs.length) {
    console.log('Tried all server configurations without success.');
    console.log('Please make sure OutlineViewer is running as a server.');
    console.log('Restarting connection attempts...');
    currentConfigIndex = 0;
  }

  const config = serverConfigs[currentConfigIndex];
  console.log(`\nAttempting connection to ${config.address}:${config.port} (${config.description})...`);

  // Stop any existing client connection
  inst.stopClient();

  // Start a new client connection
  inst.startClient4('NT4-Connection-Test', config.address, config.port);

  // Increment for next attempt
  currentConfigIndex++;
}

// Check connection status periodically
const connectionCheck = setInterval(() => {
  if (inst.isConnected()) {
    if (!connected) {
      connected = true;
      const config = serverConfigs[currentConfigIndex - 1];
      console.log(`\n✅ CONNECTED to ${config.address}:${config.port}!`);
      console.log('Connection successful! This configuration works.');

      // Get network stats
      const serverTime = inst.getServerTime();
      const latency = inst.getNetworkLatency();
      console.log(`Server time: ${serverTime !== null ? serverTime : 'unknown'}, Latency: ${latency}μs`);

      // Create and set a test value
      const table = inst.getTable('ConnectionTest');
      const testEntry = table.getEntry('TestValue');
      testEntry.setString(`Connected at ${new Date().toISOString()}`);
      console.log('Test value published to NetworkTables.');
    }
  } else {
    if (connected) {
      connected = false;
      console.log('❌ Connection lost!');
    }

    // Try the next configuration after 2 seconds of no connection
    tryNextConfig();
  }
}, 2000);

// Start the first connection attempt
tryNextConfig();

// Handle process termination
process.on('SIGINT', () => {
  console.log('Disconnecting from NetworkTables server...');
  clearInterval(connectionCheck);
  inst.stopClient();
  process.exit(0);
});
