/**
 * Script to run the OutlineViewerRobot and open our NetworkTablesViewer.
 * 
 * This script:
 * 1. Runs the OutlineViewerRobot
 * 2. Opens our NetworkTablesViewer in the default browser
 * 
 * Usage: node run-with-web-viewer.js
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');
const { exec } = require('child_process');

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
      startRobot();
    }
  })
  .once('listening', () => {
    tester.close(() => {
      console.log(`Port ${port} is available. Starting robot...`);
      startRobot();
    });
  })
  .listen(port);

// Start the robot
function startRobot() {
  console.log('Starting OutlineViewerRobot...');
  
  // Set environment variables
  const env = {
    ...process.env,
    NT_SERVER_PORT: port.toString(),
    DISABLE_DS_SERVER: 'true' // Disable the driver station server to avoid port conflicts
  };
  
  // Run the robot
  const robot = spawn('npx', ['ts-node', path.join(__dirname, 'examples', 'OutlineViewerRobot.ts')], {
    stdio: 'inherit',
    shell: true,
    env
  });
  
  robot.on('error', (error) => {
    console.error(`Error starting OutlineViewerRobot: ${error.message}`);
    process.exit(1);
  });
  
  // Wait for the robot to start
  setTimeout(() => {
    openNetworkTablesViewer();
  }, 3000);
  
  // Handle termination signals
  process.on('SIGINT', () => {
    console.log('Stopping robot...');
    robot.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('Stopping robot...');
    robot.kill('SIGTERM');
  });
}

// Open NetworkTablesViewer in the default browser
function openNetworkTablesViewer() {
  console.log('Opening NetworkTablesViewer in the default browser...');
  
  const viewerPath = path.join(__dirname, 'examples', 'NetworkTablesViewer.html');
  const viewerUrl = `file://${viewerPath}`;
  
  // Open in the default browser
  let command;
  if (process.platform === 'win32') {
    command = `start "" "${viewerUrl}"`;
  } else if (process.platform === 'darwin') {
    command = `open "${viewerUrl}"`;
  } else {
    command = `xdg-open "${viewerUrl}"`;
  }
  
  exec(command, (error) => {
    if (error) {
      console.error(`Error opening NetworkTablesViewer: ${error.message}`);
    } else {
      console.log('NetworkTablesViewer opened in the default browser.');
      console.log('You should see test data in the NetworkTablesViewer window.');
      console.log('Press Ctrl+C to stop the robot.');
    }
  });
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
