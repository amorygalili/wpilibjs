/**
 * Simulation for the SimpleRobot example.
 * 
 * This script allows you to control the robot mode in simulation.
 */

import { SimulationFramework } from '../src/simulation/SimulationFramework';
import { SimpleRobot } from './SimpleRobot';
import * as readline from 'readline';

// Create a simulation framework for the SimpleRobot
const simulation = new SimulationFramework(SimpleRobot);

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Display the menu of available commands.
 */
function displayMenu(): void {
  console.log('\n--- SimpleRobot Simulation Controls ---');
  console.log('1. Enable Robot (Teleop)');
  console.log('2. Enable Robot (Autonomous)');
  console.log('3. Enable Robot (Test)');
  console.log('4. Disable Robot');
  console.log('5. Exit Simulation');
  console.log('----------------------------------------');
  console.log('Current Status:');
  console.log(`- Simulation Running: ${simulation.isRunning()}`);
  console.log(`- Connected to NetworkTables: ${simulation.isConnectedToNetworkTables()}`);
  console.log('----------------------------------------');
  rl.question('Enter command (1-5): ', handleCommand);
}

/**
 * Handle user commands.
 * 
 * @param command The command entered by the user
 */
function handleCommand(command: string): void {
  switch (command) {
    case '1':
      console.log('Enabling robot in Teleop mode...');
      simulation.setEnabled(true);
      simulation.setAutonomous(false);
      simulation.setTest(false);
      break;
    case '2':
      console.log('Enabling robot in Autonomous mode...');
      simulation.setEnabled(true);
      simulation.setAutonomous(true);
      simulation.setTest(false);
      break;
    case '3':
      console.log('Enabling robot in Test mode...');
      simulation.setEnabled(true);
      simulation.setAutonomous(false);
      simulation.setTest(true);
      break;
    case '4':
      console.log('Disabling robot...');
      simulation.setEnabled(false);
      break;
    case '5':
      console.log('Exiting simulation...');
      simulation.stop();
      rl.close();
      process.exit(0);
      return;
    default:
      console.log('Invalid command. Please try again.');
      break;
  }
  
  // Display the menu again
  displayMenu();
}

// Start the simulation
console.log('Starting SimpleRobot simulation...');
console.log('Make sure OutlineViewer is running on localhost:5810');

simulation.start().then(() => {
  console.log('Simulation started successfully!');
  displayMenu();
}).catch((error) => {
  console.error('Failed to start simulation:', error);
  rl.close();
  process.exit(1);
});

// Handle simulation events
simulation.on('started', () => {
  console.log('Simulation has started.');
});

simulation.on('stopped', () => {
  console.log('Simulation has stopped.');
});

simulation.on('ntConnected', () => {
  console.log('Connected to NetworkTables server.');
});

simulation.on('ntDisconnected', () => {
  console.log('Disconnected from NetworkTables server.');
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Stopping simulation...');
  simulation.stop();
  rl.close();
  process.exit(0);
});
