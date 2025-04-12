/**
 * Script to run the SimHooks test.
 * 
 * This script:
 * 1. Builds the project if needed
 * 2. Runs the SimHooksTest
 * 3. Reports the test results
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if the dist directory exists
if (!fs.existsSync(path.join(__dirname, '..', '..', 'dist'))) {
  console.log('Building project...');
  const build = spawn('npx', ['tsc'], {
    stdio: 'inherit',
    shell: true
  });

  build.on('close', code => {
    if (code === 0) {
      runTest();
    } else {
      console.error('Build failed with code', code);
      process.exit(code);
    }
  });
} else {
  runTest();
}

function runTest() {
  console.log('Starting SimHooks test...');
  
  // Run the test using ts-node
  const tsNode = spawn('npx', ['ts-node', path.join(__dirname, 'SimHooksTest.ts')], {
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
      console.log('SimHooks test completed successfully');
    } else {
      console.error(`SimHooks test failed with code ${code}`);
    }
    process.exit(code);
  });
}
