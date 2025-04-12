/**
 * Script to run a robot in simulation using the simulation framework.
 * 
 * Usage: node run-robot-simulation.js <robot-class-path>
 * 
 * Example: node run-robot-simulation.js examples/SimulationRobot
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Get the robot class path from the command line arguments
const robotClassPath = process.argv[2];

if (!robotClassPath) {
  console.error('Please provide a robot class path.');
  console.error('Usage: node run-robot-simulation.js <robot-class-path>');
  process.exit(1);
}

// Check if the robot class exists
const resolvedPath = path.resolve(robotClassPath);
const jsPath = resolvedPath.replace('.ts', '.js');

if (!fs.existsSync(resolvedPath) && !fs.existsSync(jsPath)) {
  console.error(`Robot class '${robotClassPath}' not found.`);
  process.exit(1);
}

// Check if the dist directory exists
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
  console.log('Building project...');
  const build = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    shell: true
  });

  build.on('close', code => {
    if (code === 0) {
      runSimulation();
    } else {
      console.error('Build failed with code', code);
      process.exit(code);
    }
  });
} else {
  runSimulation();
}

function runSimulation() {
  console.log(`Starting simulation with robot class: ${robotClassPath}...`);

  // Run the simulation using ts-node
  const tsNode = spawn('npx', ['ts-node', 'src/tools/simulation-cli.ts', resolvedPath], {
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

function openBrowser() {
  // Open the SimulationUI.html in the default browser
  const clientPath = path.join(__dirname, 'examples', 'SimulationUI.html');
  const clientUrl = `file://${clientPath}`;
  
  // Open the URL in the default browser based on the platform
  switch (os.platform()) {
    case 'win32':
      require('child_process').exec(`start "" "${clientUrl}"`);
      break;
    case 'darwin':
      require('child_process').exec(`open "${clientUrl}"`);
      break;
    default:
      require('child_process').exec(`xdg-open "${clientUrl}"`);
      break;
  }
}
