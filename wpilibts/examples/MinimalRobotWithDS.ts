/**
 * Minimal robot project that uses a custom driver station.
 *
 * This robot project demonstrates how to create a robot that can be run in simulation
 * using a custom driver station.
 */
import { TimedRobot, RobotBase } from '../src';
import { MinimalDriverStation, Alliance } from './MinimalDriverStation';

/**
 * Minimal robot project that uses a custom driver station.
 */
export class MinimalRobotWithDS extends TimedRobot {
  private counter: number = 0;
  private driverStation: MinimalDriverStation;

  /**
   * Constructor for MinimalRobotWithDS.
   */
  constructor() {
    super();
    this.driverStation = MinimalDriverStation.getInstance();

    // Set initial state
    this.driverStation.setEnabled(false);
    this.driverStation.setAutonomous(false);
    this.driverStation.setTest(false);
    this.driverStation.setEStopped(false);
    this.driverStation.setFMSAttached(false);
    this.driverStation.setDSAttached(true);
    this.driverStation.setAlliance(Alliance.kRed);
    this.driverStation.setLocation(1);
    this.driverStation.setMatchTime(0);
  }

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
      console.log(`Robot state: enabled=${this.driverStation.isEnabled()}, autonomous=${this.driverStation.isAutonomous()}, test=${this.driverStation.isTest()}`);
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
    if (this.counter % 50 === 0) {
      console.log('Autonomous mode running');
    }
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
    if (this.counter % 50 === 0) {
      console.log('Teleop mode running');
    }
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
    if (this.counter % 50 === 0) {
      console.log('Test mode running');
    }
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
    if (this.counter % 50 === 0) {
      console.log('Simulation mode running');
    }

    // Simulate the robot state
    if (this.counter === 100) {
      console.log('Enabling robot in teleop mode');
      this.driverStation.setEnabled(true);
      this.driverStation.setAutonomous(false);
      this.driverStation.setTest(false);
    } else if (this.counter === 300) {
      console.log('Switching to autonomous mode');
      this.driverStation.setAutonomous(true);
    } else if (this.counter === 500) {
      console.log('Switching to test mode');
      this.driverStation.setAutonomous(false);
      this.driverStation.setTest(true);
    } else if (this.counter === 700) {
      console.log('Disabling robot');
      this.driverStation.setEnabled(false);
    }
  }
}

// Start the robot program
if (require.main === module) {
  // Start the robot
  RobotBase.main(MinimalRobotWithDS);
}
