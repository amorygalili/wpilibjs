/**
 * Script to run the NetworkTables test.
 *
 * This script:
 * 1. Builds the project if needed
 * 2. Runs the NetworkTablesTest
 * 3. Reports the test results
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

// Check if the dist directory exists
if (!fs.existsSync(path.join(__dirname, '..', '..', 'dist'))) {
  console.log('Building project...');
  const build = spawn('npx', ['tsc'], {
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

// Check if port 1736 is already in use (NetworkTables)
function checkPortAndRun() {
  const tester = net.createServer()
    .once('error', err => {
      if (err.code === 'EADDRINUSE') {
        console.log('NetworkTables server is already running on port 1736.');
        console.log('Please stop any running NetworkTables servers and try again.');
        process.exit(1);
      } else {
        console.error('Error checking port:', err);
        runTest();
      }
    })
    .once('listening', () => {
      tester.close(() => {
        runTest();
      });
    })
    .listen(1736);
}

function runTest() {
  console.log('Starting NetworkTables test...');

  // Run the test using ts-node
  const tsNode = spawn('npx', ['ts-node', path.join(__dirname, 'NetworkTablesTest.ts')], {
    stdio: 'inherit',
    shell: true
  });

  // Set a timeout to kill the process if it doesn't complete in time
  const timeout = setTimeout(() => {
    console.error('Test timed out after 30 seconds');
    tsNode.kill();
    process.exit(1);
  }, 30000);

  tsNode.on('close', code => {
    clearTimeout(timeout);
    if (code === 0) {
      console.log('NetworkTables test completed successfully');
    } else {
      console.error(`NetworkTables test failed with code ${code}`);
    }
    process.exit(code);
  });
}
