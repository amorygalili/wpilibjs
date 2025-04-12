/**
 * Script to run the OutlineViewerRobot with a custom port and launch OutlineViewer.
 * 
 * This script:
 * 1. Runs the OutlineViewerRobot with a custom port
 * 2. Launches OutlineViewer
 * 
 * Usage: node run-outlineviewer-test-robot.js
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

// Path to WPILib installation
const wpilibPath = 'C:\\Users\\Public\\wpilib\\2024';

// Path to OutlineViewer
const outlineViewerPath = path.join(wpilibPath, 'tools', 'outlineviewer.exe');

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
    launchOutlineViewer();
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

// Launch OutlineViewer
function launchOutlineViewer() {
  console.log('Launching OutlineViewer...');
  console.log('Please configure OutlineViewer with the following settings:');
  console.log('- Server Mode: Client');
  console.log('- Team Number/Server: localhost');
  console.log(`- Port: ${port}`);
  
  const outlineViewer = spawn(outlineViewerPath, [], {
    stdio: 'inherit',
    shell: true,
    detached: true
  });
  
  outlineViewer.on('error', (error) => {
    console.error(`Error launching OutlineViewer: ${error.message}`);
  });
  
  console.log('OutlineViewer launched. You should see test data in the OutlineViewer window.');
  console.log('Press Ctrl+C to stop the robot.');
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
