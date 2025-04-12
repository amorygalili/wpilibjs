/**
 * Example of using the NetworkTables 4 bridge with a robot simulation.
 *
 * This example demonstrates how to connect a robot simulation to external NetworkTables clients
 * like Shuffleboard and OutlineViewer. It creates a bridge between our internal NetworkTables
 * and an external NetworkTables server, allowing bidirectional communication.
 *
 * To use this example:
 * 1. Start a NetworkTables server (e.g., OutlineViewer or Shuffleboard)
 * 2. Run this example
 * 3. Observe the data in the external client
 */
import { TimedRobot, RobotBase, networkTables } from '../src';
import { NT4Bridge } from '../src/network/NT4Bridge';
import { NT4Client } from '../src/network/NT4Client';

/**
 * Example robot that demonstrates NetworkTables bridge functionality.
 */
class NT4BridgeRobot extends TimedRobot {
  // Create a NetworkTables 4 client
  private ntClient: NT4Client = new NT4Client('ws://localhost:5810');

  // Create a NetworkTables 4 bridge
  private ntBridge: NT4Bridge = new NT4Bridge(this.ntClient);

  // NetworkTables topics
  private counter = networkTables.getNumber('Robot/Counter', 0);
  private message = networkTables.getString('Robot/Message', 'Hello from TypeScript!');
  private enabled = networkTables.getBoolean('Robot/Enabled', false);
  private mode = networkTables.getString('Robot/Mode', 'Disabled');

  // Simulated robot state
  private leftMotor = networkTables.getNumber('Robot/LeftMotor', 0);
  private rightMotor = networkTables.getNumber('Robot/RightMotor', 0);
  private encoder = networkTables.getNumber('Robot/Encoder', 0);
  private limitSwitch = networkTables.getBoolean('Robot/LimitSwitch', false);
  private potentiometer = networkTables.getNumber('Robot/Potentiometer', 0);

  // External input topics
  private externalInput = networkTables.getNumber('External/Input', 0);
  private externalCommand = networkTables.getString('External/Command', '');

  // Robot position for simulation
  private position = 0;
  private direction = 1;

  /**
   * This function is run when the robot is first started up.
   */
  public override robotInit(): void {
    console.log('Robot initialized!');

    // Connect to the NetworkTables server
    this.ntBridge.connect().then(() => {
      console.log('Connected to NetworkTables server');
    }).catch((error) => {
      console.error('Failed to connect to NetworkTables server:', error);
    });

    // We can't directly subscribe to topics in the current API
    // Instead, we'll check the values in robotPeriodic
    console.log('Monitoring external input and command topics');

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
    const currentCount = this.counter.value || 0;
    this.counter.value = currentCount + 1;

    // Update robot state
    this.enabled.value = this.isEnabled();

    // Update mode
    if (this.isDisabled()) {
      this.mode.value = 'Disabled';
    } else if (this.isAutonomous()) {
      this.mode.value = 'Autonomous';
    } else if (this.isTeleop()) {
      this.mode.value = 'Teleop';
    } else if (this.isTest()) {
      this.mode.value = 'Test';
    }

    // Update simulated sensor values
    this.updateSimulation();
  }

  /**
   * This function is called once each time the robot enters Disabled mode.
   */
  public override disabledInit(): void {
    console.log('Disabled mode initialized');
    this.message.value = 'Robot is disabled';
    this.leftMotor.value = 0;
    this.rightMotor.value = 0;
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
    this.message.value = 'Running autonomous mode';
  }

  /**
   * This function is called periodically during Autonomous mode.
   */
  public override autonomousPeriodic(): void {
    // Simple autonomous mode: move back and forth
    if (this.limitSwitch.value) {
      this.direction = -1;
    } else if (this.position <= 0) {
      this.direction = 1;
    }

    const speed = 0.5 * this.direction;
    this.leftMotor.value = speed;
    this.rightMotor.value = speed;
  }

  /**
   * This function is called once each time the robot enters Teleop mode.
   */
  public override teleopInit(): void {
    console.log('Teleop mode initialized');
    this.message.value = 'Running teleop mode';
  }

  /**
   * This function is called periodically during Teleop mode.
   */
  public override teleopPeriodic(): void {
    // Use the external input as the motor speed in teleop
    const input = this.externalInput.value || 0;
    this.leftMotor.value = input;
    this.rightMotor.value = input;
  }

  /**
   * This function is called once each time the robot enters Test mode.
   */
  public override testInit(): void {
    console.log('Test mode initialized');
    this.message.value = 'Running test mode';
  }

  /**
   * This function is called periodically during Test mode.
   */
  public override testPeriodic(): void {
    // Alternate between forward and reverse in test mode
    const time = this.counter.value || 0;
    const speed = Math.sin(time / 50) * 0.5;
    this.leftMotor.value = speed;
    this.rightMotor.value = speed;
  }

  /**
   * Update the simulation.
   */
  private updateSimulation(): void {
    // Get motor speeds
    const leftSpeed = this.leftMotor.value || 0;
    const rightSpeed = this.rightMotor.value || 0;

    // Update position based on motor speeds
    const speed = (leftSpeed + rightSpeed) / 2;
    this.position += speed * 0.02; // 20ms period

    // Update encoder
    this.encoder.value = this.position * 20;

    // Update limit switch
    this.limitSwitch.value = this.position > 10;

    // Update potentiometer
    this.potentiometer.value = Math.min(5, Math.max(0, this.position / 2));
  }
}

// Start the robot program
if (require.main === module) {
  // Disable the driver station server to avoid port conflicts
  process.env.DISABLE_DS_SERVER = 'true';

  RobotBase.main(NT4BridgeRobot);
}
