/**
 * Command-line tool for running simulations.
 * 
 * This tool allows any robot project to be run in simulation from the command line.
 */
import * as path from 'path';
import { SimulationFramework } from '../simulation/SimulationFramework';
import { RobotBase } from '../RobotBase';

/**
 * Main function.
 */
async function main() {
  // Get robot class from command line arguments
  const robotClassPath = process.argv[2];
  if (!robotClassPath) {
    console.error('Please provide a path to the robot class');
    console.error('Usage: node simulation-cli.js <robot-class-path>');
    process.exit(1);
  }

  try {
    // Load robot class
    const robotModule = require(path.resolve(robotClassPath));
    const robotClass = robotModule.default || robotModule;

    // Check if the robot class extends RobotBase
    if (!(robotClass.prototype instanceof RobotBase)) {
      console.error('The provided class does not extend RobotBase');
      process.exit(1);
    }

    // Create simulation framework
    const framework = new SimulationFramework(robotClass);

    // Start simulation
    await framework.start();

    console.log('Simulation started. Press Ctrl+C to stop.');

    // Handle process termination
    process.on('SIGINT', () => {
      framework.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error starting simulation:', error);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main();
}
