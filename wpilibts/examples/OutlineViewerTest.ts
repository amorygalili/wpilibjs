/**
 * Example robot program for testing with OutlineViewer.
 *
 * This example demonstrates how to publish data to NetworkTables that can be viewed
 * in OutlineViewer. It publishes a variety of data types and updates them periodically.
 */
import { networkTables } from '../src';
import { CustomTimedRobot } from './CustomTimedRobot';
import { CustomRobotBase } from './CustomRobotBase';
import { NT4Bridge } from '../src/network/NT4Bridge';
import { NT4Client } from '../src/network/NT4Client';

/**
 * Example robot for testing with OutlineViewer.
 */
class OutlineViewerTest extends CustomTimedRobot {
  // Create a NetworkTables 4 client
  private ntClient: NT4Client = new NT4Client('ws://localhost:5810');

  // Create a NetworkTables 4 bridge
  private ntBridge: NT4Bridge = new NT4Bridge(this.ntClient);

  // Counter for updating values
  private counter = 0;

  // NetworkTables topics - organized in a hierarchy for OutlineViewer
  // Boolean values
  private booleanValue = networkTables.getBoolean('OutlineViewerTest/Boolean/Value', false);
  private booleanToggle = networkTables.getBoolean('OutlineViewerTest/Boolean/Toggle', false);
  private booleanArray = networkTables.getBooleanArray('OutlineViewerTest/Boolean/Array', [false, true, false]);

  // Number values
  private numberValue = networkTables.getNumber('OutlineViewerTest/Number/Value', 0);
  private numberSine = networkTables.getNumber('OutlineViewerTest/Number/Sine', 0);
  private numberCosine = networkTables.getNumber('OutlineViewerTest/Number/Cosine', 0);
  private numberArray = networkTables.getNumberArray('OutlineViewerTest/Number/Array', [1, 2, 3, 4, 5]);

  // String values
  private stringValue = networkTables.getString('OutlineViewerTest/String/Value', 'Hello OutlineViewer!');
  private stringCounter = networkTables.getString('OutlineViewerTest/String/Counter', '0');
  private stringArray = networkTables.getStringArray('OutlineViewerTest/String/Array', ['Hello', 'OutlineViewer', '!']);

  // Robot state
  private robotEnabled = networkTables.getBoolean('OutlineViewerTest/Robot/Enabled', false);
  private robotMode = networkTables.getString('OutlineViewerTest/Robot/Mode', 'Disabled');
  private robotBattery = networkTables.getNumber('OutlineViewerTest/Robot/Battery', 12.5);

  // Simulated sensors
  private encoderPosition = networkTables.getNumber('OutlineViewerTest/Sensors/Encoder/Position', 0);
  private encoderVelocity = networkTables.getNumber('OutlineViewerTest/Sensors/Encoder/Velocity', 0);
  private gyroAngle = networkTables.getNumber('OutlineViewerTest/Sensors/Gyro/Angle', 0);
  private gyroRate = networkTables.getNumber('OutlineViewerTest/Sensors/Gyro/Rate', 0);
  private ultrasonicDistance = networkTables.getNumber('OutlineViewerTest/Sensors/Ultrasonic/Distance', 100);

  // Simulated motors
  private leftMotor = networkTables.getNumber('OutlineViewerTest/Motors/Left', 0);
  private rightMotor = networkTables.getNumber('OutlineViewerTest/Motors/Right', 0);
  private armMotor = networkTables.getNumber('OutlineViewerTest/Motors/Arm', 0);

  /**
   * This function is run when the robot is first started up.
   */
  public override robotInit(): void {
    this.leftMotor.setValue(5);
    
    console.log('Robot initialized!');

    // Connect to the NetworkTables server
    this.ntBridge.connect().then(() => {
      console.log('Connected to NetworkTables server');
    }).catch((error) => {
      console.error('Failed to connect to NetworkTables server:', error);
    });

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('Disconnecting from NetworkTables server');
      this.ntBridge.disconnect();
      process.exit(0);
    });
  }

  /**
   * This function is called every robot packet, no matter the mode.
   */
  public override robotPeriodic(): void {
    // Update counter
    this.counter++;

    // Update boolean values
    this.booleanValue.value = this.counter % 2 === 0;
    if (this.counter % 10 === 0) {
      this.booleanToggle.value = !this.booleanToggle.value;
    }
    this.booleanArray.value = [
      this.counter % 3 === 0,
      this.counter % 5 === 0,
      this.counter % 7 === 0
    ];

    // Update number values
    this.numberValue.value = this.counter;
    this.numberSine.value = Math.sin(this.counter * 0.1);
    this.numberCosine.value = Math.cos(this.counter * 0.1);
    this.numberArray.value = [
      this.counter % 10,
      (this.counter % 10) * 2,
      (this.counter % 10) * 3,
      (this.counter % 10) * 4,
      (this.counter % 10) * 5
    ];

    // Update string values
    this.stringCounter.value = `Counter: ${this.counter}`;
    if (this.counter % 100 === 0) {
      this.stringValue.value = `Updated at counter ${this.counter}`;
    }
    this.stringArray.value = [
      `Counter: ${this.counter}`,
      `Sine: ${this.numberSine.value.toFixed(2)}`,
      `Cosine: ${this.numberCosine.value.toFixed(2)}`
    ];

    // Update robot state
    this.robotEnabled.value = this.isEnabled();
    if (this.isDisabled()) {
      this.robotMode.value = 'Disabled';
    } else if (this.isAutonomous()) {
      this.robotMode.value = 'Autonomous';
    } else if (this.isTeleop()) {
      this.robotMode.value = 'Teleop';
    } else if (this.isTest()) {
      this.robotMode.value = 'Test';
    }

    // Simulate battery voltage (12.5V to 11.5V over time)
    this.robotBattery.value = 12.5 - (this.counter % 1000) / 1000;

    // Update simulated sensors
    this.updateSimulatedSensors();
  }

  /**
   * This function is called once each time the robot enters Disabled mode.
   */
  public override disabledInit(): void {
    console.log('Disabled mode initialized');
    this.leftMotor.value = 0;
    this.rightMotor.value = 0;
    this.armMotor.value = 0;
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
    // Simple autonomous: move in a square
    const phase = Math.floor((this.counter % 400) / 100);

    switch (phase) {
      case 0: // Forward
        this.leftMotor.value = 0.5;
        this.rightMotor.value = 0.5;
        break;
      case 1: // Turn right
        this.leftMotor.value = 0.5;
        this.rightMotor.value = -0.5;
        break;
      case 2: // Backward
        this.leftMotor.value = -0.5;
        this.rightMotor.value = -0.5;
        break;
      case 3: // Turn left
        this.leftMotor.value = -0.5;
        this.rightMotor.value = 0.5;
        break;
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
    // Simulate joystick input
    const forward = Math.sin(this.counter * 0.02) * 0.5;
    const turn = Math.sin(this.counter * 0.05) * 0.3;

    this.leftMotor.value = forward + turn;
    this.rightMotor.value = forward - turn;

    // Simulate arm movement
    this.armMotor.value = Math.sin(this.counter * 0.01) * 0.7;
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
    // Test each motor in sequence
    const phase = Math.floor((this.counter % 300) / 100);

    this.leftMotor.value = phase === 0 ? Math.sin(this.counter * 0.1) : 0;
    this.rightMotor.value = phase === 1 ? Math.sin(this.counter * 0.1) : 0;
    this.armMotor.value = phase === 2 ? Math.sin(this.counter * 0.1) : 0;
  }

  /**
   * Update simulated sensor values.
   */
  private updateSimulatedSensors(): void {
    // Update encoder based on motor values
    const encoderDelta = (this.leftMotor.value + this.rightMotor.value) / 2 * 10;
    this.encoderPosition.value = (this.encoderPosition.value || 0) + encoderDelta;
    this.encoderVelocity.value = encoderDelta * 50; // 50 Hz update rate

    // Update gyro based on turning
    const gyroDelta = (this.leftMotor.value - this.rightMotor.value) * 5;
    this.gyroAngle.value = ((this.gyroAngle.value || 0) + gyroDelta) % 360;
    this.gyroRate.value = gyroDelta * 50; // 50 Hz update rate

    // Update ultrasonic sensor with noise
    this.ultrasonicDistance.value = 100 + Math.sin(this.counter * 0.1) * 10 + Math.random() * 5;
  }
}

// Start the robot program
if (require.main === module) {
  // Disable the NetworkTables server to avoid port conflicts
  CustomRobotBase.main(OutlineViewerTest, true);
}
