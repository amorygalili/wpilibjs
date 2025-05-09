/**
 * Example robot program that demonstrates how to use NetworkTables with OutlineViewer.
 * 
 * This example shows how to:
 * 1. Connect to an external NetworkTables server (like OutlineViewer)
 * 2. Publish data to NetworkTables
 * 3. Read data from NetworkTables
 * 
 * To use this example:
 * 1. Start OutlineViewer and configure it as a server
 * 2. Run this example
 * 3. Observe the data in OutlineViewer
 */
import { TimedRobot, RobotBase } from '../src';
import { NetworkTableInstance } from 'ntcore-client';

/**
 * Example robot that demonstrates how to use NetworkTables with OutlineViewer.
 */
class OutlineViewerRobot extends TimedRobot {
  // Get the default NetworkTables instance
  private ntInstance = NetworkTableInstance.getDefault();
  
  // Get tables for organizing our data
  private robotTable = this.ntInstance.getTable('Robot');
  private sensorsTable = this.ntInstance.getTable('Sensors');
  private motorsTable = this.ntInstance.getTable('Motors');
  
  // Create entries for our robot data
  private counterEntry = this.robotTable.getEntry('Counter');
  private enabledEntry = this.robotTable.getEntry('Enabled');
  private modeEntry = this.robotTable.getEntry('Mode');
  private messageEntry = this.robotTable.getEntry('Message');
  
  // Create entries for simulated motors
  private leftMotorEntry = this.motorsTable.getEntry('LeftMotor');
  private rightMotorEntry = this.motorsTable.getEntry('RightMotor');
  
  // Create entries for simulated sensors
  private encoderEntry = this.sensorsTable.getEntry('Encoder');
  private limitSwitchEntry = this.sensorsTable.getEntry('LimitSwitch');
  private potentiometerEntry = this.sensorsTable.getEntry('Potentiometer');
  
  // Create entries for external input
  private externalInputEntry = this.ntInstance.getTable('External').getEntry('Input');
  
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
    
    // Connect to the NetworkTables server (OutlineViewer)
    // By default, OutlineViewer uses port 5810 for NT4
    this.ntInstance.startClient4('WPILib-Robot', 'localhost', 5810);
    console.log('Connecting to NetworkTables server...');
    
    // Initialize values
    this.counterEntry.setInteger(0);
    this.enabledEntry.setBoolean(false);
    this.modeEntry.setString('Disabled');
    this.messageEntry.setString('Robot initialized');
    this.leftMotorEntry.setDouble(0);
    this.rightMotorEntry.setDouble(0);
    this.encoderEntry.setDouble(0);
    this.limitSwitchEntry.setBoolean(false);
    this.potentiometerEntry.setDouble(0);
    
    // Check connection status periodically
    setInterval(() => {
      if (this.ntInstance.isConnected()) {
        console.log('Connected to NetworkTables server');
      } else {
        console.log('Waiting for connection...');
      }
    }, 5000);
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
    this.messageEntry.setString('Robot is disabled');
    this.leftMotorEntry.setDouble(0);
    this.rightMotorEntry.setDouble(0);
  }
  
  /**
   * This function is called once each time the robot enters Autonomous mode.
   */
  public override autonomousInit(): void {
    console.log('Autonomous mode initialized');
    this.messageEntry.setString('Running autonomous mode');
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
    this.messageEntry.setString('Running teleop mode');
  }
  
  /**
   * This function is called periodically during Teleop mode.
   */
  public override teleopPeriodic(): void {
    // Use the external input as the motor speed in teleop
    const input = this.externalInputEntry.getDouble(0);
    this.leftMotorEntry.setDouble(input);
    this.rightMotorEntry.setDouble(input);
  }
  
  /**
   * This function is called once each time the robot enters Test mode.
   */
  public override testInit(): void {
    console.log('Test mode initialized');
    this.messageEntry.setString('Running test mode');
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
    const speed = (leftSpeed + rightMotorEntry) / 2;
    this.position += speed * 0.02; // 20ms period
    
    // Update encoder
    this.encoderEntry.setDouble(this.position * 20);
    
    // Update limit switch
    this.limitSwitchEntry.setBoolean(this.position > 10);
    
    // Update potentiometer
    this.potentiometerEntry.setDouble(Math.min(5, Math.max(0, this.position / 2)));
  }
}

// Start the robot program
if (require.main === module) {
  RobotBase.main(OutlineViewerRobot);
}
