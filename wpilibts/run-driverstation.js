/**
 * Script to run the Driver Station example.
 *
 * This script:
 * 1. Builds the project if needed
 * 2. Runs the DriverStationExample
 * 3. Opens the DriverStationClient.html in the default browser
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

// Check if port 5810 is already in use
function checkPortAndRun() {
  const tester = net.createServer()
    .once('error', err => {
      if (err.code === 'EADDRINUSE') {
        console.log('Driver Station server is already running on port 5810.');
        console.log('Opening Driver Station client in browser...');
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
    .listen(5810);
}

function openBrowser() {
  // Open the DriverStationClient.html in the default browser
  const clientPath = path.join(__dirname, 'examples', 'DriverStationClient.html');
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
  console.log('Starting Driver Station example...');

  // Run the example using ts-node
  const tsNode = spawn('node', ['run-example.js', 'DriverStationExample'], {
    stdio: 'inherit',
    shell: true
  });

  // Wait a moment for the server to start
  setTimeout(() => {
    console.log('Opening Driver Station client in browser...');
    openBrowser();
  }, 2000);

  tsNode.on('close', code => {
    process.exit(code);
  });
}
