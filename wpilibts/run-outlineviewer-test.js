/**
 * Script to test OutlineViewer with our custom server.
 *
 * This script:
 * 1. Starts our OutlineViewer-compatible NetworkTables server
 * 2. Launches OutlineViewer
 *
 * Usage: node run-outlineviewer-test.js
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

// Path to OutlineViewer
const outlineViewerPath = 'C:\\Users\\Public\\wpilib\\2024\\tools\\outlineviewer.exe';

// Check if OutlineViewer exists
if (!fs.existsSync(outlineViewerPath)) {
  console.error(`OutlineViewer not found at ${outlineViewerPath}`);
  console.error('Please make sure WPILib is installed correctly.');
  process.exit(1);
}

// Check if the port is already in use
const port = 5810;
console.log(`Checking if port ${port} is in use...`);

const tester = net.createServer()
  .once('error', err => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is already in use. Please stop any running NetworkTables servers.`);
      process.exit(1);
    } else {
      console.error('Error checking port:', err);
      startNTServer();
    }
  })
  .once('listening', () => {
    tester.close(() => {
      console.log(`Port ${port} is available. Starting NetworkTables server...`);
      startNTServer();
    });
  })
  .listen(port);

// Start the NetworkTables server
function startNTServer() {
  console.log('Starting OutlineViewer-compatible NetworkTables server...');
  
  const ntServer = spawn('node', [path.join(__dirname, 'examples', 'OutlineViewerServer.js')], {
    stdio: 'inherit',
    shell: true
  });
  
  ntServer.on('error', (error) => {
    console.error(`Error starting NetworkTables server: ${error.message}`);
    process.exit(1);
  });
  
  // Wait for the server to start
  setTimeout(() => {
    launchOutlineViewer();
  }, 2000);
  
  // Handle termination signals
  process.on('SIGINT', () => {
    console.log('Stopping NetworkTables server...');
    ntServer.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('Stopping NetworkTables server...');
    ntServer.kill('SIGTERM');
  });
}

// Launch OutlineViewer
function launchOutlineViewer() {
  console.log('Launching OutlineViewer...');
  console.log('Please configure OutlineViewer with the following settings:');
  console.log('- Server Mode: Client');
  console.log('- Team Number/Server: localhost');
  console.log('- Port: 5810');
  
  const outlineViewer = spawn(outlineViewerPath, [], {
    stdio: 'inherit',
    shell: true,
    detached: true
  });
  
  outlineViewer.on('error', (error) => {
    console.error(`Error launching OutlineViewer: ${error.message}`);
    process.exit(1);
  });
  
  console.log('OutlineViewer launched. You should see test data in the OutlineViewer window.');
  console.log('Press Ctrl+C to stop the server.');
}

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Stopping all processes...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Stopping all processes...');
  process.exit(0);
});
