import { DriverStation } from './DriverStation';
import { NetworkTableInstance } from 'ntcore-client';
import { simHooks } from './simulation/SimHooks';

/**
 * RobotBase is the base class for all robot programs in TypeScript.
 *
 * This class provides the basic structure for robot programs, including
 * the main entry point and lifecycle methods.
 */
export abstract class RobotBase {
  private static m_robotInitialized = false;
  private static m_robotRunning = false;

  /**
   * Constructor for a generic robot program.
   * User code should be placed in the constructor that runs before the Autonomous or Operator
   * Control period starts. The constructor will run to completion before Autonomous is entered.
   */
  constructor() {
    console.log(`********** Robot program starting **********`);
  }

  /**
   * Determine if the Robot is currently enabled.
   *
   * @return True if the Robot is currently enabled by the field controls.
   */
  public isEnabled(): boolean {
    return DriverStation.getInstance().isEnabled();
  }

  /**
   * Determine if the Robot is currently disabled.
   *
   * @return True if the Robot is currently disabled by the field controls.
   */
  public isDisabled(): boolean {
    return !this.isEnabled();
  }

  /**
   * Determine if the robot is currently in Autonomous mode.
   *
   * @return True if the robot is currently operating Autonomously.
   */
  public isAutonomous(): boolean {
    return DriverStation.getInstance().isAutonomous();
  }

  /**
   * Determine if the robot is currently in Teleop mode.
   *
   * @return True if the robot is currently operating Teleoperatedly.
   */
  public isTeleop(): boolean {
    return DriverStation.getInstance().isTeleop();
  }

  /**
   * Determine if the robot is currently in Test mode.
   *
   * @return True if the robot is currently running tests.
   */
  public isTest(): boolean {
    return DriverStation.getInstance().isTest();
  }

  /**
   * Determine if the robot is currently in Simulation.
   *
   * @return True if the robot is currently running in simulation.
   */
  public isSimulation(): boolean {
    return true; // For now, always return true since we're in TypeScript
  }

  /**
   * Determine if the robot is currently in Real.
   *
   * @return True if the robot is currently running in the real world.
   */
  public isReal(): boolean {
    return false; // For now, always return false since we're in TypeScript
  }

  /**
   * Robot-wide initialization code should go here.
   *
   * This method is called once when the robot is first started up.
   */
  public robotInit(): void {}

  /**
   * Ends the main robot program.
   */
  public endCompetition(): void {
    RobotBase.m_robotRunning = false;
  }

  /**
   * Provide an alternate "main loop" via startCompetition().
   */
  public abstract startCompetition(): void;

  /**
   * Clean up resources used by the robot.
   *
   * This method should be overridden by subclasses to clean up any resources
   * they have allocated.
   */
  public close(): void {}

  /**
   * Start the robot's main loop.
   * This method is called once when the robot is started.
   */
  public start(): void {
    try {
      this.startCompetition();
    } catch (error) {
      console.error('Unhandled exception', error);
      process.exit(-1);
    }
  }

  /**
   * Determine if the robot is running in simulation.
   *
   * @return True if the robot is running in simulation.
   */
  public static isSimulation(): boolean {
    return true; // Always true in TypeScript implementation
  }

  /**
   * Determine if the robot is running in the real world.
   *
   * @return True if the robot is running in the real world.
   */
  public static isReal(): boolean {
    return false; // Always false in TypeScript implementation
  }

  /**
   * Starting point for the robot applications.
   */
  public static main(robotClass: new () => RobotBase): void {
    if (RobotBase.m_robotInitialized) {
      throw new Error("The robot has already been initialized!");
    }

    // Initialize simulation hooks
    simHooks.setProgramStarted();

    // Initialize NetworkTables (don't initialize in tests as they handle it themselves)
    const isNetworkTablesTest = process.argv.some(arg =>
      arg.includes('NetworkTablesTest.ts') ||
      arg.includes('SimulationTest.ts')
    );

    // Use a different port for SimulationExample to avoid conflicts
    const isSimulationExample = process.argv.some(arg =>
      arg.includes('SimulationExample.ts') ||
      arg.includes('SimulationExample')
    );
    const port = isSimulationExample ? 1739 : 1735;

    // Create a NetworkTables instance
    let ntInstance: NetworkTableInstance | null = null;

    if (!isNetworkTablesTest) {
      // Always connect as a client, even in simulation mode
      // In simulation, connect to a server like OutlineViewer
      try {
        ntInstance = NetworkTableInstance.getDefault();
        const clientName = `WPILib-TS-${Date.now()}`;
        ntInstance.startClient4(clientName, 'localhost', port);
        console.log(`Connected to NetworkTables server on port ${port}`);
      } catch (error) {
        console.error("Failed to connect to NetworkTables server:", error);
      }
    }

    RobotBase.m_robotInitialized = true;
    RobotBase.m_robotRunning = true;

    let robot: RobotBase | undefined;
    try {
      robot = new robotClass();

      try {
        robot.startCompetition();
        console.log('********** Robot program startup complete **********');
      } catch (error) {
        console.error("startCompetition() failed", error);
        throw error;
      }
    } catch (error) {
      console.error("Unhandled exception", error);
      throw error;
    } finally {
      if (robot) {
        try {
          robot.close();
          // Disconnect from NetworkTables
          if (ntInstance) {
            try {
              ntInstance.stopClient();
              console.log("Disconnected from NetworkTables server");
            } catch (error) {
              console.error("Failed to disconnect from NetworkTables:", error);
            }
          }
        } catch (error) {
          console.error("Exception during close()", error);
        }
      }
    }
  }
}
