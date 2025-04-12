/**
 * Example robot project that can be run in simulation.
 *
 * This robot project demonstrates how to create a robot that can be run in simulation.
 */
import { TimedRobot, DriverStation, networkTables, RobotBase } from '../src';

/**
 * Example robot project that can be run in simulation.
 */
export class SimulationRobot extends TimedRobot {
  // NetworkTables topics
  private leftMotorTopic = networkTables.getNumber('Robot/LeftMotor', 0);
  private rightMotorTopic = networkTables.getNumber('Robot/RightMotor', 0);
  private encoderTopic = networkTables.getNumber('Robot/Encoder', 0);
  private limitSwitchTopic = networkTables.getBoolean('Robot/LimitSwitch', false);
  private potentiometerTopic = networkTables.getNumber('Robot/Potentiometer', 0);
  private robotEnabledTopic = networkTables.getBoolean('Robot/Enabled', false);
  private robotModeTopic = networkTables.getString('Robot/Mode', 'Disabled');

  // Robot state
  private position = 0;
  private direction = 1;

  /**
   * This function is run when the robot is first started up.
   */
  public override robotInit(): void {
    console.log('Robot initialized!');

    // Set initial values for NetworkTables
    this.leftMotorTopic.value = 0;
    this.rightMotorTopic.value = 0;
    this.encoderTopic.value = 0;
    this.limitSwitchTopic.value = false;
    this.potentiometerTopic.value = 0;
    this.robotEnabledTopic.value = false;
    this.robotModeTopic.value = 'Disabled';
  }

  /**
   * This function is called every robot packet, no matter the mode.
   */
  public override robotPeriodic(): void {
    // Update robot enabled state
    this.robotEnabledTopic.value = DriverStation.getInstance().isEnabled();

    // Update robot mode
    if (DriverStation.getInstance().isDisabled()) {
      this.robotModeTopic.value = 'Disabled';
    } else if (DriverStation.getInstance().isAutonomous()) {
      this.robotModeTopic.value = 'Autonomous';
    } else if (DriverStation.getInstance().isTest()) {
      this.robotModeTopic.value = 'Test';
    } else {
      this.robotModeTopic.value = 'Teleop';
    }
  }

  /**
   * This function is called once each time the robot enters Disabled mode.
   */
  public override disabledInit(): void {
    console.log('Disabled mode initialized');
    this.leftMotorTopic.value = 0;
    this.rightMotorTopic.value = 0;
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
    // Simple autonomous mode: move back and forth
    if (this.limitSwitchTopic.value) {
      this.direction = -1;
    } else if (this.position <= 0) {
      this.direction = 1;
    }

    const speed = 0.5 * this.direction;
    this.leftMotorTopic.value = speed;
    this.rightMotorTopic.value = speed;

    this.updateSimulation();
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
    // Get joystick values
    // In a real implementation, we would get joystick values from the DriverStation
    // For now, we'll just use some default values
    const leftY = 0.0;
    const rightY = 0.0;

    // Tank drive
    this.leftMotorTopic.value = -leftY;
    this.rightMotorTopic.value = -rightY;

    this.updateSimulation();
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
    // Nothing to do here
  }

  /**
   * Update the simulation.
   */
  private updateSimulation(): void {
    // Update position based on motor speeds
    const speed = (this.leftMotorTopic.value + this.rightMotorTopic.value) / 2;
    this.position += speed;

    // Update encoder
    this.encoderTopic.value = this.position * 20;

    // Update limit switch
    this.limitSwitchTopic.value = this.position > 10;

    // Update potentiometer
    this.potentiometerTopic.value = Math.min(5, Math.max(0, this.position / 2));
  }
}

// Start the robot program
if (require.main === module) {
  RobotBase.main(SimulationRobot);
}
