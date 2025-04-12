/**
 * Script to run a robot with external NetworkTables clients.
 *
 * This script:
 * 1. Builds the project if needed
 * 2. Runs the specified robot class with NetworkTables bridge
 * 3. Connects to external NetworkTables clients like Shuffleboard and OutlineViewer
 *
 * Usage: node run-with-external-nt.js [robot-class-path] [nt-server-url]
 *
 * If no robot class path is provided, it will run the NT4BridgeRobot example.
 * If no NT server URL is provided, it will use ws://localhost:5810.
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');

// Get the robot class path and NT server URL from command line arguments
let robotClassPath = process.argv[2] || 'NT4BridgeRobot';
const ntServerUrl = process.argv[3] || 'ws://localhost:5810';

// Extract just the example name if a path is provided
if (robotClassPath.includes('/') || robotClassPath.includes('\\')) {
  // Get the filename without extension
  robotClassPath = path.basename(robotClassPath, path.extname(robotClassPath));
} else if (robotClassPath.endsWith('.ts')) {
  // Remove .ts extension if present
  robotClassPath = robotClassPath.substring(0, robotClassPath.length - 3);
}

// Extract port from NT server URL
const portMatch = ntServerUrl.match(/:(\d+)/);
const ntPort = portMatch ? parseInt(portMatch[1]) : 5810;

// Check if the dist directory exists
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
  console.log('Building project...');
  const build = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    shell: true
  });

  build.on('close', code => {
    if (code === 0) {
      checkPortAndRun();
    } else {
      console.error('Build failed with code', code);
      process.exit(code);
    }
  });
} else {
  checkPortAndRun();
}

// Check if the specified port is already in use
function checkPortAndRun() {
  console.log(`Checking if port ${ntPort} is in use...`);

  const tester = net.createServer()
    .once('error', err => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${ntPort} is already in use. Assuming NetworkTables server is running.`);
        runRobot();
      } else {
        console.error('Error checking port:', err);
        runRobot();
      }
    })
    .once('listening', () => {
      tester.close(() => {
        console.log(`Port ${ntPort} is available. You'll need to start a NetworkTables server separately.`);
        console.log(`You can use Shuffleboard or OutlineViewer as a NetworkTables server.`);
        runRobot();
      });
    })
    .listen(ntPort);
}

function runRobot() {
  console.log(`Starting robot with class: ${robotClassPath}...`);
  console.log(`Using NetworkTables server: ${ntServerUrl}`);

  // Set environment variables for the robot
  const env = {
    ...process.env,
    NT_SERVER_URL: ntServerUrl,
    DISABLE_DS_SERVER: 'true' // Disable the driver station server to avoid port conflicts
  };

  // Run the robot using ts-node
  const tsNode = spawn('node', [path.join(__dirname, 'run-example.js'), robotClassPath], {
    stdio: 'inherit',
    shell: true,
    env
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
