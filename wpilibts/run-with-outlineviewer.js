/**
 * Script to run a robot with OutlineViewer.
 *
 * This script:
 * 1. Starts the NetworkTables server
 * 2. Launches OutlineViewer
 * 3. Runs the specified robot class
 *
 * Usage: node run-with-outlineviewer.js [robot-class-path]
 *
 * If no robot class path is provided, it will run the OutlineViewerTest example.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

// Get the robot class path from command line arguments
const robotClassPath = process.argv[2] || 'OutlineViewerTest';

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
      console.log(`Port ${port} is already in use. Assuming NetworkTables server is running.`);
      launchOutlineViewer();
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
  console.log('Starting NetworkTables server...');
  
  const ntServer = spawn('node', [path.join(__dirname, 'examples', 'NT4Server.js')], {
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
  
  const outlineViewer = spawn(outlineViewerPath, [], {
    stdio: 'inherit',
    shell: true,
    detached: true
  });
  
  outlineViewer.on('error', (error) => {
    console.error(`Error launching OutlineViewer: ${error.message}`);
    runRobot();
  });
  
  // Wait for OutlineViewer to start
  setTimeout(() => {
    runRobot();
  }, 3000);
}

// Run the robot
function runRobot() {
  console.log(`Starting robot with class: ${robotClassPath}...`);
  
  const robot = spawn('node', [path.join(__dirname, 'run-with-external-nt.js'), robotClassPath], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NT_SERVER_URL: `ws://localhost:${port}`
    }
  });
  
  robot.on('error', (error) => {
    console.error(`Error starting robot: ${error.message}`);
    process.exit(1);
  });
  
  robot.on('exit', (code) => {
    process.exit(code);
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
