/**
 * Minimal robot project that can be run in simulation.
 * 
 * This robot project demonstrates how to create a robot that can be run in simulation
 * without using NetworkTables or starting a server.
 */
import { TimedRobot, RobotBase } from '../src';

/**
 * Minimal robot project that can be run in simulation.
 */
export class MinimalRobot extends TimedRobot {
  private counter: number = 0;

  /**
   * This function is run when the robot is first started up.
   */
  public override robotInit(): void {
    console.log('Robot initialized!');
  }

  /**
   * This function is called every robot packet, no matter the mode.
   */
  public override robotPeriodic(): void {
    this.counter++;
    if (this.counter % 50 === 0) {
      console.log(`Robot running for ${this.counter * this.getPeriod()} seconds`);
    }
  }

  /**
   * This function is called once each time the robot enters Disabled mode.
   */
  public override disabledInit(): void {
    console.log('Disabled mode initialized');
  }

  /**
   * This function is called periodically during Disabled mode.
   */
  public override disabledPeriodic(): void {
    // Nothing to do here
  }

  /**
   * This function is called once each time the robot enters Autonomous mode.
   */
  public override autonomousInit(): void {
    console.log('Autonomous mode initialized');
  }

  /**
   * This function is called periodically during Autonomous mode.
   */
  public override autonomousPeriodic(): void {
    console.log('Autonomous mode running');
  }

  /**
   * This function is called once each time the robot enters Teleop mode.
   */
  public override teleopInit(): void {
    console.log('Teleop mode initialized');
  }

  /**
   * This function is called periodically during Teleop mode.
   */
  public override teleopPeriodic(): void {
    console.log('Teleop mode running');
  }

  /**
   * This function is called once each time the robot enters Test mode.
   */
  public override testInit(): void {
    console.log('Test mode initialized');
  }

  /**
   * This function is called periodically during Test mode.
   */
  public override testPeriodic(): void {
    console.log('Test mode running');
  }

  /**
   * This function is called once each time the robot enters Simulation mode.
   */
  public override simulationInit(): void {
    console.log('Simulation mode initialized');
  }

  /**
   * This function is called periodically during Simulation mode.
   */
  public override simulationPeriodic(): void {
    console.log('Simulation mode running');
  }
}

// Start the robot program
if (require.main === module) {
  // Disable the driver station server
  process.env.DISABLE_DS_SERVER = 'true';
  
  // Start the robot
  RobotBase.main(MinimalRobot);
}
