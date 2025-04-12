/**
 * Simple robot example that demonstrates how to use NetworkTables.
 * 
 * This example shows how to:
 * 1. Publish data to NetworkTables
 * 2. Read data from NetworkTables
 * 3. Use NetworkTables with a TimedRobot
 */
import { TimedRobot, RobotBase } from '../src';
import { NetworkTableInstance } from 'ntcore-client';

/**
 * A simple robot example that demonstrates how to use NetworkTables.
 */
class SimpleNetworkTablesRobot extends TimedRobot {
  // Get the default NetworkTables instance
  private ntInstance = NetworkTableInstance.getDefault();
  
  // Get a table for our robot data
  private robotTable = this.ntInstance.getTable('Robot');
  
  // Create entries for our robot data
  private counterEntry = this.robotTable.getEntry('Counter');
  private enabledEntry = this.robotTable.getEntry('Enabled');
  private modeEntry = this.robotTable.getEntry('Mode');
  
  // Create entries for simulated motors and sensors
  private leftMotorEntry = this.robotTable.getEntry('LeftMotor');
  private rightMotorEntry = this.robotTable.getEntry('RightMotor');
  private encoderEntry = this.robotTable.getEntry('Encoder');
  private limitSwitchEntry = this.robotTable.getEntry('LimitSwitch');
  
  // Counter for periodic updates
  private counter = 0;
  
  // Simulated robot state
  private position = 0;
  private direction = 1;
  
  /**
   * This function is run when the robot is first started up.
   */
  public override robotInit(): void {
    console.log('Robot initialized!');
    
    // Start the NetworkTables server
    this.ntInstance.startServer();
    console.log('NetworkTables server started');
    
    // Initialize values
    this.counterEntry.setInteger(0);
    this.enabledEntry.setBoolean(false);
    this.modeEntry.setString('Disabled');
    this.leftMotorEntry.setDouble(0);
    this.rightMotorEntry.setDouble(0);
    this.encoderEntry.setDouble(0);
    this.limitSwitchEntry.setBoolean(false);
  }
  
  /**
   * This function is called every robot packet, no matter the mode.
   */
  public override robotPeriodic(): void {
    // Update counter
    this.counter++;
    this.counterEntry.setInteger(this.counter);
    
    // Update robot state
    this.enabledEntry.setBoolean(this.isEnabled());
    
    // Update mode
    if (this.isDisabled()) {
      this.modeEntry.setString('Disabled');
    } else if (this.isAutonomous()) {
      this.modeEntry.setString('Autonomous');
    } else if (this.isTeleop()) {
      this.modeEntry.setString('Teleop');
    } else if (this.isTest()) {
      this.modeEntry.setString('Test');
    }
    
    // Update simulated sensor values
    this.updateSimulation();
  }
  
  /**
   * This function is called once each time the robot enters Disabled mode.
   */
  public override disabledInit(): void {
    console.log('Disabled mode initialized');
    this.leftMotorEntry.setDouble(0);
    this.rightMotorEntry.setDouble(0);
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
    if (this.limitSwitchEntry.getBoolean(false)) {
      this.direction = -1;
    } else if (this.position <= 0) {
      this.direction = 1;
    }
    
    const speed = 0.5 * this.direction;
    this.leftMotorEntry.setDouble(speed);
    this.rightMotorEntry.setDouble(speed);
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
    // In a real robot, we would read joystick values here
    // For this example, we'll just set the motors to a fixed value
    this.leftMotorEntry.setDouble(0.3);
    this.rightMotorEntry.setDouble(0.3);
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
    // Alternate between forward and reverse in test mode
    const time = this.counter;
    const speed = Math.sin(time / 50) * 0.5;
    this.leftMotorEntry.setDouble(speed);
    this.rightMotorEntry.setDouble(speed);
  }
  
  /**
   * Update the simulation.
   */
  private updateSimulation(): void {
    // Get motor speeds
    const leftSpeed = this.leftMotorEntry.getDouble(0);
    const rightSpeed = this.rightMotorEntry.getDouble(0);
    
    // Update position based on motor speeds
    const speed = (leftSpeed + rightSpeed) / 2;
    this.position += speed * 0.02; // 20ms period
    
    // Update encoder
    this.encoderEntry.setDouble(this.position * 20);
    
    // Update limit switch
    this.limitSwitchEntry.setBoolean(this.position > 10);
  }
}

// Start the robot program
if (require.main === module) {
  RobotBase.main(SimpleNetworkTablesRobot);
}
