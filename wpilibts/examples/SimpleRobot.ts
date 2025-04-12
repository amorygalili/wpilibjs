import { TimedRobot } from '../src/TimedRobot';
import { RobotBase } from '../src/RobotBase';

/**
 * A simple robot example that demonstrates the basic structure of a robot program.
 */
class SimpleRobot extends TimedRobot {
  private counter: number = 0;
  
  /**
   * This function is run when the robot is first started up.
   */
  public override robotInit(): void {
    console.log('Robot initialized!');
  }
  
  /**
   * This function is called periodically in all robot modes.
   */
  public override robotPeriodic(): void {
    this.counter++;
    if (this.counter % 50 === 0) {
      console.log(`Robot running for ${this.counter * this.getPeriod()} seconds`);
    }
  }
  
  /**
   * This function is called once when the robot enters disabled mode.
   */
  public override disabledInit(): void {
    console.log('Robot disabled!');
  }
  
  /**
   * This function is called periodically when the robot is in disabled mode.
   */
  public override disabledPeriodic(): void {
    // Nothing to do here
  }
  
  /**
   * This function is called once when the robot enters autonomous mode.
   */
  public override autonomousInit(): void {
    console.log('Autonomous mode started!');
  }
  
  /**
   * This function is called periodically when the robot is in autonomous mode.
   */
  public override autonomousPeriodic(): void {
    // Autonomous code would go here
  }
  
  /**
   * This function is called once when the robot enters teleop mode.
   */
  public override teleopInit(): void {
    console.log('Teleop mode started!');
  }
  
  /**
   * This function is called periodically when the robot is in teleop mode.
   */
  public override teleopPeriodic(): void {
    // Teleop code would go here
  }
  
  /**
   * This function is called once when the robot enters test mode.
   */
  public override testInit(): void {
    console.log('Test mode started!');
  }
  
  /**
   * This function is called periodically when the robot is in test mode.
   */
  public override testPeriodic(): void {
    // Test code would go here
  }
  
  /**
   * This function is called once when the robot enters simulation mode.
   */
  public override simulationInit(): void {
    console.log('Simulation mode started!');
  }
  
  /**
   * This function is called periodically when the robot is in simulation mode.
   */
  public override simulationPeriodic(): void {
    // Simulation code would go here
  }
}

// Start the robot program
if (require.main === module) {
  RobotBase.main(SimpleRobot);
}
