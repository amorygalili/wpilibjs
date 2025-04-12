/**
 * Test for the simulation functionality.
 *
 * This test verifies that the simulation features work correctly.
 */

import {
  TimedRobot,
  RobotBase,
  networkTables,
  SimHooks,
  DigitalInputSim,
  AnalogInputSim,
  PWMSim,
  EncoderSim
} from '../../src';

/**
 * A simple robot for testing simulation features.
 */
export class SimulationTestRobot extends TimedRobot {
  // Simulated devices
  private leftMotorSim: PWMSim;
  private rightMotorSim: PWMSim;
  private encoderSim: EncoderSim;
  private limitSwitchSim: DigitalInputSim;
  private potentiometerSim: AnalogInputSim;

  // NetworkTables topics
  private leftMotorTopic = networkTables.getNumber('Robot/LeftMotor');
  private rightMotorTopic = networkTables.getNumber('Robot/RightMotor');
  private encoderTopic = networkTables.getNumber('Robot/Encoder');
  private limitSwitchTopic = networkTables.getBoolean('Robot/LimitSwitch');
  private potentiometerTopic = networkTables.getNumber('Robot/Potentiometer');
  private robotEnabledTopic = networkTables.getBoolean('Robot/Enabled');
  private robotModeTopic = networkTables.getString('Robot/Mode');
  private testStatusTopic = networkTables.getString('Test/Status');
  private testCompleteTopic = networkTables.getBoolean('Test/Complete');

  // Test state
  private testSteps: (() => boolean)[] = [];
  private currentStep = 0;
  private testPassed = true;
  private testMessages: string[] = [];

  /**
   * Constructor
   */
  constructor() {
    super();

    // Initialize simulated devices
    this.leftMotorSim = new PWMSim(0);
    this.rightMotorSim = new PWMSim(1);
    this.encoderSim = new EncoderSim(0);
    this.limitSwitchSim = new DigitalInputSim(0);
    this.potentiometerSim = new AnalogInputSim(0);

    // Initialize the devices
    this.leftMotorSim.setInitialized(true);
    this.rightMotorSim.setInitialized(true);
    this.encoderSim.setInitialized(true);
    this.limitSwitchSim.setInitialized(true);
    this.potentiometerSim.setInitialized(true);

    // Set up test steps
    this.setupTestSteps();
  }

  /**
   * Set up the test steps.
   */
  private setupTestSteps(): void {
    // Test 1: Verify that the simulated devices are initialized
    this.testSteps.push(() => {
      const result =
        this.leftMotorSim.isInitialized() &&
        this.rightMotorSim.isInitialized() &&
        this.encoderSim.isInitialized() &&
        this.limitSwitchSim.isInitialized() &&
        this.potentiometerSim.isInitialized();

      this.logTestResult(1, "Device initialization", result);
      return result;
    });

    // Test 2: Verify that the NetworkTables topics are created
    this.testSteps.push(() => {
      const result =
        this.leftMotorTopic !== undefined &&
        this.rightMotorTopic !== undefined &&
        this.encoderTopic !== undefined &&
        this.limitSwitchTopic !== undefined &&
        this.potentiometerTopic !== undefined &&
        this.robotEnabledTopic !== undefined &&
        this.robotModeTopic !== undefined;

      this.logTestResult(2, "NetworkTables topic creation", result);
      return result;
    });

    // Test 3: Verify that the motor values can be set and read
    this.testSteps.push(() => {
      this.leftMotorSim.setSpeed(0.5);
      this.rightMotorSim.setSpeed(-0.5);

      const result =
        Math.abs(this.leftMotorSim.getSpeed() - 0.5) < 0.001 &&
        Math.abs(this.rightMotorSim.getSpeed() + 0.5) < 0.001;

      this.logTestResult(3, "Motor value setting and reading", result);
      return result;
    });

    // Test 4: Verify that the encoder value can be set and read
    this.testSteps.push(() => {
      this.encoderSim.setCount(100);

      const result = this.encoderSim.getCount() === 100;

      this.logTestResult(4, "Encoder value setting and reading", result);
      return result;
    });

    // Test 5: Verify that the limit switch value can be set and read
    this.testSteps.push(() => {
      this.limitSwitchSim.setValue(true);

      const result = this.limitSwitchSim.getValue() === true;

      this.logTestResult(5, "Limit switch value setting and reading", result);
      return result;
    });

    // Test 6: Verify that the potentiometer value can be set and read
    this.testSteps.push(() => {
      this.potentiometerSim.setVoltage(3.3);

      const result = Math.abs(this.potentiometerSim.getVoltage() - 3.3) < 0.001;

      this.logTestResult(6, "Potentiometer value setting and reading", result);
      return result;
    });

    // Test 7: Verify that the NetworkTables values can be set and read
    this.testSteps.push(() => {
      this.leftMotorTopic.value = 0.75;
      this.rightMotorTopic.value = -0.75;
      this.encoderTopic.value = 200;
      this.limitSwitchTopic.value = true;
      this.potentiometerTopic.value = 2.5;

      const result =
        Math.abs(this.leftMotorTopic.value - 0.75) < 0.001 &&
        Math.abs(this.rightMotorTopic.value + 0.75) < 0.001 &&
        this.encoderTopic.value === 200 &&
        this.limitSwitchTopic.value === true &&
        Math.abs(this.potentiometerTopic.value - 2.5) < 0.001;

      this.logTestResult(7, "NetworkTables value setting and reading", result);
      return result;
    });

    // Test 8: Verify that the SimHooks functions work correctly
    this.testSteps.push(() => {
      const initialTime = SimHooks.getInstance().getFPGATime();
      SimHooks.getInstance().stepTiming(1000000); // Step 1 second
      const newTime = SimHooks.getInstance().getFPGATime();

      const result = (newTime - initialTime) >= 1000000;

      this.logTestResult(8, "SimHooks timing functions", result);
      return result;
    });
  }

  /**
   * Log a test result.
   *
   * @param testNumber The test number.
   * @param testName The test name.
   * @param passed Whether the test passed.
   */
  private logTestResult(testNumber: number, testName: string, passed: boolean): void {
    const message = `Test ${testNumber} (${testName}): ${passed ? 'PASSED' : 'FAILED'}`;
    console.log(message);
    this.testMessages.push(message);

    if (!passed) {
      this.testPassed = false;
    }
  }

  /**
   * This function is run when the robot is first started up.
   */
  public override async robotInit(): Promise<void> {
    console.log('Simulation test robot initialized!');

    // Start NetworkTables server on port 1738
    await networkTables.startServer(1738);

    // Set initial values for NetworkTables
    this.leftMotorTopic.value = 0;
    this.rightMotorTopic.value = 0;
    this.encoderTopic.value = 0;
    this.limitSwitchTopic.value = false;
    this.potentiometerTopic.value = 0;
    this.robotEnabledTopic.value = false;
    this.robotModeTopic.value = 'Disabled';
    this.testStatusTopic.value = 'Initializing';
    this.testCompleteTopic.value = false;

    // Run all test steps immediately
    setTimeout(() => {
      // Run all test steps
      for (let i = 0; i < this.testSteps.length; i++) {
        const stepResult = this.testSteps[i]();
        if (!stepResult) {
          this.testPassed = false;
        }
      }

      this.currentStep = this.testSteps.length;
      this.testStatusTopic.value = this.testPassed ? 'All tests passed!' : 'Some tests failed!';
      this.testCompleteTopic.value = true;

      // Log the final test results
      console.log('=== Simulation Test Results ===');
      this.testMessages.forEach(message => console.log(message));
      console.log(`Overall result: ${this.testPassed ? 'PASSED' : 'FAILED'}`);
      console.log('==============================');

      // Exit the program after tests complete
      process.exit(this.testPassed ? 0 : 1);
    }, 1000);
  }

  /**
   * This function is called periodically in all robot modes.
   */
  public override robotPeriodic(): void {
    // Update NetworkTables with the current robot state
    this.robotEnabledTopic.value = this.isEnabled();

    if (this.isDisabled()) {
      this.robotModeTopic.value = 'Disabled';
    } else if (this.isAutonomous()) {
      this.robotModeTopic.value = 'Autonomous';
    } else if (this.isTeleop()) {
      this.robotModeTopic.value = 'Teleop';
    } else if (this.isTest()) {
      this.robotModeTopic.value = 'Test';
    }
  }

  /**
   * This function is called periodically when the robot is in test mode.
   */
  public override testPeriodic(): void {
    // Update simulated sensor values based on motor speeds
    const leftSpeed = this.leftMotorSim.getSpeed();
    const rightSpeed = this.rightMotorSim.getSpeed();
    const averageSpeed = (leftSpeed + rightSpeed) / 2;

    // Update encoder count
    const currentCount = this.encoderSim.getCount();
    this.encoderSim.setCount(currentCount + Math.round(averageSpeed * 10));

    // Update limit switch based on encoder count
    this.limitSwitchSim.setValue(currentCount > 500);

    // Update potentiometer based on encoder count (0-5V range)
    this.potentiometerSim.setVoltage(Math.min(5, Math.max(0, currentCount / 100)));

    // Update NetworkTables values
    this.encoderTopic.value = this.encoderSim.getCount();
    this.limitSwitchTopic.value = this.limitSwitchSim.getValue();
    this.potentiometerTopic.value = this.potentiometerSim.getVoltage();
  }
}

// Start the robot program if this file is run directly
if (require.main === module) {
  RobotBase.main(SimulationTestRobot);
}
