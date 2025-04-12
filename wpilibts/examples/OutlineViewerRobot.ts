/**
 * Example robot program specifically designed to work with OutlineViewer.
 *
 * This example publishes data to NetworkTables in a format that OutlineViewer can understand.
 */
import { TimedRobot, RobotBase, networkTables } from '../src';

/**
 * Example robot for testing with OutlineViewer.
 */
class OutlineViewerRobot extends TimedRobot {
  // Counter for updating values
  private counter = 0;

  // NetworkTables topics - organized in a hierarchy for OutlineViewer
  // Boolean values
  private booleanValue = networkTables.getBoolean('SmartDashboard/Boolean/Value', false);
  private booleanToggle = networkTables.getBoolean('SmartDashboard/Boolean/Toggle', false);
  private booleanArray = networkTables.getBooleanArray('SmartDashboard/Boolean/Array', [false, true, false]);

  // Number values
  private numberValue = networkTables.getNumber('SmartDashboard/Number/Value', 0);
  private numberSine = networkTables.getNumber('SmartDashboard/Number/Sine', 0);
  private numberCosine = networkTables.getNumber('SmartDashboard/Number/Cosine', 0);
  private numberArray = networkTables.getNumberArray('SmartDashboard/Number/Array', [1, 2, 3, 4, 5]);

  // String values
  private stringValue = networkTables.getString('SmartDashboard/String/Value', 'Hello OutlineViewer!');
  private stringCounter = networkTables.getString('SmartDashboard/String/Counter', '0');
  private stringArray = networkTables.getStringArray('SmartDashboard/String/Array', ['Hello', 'OutlineViewer', '!']);

  // Robot state
  private robotEnabled = networkTables.getBoolean('SmartDashboard/Robot/Enabled', false);
  private robotMode = networkTables.getString('SmartDashboard/Robot/Mode', 'Disabled');
  private robotBattery = networkTables.getNumber('SmartDashboard/Robot/Battery', 12.5);

  // Simulated sensors
  private encoderPosition = networkTables.getNumber('SmartDashboard/Sensors/Encoder/Position', 0);
  private encoderVelocity = networkTables.getNumber('SmartDashboard/Sensors/Encoder/Velocity', 0);
  private gyroAngle = networkTables.getNumber('SmartDashboard/Sensors/Gyro/Angle', 0);
  private gyroRate = networkTables.getNumber('SmartDashboard/Sensors/Gyro/Rate', 0);
  private ultrasonicDistance = networkTables.getNumber('SmartDashboard/Sensors/Ultrasonic/Distance', 100);

  // Simulated motors
  private leftMotor = networkTables.getNumber('SmartDashboard/Motors/Left', 0);
  private rightMotor = networkTables.getNumber('SmartDashboard/Motors/Right', 0);
  private armMotor = networkTables.getNumber('SmartDashboard/Motors/Arm', 0);

  /**
   * This function is run when the robot is first started up.
   */
  public override robotInit(): void {
    console.log('Robot initialized!');

    // Print NetworkTables server information
    console.log('NetworkTables server information:');
    console.log('- Client connected:', networkTables.isConnected());

    // Initialize all values to make sure they're published
    this.initializeValues();

    // Print out all topics
    console.log('Published topics:');
    console.log('- SmartDashboard/Boolean/Value');
    console.log('- SmartDashboard/Boolean/Toggle');
    console.log('- SmartDashboard/Boolean/Array');
    console.log('- SmartDashboard/Number/Value');
    console.log('- SmartDashboard/Number/Sine');
    console.log('- SmartDashboard/Number/Cosine');
    console.log('- SmartDashboard/Number/Array');
    console.log('- SmartDashboard/String/Value');
    console.log('- SmartDashboard/String/Counter');
    console.log('- SmartDashboard/String/Array');
    console.log('- SmartDashboard/Robot/Enabled');
    console.log('- SmartDashboard/Robot/Mode');
    console.log('- SmartDashboard/Robot/Battery');
    console.log('- SmartDashboard/Sensors/Encoder/Position');
    console.log('- SmartDashboard/Sensors/Encoder/Velocity');
    console.log('- SmartDashboard/Sensors/Gyro/Angle');
    console.log('- SmartDashboard/Sensors/Gyro/Rate');
    console.log('- SmartDashboard/Sensors/Ultrasonic/Distance');
    console.log('- SmartDashboard/Motors/Left');
    console.log('- SmartDashboard/Motors/Right');
    console.log('- SmartDashboard/Motors/Arm');
  }

  /**
   * Initialize all values to make sure they're published.
   */
  private initializeValues(): void {
    // Boolean values
    this.booleanValue.value = false;
    this.booleanToggle.value = false;
    this.booleanArray.value = [false, true, false];

    // Number values
    this.numberValue.value = 0;
    this.numberSine.value = 0;
    this.numberCosine.value = 0;
    this.numberArray.value = [1, 2, 3, 4, 5];

    // String values
    this.stringValue.value = 'Hello OutlineViewer!';
    this.stringCounter.value = '0';
    this.stringArray.value = ['Hello', 'OutlineViewer', '!'];

    // Robot state
    this.robotEnabled.value = this.isEnabled();
    this.robotMode.value = 'Disabled';
    this.robotBattery.value = 12.5;

    // Simulated sensors
    this.encoderPosition.value = 0;
    this.encoderVelocity.value = 0;
    this.gyroAngle.value = 0;
    this.gyroRate.value = 0;
    this.ultrasonicDistance.value = 100;

    // Simulated motors
    this.leftMotor.value = 0;
    this.rightMotor.value = 0;
    this.armMotor.value = 0;
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
  // Use port 1735 (default) for OutlineViewer compatibility
  // process.env.NT_SERVER_PORT = '1735';

  // Start the NetworkTables server explicitly
  networkTables.startServer(1735).then(() => {
    console.log('NetworkTables server started on port 1735');

    // Start the robot
    RobotBase.main(OutlineViewerRobot);
  }).catch((error) => {
    console.error('Failed to start NetworkTables server:', error);
  });
}
