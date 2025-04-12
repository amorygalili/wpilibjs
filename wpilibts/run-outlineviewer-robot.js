/**
 * Script to run a robot with OutlineViewer.
 *
 * This script:
 * 1. Checks if OutlineViewer is running
 * 2. Runs the specified robot class
 *
 * Usage: node run-outlineviewer-robot.clean.js [robot-class-path]
 *
 * If no robot class path is provided, it will run the OutlineViewerRobot example.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

// Get the robot class path from command line arguments
let robotClassPath = process.argv[2] || 'OutlineViewerRobot';

// Check if the port is already in use (OutlineViewer should be running)
const port = 5810;

console.log(`Checking if port ${port} is in use (OutlineViewer should be running)...`);

const tester = net.createServer()
  .once('error', err => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use. Assuming OutlineViewer is running.`);
      runRobot();
    } else {
      console.error('Error checking port:', err);
      console.log('Please start OutlineViewer and configure it as a server on port 5810.');
      process.exit(1);
    }
  })
  .once('listening', () => {
    tester.close(() => {
      console.log(`Port ${port} is not in use. Please start OutlineViewer and configure it as a server on port 5810.`);
      process.exit(1);
    });
  })
  .listen(port);

function runRobot() {
  console.log(`Starting robot with class: ${robotClassPath}...`);

  // Run the robot using ts-node
  const tsNode = spawn('npx', ['ts-node', `examples/${robotClassPath}.ts`], {
    stdio: 'inherit',
    shell: true
  });

  tsNode.on('close', code => {
    process.exit(code);
  });
}

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Stopping robot...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Stopping robot...');
  process.exit(0);
});
