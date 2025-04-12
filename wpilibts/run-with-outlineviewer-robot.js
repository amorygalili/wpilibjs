/**
 * Script to run the OutlineViewerRobot and launch OutlineViewer.
 *
 * This script:
 * 1. Runs the OutlineViewerRobot
 * 2. Launches OutlineViewer
 *
 * Usage: node run-with-outlineviewer-robot.js
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Path to WPILib installation
const wpilibPath = 'C:\\Users\\Public\\wpilib\\2024';

// Path to OutlineViewer
const outlineViewerPath = path.join(wpilibPath, 'tools', 'outlineviewer.exe');

// Check if OutlineViewer exists
if (!fs.existsSync(outlineViewerPath)) {
  console.error(`OutlineViewer not found at ${outlineViewerPath}`);
  console.error('Please make sure WPILib is installed correctly.');
  process.exit(1);
}

// Run the OutlineViewerRobot
console.log('Starting OutlineViewerRobot...');

const robot = spawn('node', [path.join(__dirname, 'run-example.js'), 'OutlineViewerRobot'], {
  stdio: 'inherit',
  shell: true
});

robot.on('error', (error) => {
  console.error(`Error starting OutlineViewerRobot: ${error.message}`);
  process.exit(1);
});

// Wait for the robot to start
setTimeout(() => {
  launchOutlineViewer();
}, 3000);

// Launch OutlineViewer
function launchOutlineViewer() {
  console.log('Launching OutlineViewer...');
  console.log('Please configure OutlineViewer with the following settings:');
  console.log('- Server Mode: Client');
  console.log('- Team Number/Server: localhost');
  console.log('- Port: 5810');

  const outlineViewer = spawn(outlineViewerPath, [], {
    stdio: 'inherit',
    shell: true,
    detached: true
  });

  outlineViewer.on('error', (error) => {
    console.error(`Error launching OutlineViewer: ${error.message}`);
  });

  console.log('OutlineViewer launched. You should see test data in the OutlineViewer window.');
  console.log('Press Ctrl+C to stop the robot.');
}

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Stopping all processes...');
  robot.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Stopping all processes...');
  robot.kill('SIGTERM');
  process.exit(0);
});
