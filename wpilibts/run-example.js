/**
 * Script to run an example from the examples directory.
 * 
 * Usage: node run-example.js <example-name>
 * 
 * Example: node run-example.js BasicRobot
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the example name from the command line arguments
const exampleName = process.argv[2];

if (!exampleName) {
  console.error('Please provide an example name.');
  console.error('Usage: node run-example.js <example-name>');
  console.error('Available examples:');
  
  // List available examples
  const examplesDir = path.join(__dirname, 'examples');
  const examples = fs.readdirSync(examplesDir)
    .filter(file => file.endsWith('.ts'))
    .map(file => file.replace('.ts', ''));
  
  examples.forEach(example => {
    console.error(`  - ${example}`);
  });
  
  process.exit(1);
}

// Check if the example exists
const examplePath = path.join(__dirname, 'examples', `${exampleName}.ts`);

if (!fs.existsSync(examplePath)) {
  console.error(`Example '${exampleName}' not found.`);
  process.exit(1);
}

// Run the example using ts-node
const tsNode = spawn('npx', ['ts-node', examplePath], {
  stdio: 'inherit',
  shell: true
});

tsNode.on('close', code => {
  process.exit(code);
});
