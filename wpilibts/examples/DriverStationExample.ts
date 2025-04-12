import { TimedRobot, RobotBase, DriverStation, JoystickAxisType } from '../src';

/**
 * A simple example that demonstrates how to use the DriverStation with WebSocket integration.
 */
class DriverStationExample extends TimedRobot {
  private counter: number = 0;

  /**
   * This function is run when the robot is first started up.
   */
  public override robotInit(): void {
    console.log('Robot initialized!');

    // Initialize the driver station communication
    if (DriverStation.initialize()) {
      console.log('Driver Station communication initialized successfully');
      console.log('WebSocket server started on port 5810');
      console.log('Open DriverStationClient.html in a web browser to control the robot');
    } else {
      console.error('Failed to initialize Driver Station communication');
    }

    // Listen for driver station events
    const ds = DriverStation.getInstance();

    ds.on('enabled', () => {
      console.log('Robot enabled');
    });

    ds.on('disabled', () => {
      console.log('Robot disabled');
    });

    ds.on('autonomous', () => {
      console.log('Autonomous mode started');
    });

    ds.on('teleop', () => {
      console.log('Teleop mode started');
    });

    ds.on('test', () => {
      console.log('Test mode started');
    });
  }

  /**
   * This function is called periodically in all robot modes.
   */
  public override robotPeriodic(): void {
    this.counter++;

    // Log robot state every second
    if (this.counter % 50 === 0) {
      const ds = DriverStation.getInstance();
      const x = ds.getStickAxis(0, JoystickAxisType.kX);
      const y = ds.getStickAxis(0, JoystickAxisType.kY);
      console.log(`Robot state: enabled=${ds.isEnabled()}, autonomous=${ds.isAutonomous()}, test=${ds.isTest()}, teleop=${!ds.isAutonomous() && !ds.isTest()}`);
      console.log(`Joystick at (${x.toFixed(2)}, ${y.toFixed(2)})`);
    }
  }



  /**
   * This function is called once when the robot enters disabled mode.
   */
  public override disabledInit(): void {
    console.log('Robot disabled!');
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
    if (this.counter % 50 === 0) {
      const ds = DriverStation.getInstance();
      const x = ds.getStickAxis(0, JoystickAxisType.kX);
      const y = ds.getStickAxis(0, JoystickAxisType.kY);
      console.log(`Autonomous: Joystick at (${x.toFixed(2)}, ${y.toFixed(2)})`);
    }
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
    if (this.counter % 50 === 0) {
      const ds = DriverStation.getInstance();
      const x = ds.getStickAxis(0, JoystickAxisType.kX);
      const y = ds.getStickAxis(0, JoystickAxisType.kY);
      console.log(`Teleop: Joystick at (${x.toFixed(2)}, ${y.toFixed(2)})`);
    }
  }
}

// Start the robot program
if (require.main === module) {
  RobotBase.main(DriverStationExample);
}
