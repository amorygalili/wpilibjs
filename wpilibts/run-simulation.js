/**
 * Script to run a robot in simulation.
 *
 * This script:
 * 1. Builds the project if needed
 * 2. Runs the specified robot class in simulation
 * 3. Opens the SimulationUI.html in the default browser
 *
 * Usage: node run-simulation.js [robot-class-path]
 *
 * If no robot class path is provided, it will run the SimulationExample.
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');

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

// Check if port 1735 is already in use (NetworkTables)
function checkPortAndRun() {
  const tester = net.createServer()
    .once('error', err => {
      if (err.code === 'EADDRINUSE') {
        console.log('NetworkTables server is already running on port 1735.');
        console.log('Opening Simulation UI in browser...');
        openBrowser();
      } else {
        console.error('Error checking port:', err);
        runExample();
      }
    })
    .once('listening', () => {
      tester.close(() => {
        runExample();
      });
    })
    .listen(1735);
}

function openBrowser() {
  // Open the SimulationUI.html in the default browser
  const clientPath = path.join(__dirname, 'examples', 'SimulationUI.html');
  const clientUrl = `file://${clientPath}`;

  // Open the URL in the default browser based on the platform
  switch (os.platform()) {
    case 'win32':
      exec(`start "" "${clientUrl}"`);
      break;
    case 'darwin':
      exec(`open "${clientUrl}"`);
      break;
    default:
      exec(`xdg-open "${clientUrl}"`);
      break;
  }
}

function runExample() {
  // Get the robot class path from command line arguments
  const robotClassPath = process.argv[2] || 'SimulationExample';

  console.log(`Starting simulation with robot class: ${robotClassPath}...`);

  // Run the example using ts-node
  const tsNode = spawn('node', ['run-example.js', robotClassPath], {
    stdio: 'inherit',
    shell: true
  });

  // Wait a moment for the server to start
  setTimeout(() => {
    console.log('Opening Simulation UI in browser...');
    openBrowser();
  }, 2000);

  tsNode.on('close', code => {
    process.exit(code);
  });
}
