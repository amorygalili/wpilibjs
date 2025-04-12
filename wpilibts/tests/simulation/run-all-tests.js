/**
 * Script to run all simulation tests.
 * 
 * This script:
 * 1. Builds the project if needed
 * 2. Runs all the simulation tests
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
      runTests();
    } else {
      console.error('Build failed with code', code);
      process.exit(code);
    }
  });
} else {
  runTests();
}

function runTests() {
  console.log('=== Running all simulation tests ===');
  
  // List of tests to run
  const tests = [
    { name: 'SimHooks', script: 'run-simhooks-test.js' },
    { name: 'NetworkTables', script: 'run-networktables-test.js' },
    { name: 'Simulation', script: 'run-simulation-test.js' }
  ];
  
  // Run each test in sequence
  runNextTest(tests, 0, []);
}

function runNextTest(tests, index, results) {
  if (index >= tests.length) {
    // All tests completed
    reportResults(results);
    return;
  }
  
  const test = tests[index];
  console.log(`\n=== Running ${test.name} test ===`);
  
  // Run the test
  const testProcess = spawn('node', [path.join(__dirname, test.script)], {
    stdio: 'inherit',
    shell: true
  });
  
  testProcess.on('close', code => {
    results.push({
      name: test.name,
      success: code === 0
    });
    
    // Run the next test
    runNextTest(tests, index + 1, results);
  });
}

function reportResults(results) {
  console.log('\n=== Simulation Test Results ===');
  
  let allPassed = true;
  
  results.forEach(result => {
    const status = result.success ? 'PASSED' : 'FAILED';
    console.log(`${result.name}: ${status}`);
    
    if (!result.success) {
      allPassed = false;
    }
  });
  
  console.log('\nOverall result:', allPassed ? 'PASSED' : 'FAILED');
  console.log('==============================');
  
  process.exit(allPassed ? 0 : 1);
}
