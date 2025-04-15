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
    if (RobotBase.m_robotRunning) {
      console.log('Robot competition ending...');
      RobotBase.m_robotRunning = false;
      RobotBase.cleanup();
    }
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
   * Determine if the robot is currently running.
   *
   * @return True if the robot is currently running.
   */
  public static isRunning(): boolean {
    return RobotBase.m_robotRunning;
  }

  // Static reference to the current robot instance for cleanup
  private static m_currentRobot: RobotBase | undefined;
  private static m_ntInstance: NetworkTableInstance | null = null;

  /**
   * Perform cleanup when the robot is shutting down.
   * This is called by endCompetition() to clean up resources.
   */
  private static cleanup(): void {
    if (RobotBase.m_currentRobot) {
      try {
        RobotBase.m_currentRobot.close();
        // Disconnect from NetworkTables
        if (RobotBase.m_ntInstance) {
          try {
            RobotBase.m_ntInstance.stopClient();
            console.log("Disconnected from NetworkTables server");
          } catch (error) {
            console.error("Failed to disconnect from NetworkTables:", error);
          }
          RobotBase.m_ntInstance = null;
        }
      } catch (error) {
        console.error("Exception during close()", error);
      }
      RobotBase.m_currentRobot = undefined;
    }
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

    // Check if we're in a test environment
    // Tests should set NODE_ENV=test or TEST=true
    // TODO: Implement proper test mocking with Mock Service Worker (MSW) or similar
    // to intercept WebSocket connections and provide mock responses for NetworkTables
    const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.TEST === 'true';

    // Use the standard NT4 port (5810)
    const port = 5810;

    // Create a NetworkTables instance
    if (!isTestEnvironment) {
      // Always connect as a client, even in simulation mode
      // In simulation, connect to a server like OutlineViewer
      try {
        RobotBase.m_ntInstance = NetworkTableInstance.getDefault();

        // Only start a client if we're not already connected
        if (!RobotBase.m_ntInstance.isConnected()) {
          const clientName = `WPILib-TS-${Date.now()}`;
          RobotBase.m_ntInstance.startClient4(clientName, 'localhost', port);
          console.log(`Connected to NetworkTables server on port ${port}`);
        } else {
          console.log(`Using existing NetworkTables connection`);
        }
      } catch (error) {
        console.error("Failed to connect to NetworkTables server:", error);
      }
    }

    RobotBase.m_robotInitialized = true;
    RobotBase.m_robotRunning = true;

    try {
      // Create the robot instance
      const robot = new robotClass();
      RobotBase.m_currentRobot = robot;

      try {
        // Start the robot competition
        robot.startCompetition();
        console.log('********** Robot program startup complete **********');

        // In Java/C++ implementations, startCompetition() is a blocking call that contains
        // a while loop that runs until the robot is shut down. In TypeScript, TimedRobot.startCompetition()
        // calls startTimer() which sets up a non-blocking setInterval() call.
        if (isTestEnvironment) {
          // In test environment, we don't want to block, so we'll clean up immediately
          RobotBase.m_robotRunning = false;
          RobotBase.cleanup();
        } else {
          // For non-test environments, we need to set up a way to clean up when endCompetition is called
          // We'll use the static m_robotRunning flag to track when the robot is done

          // Set up a process.on('exit') handler to ensure cleanup happens when the process exits
          process.on('exit', () => {
            if (RobotBase.m_robotRunning) {
              console.log('Process exiting, cleaning up robot resources...');
              RobotBase.m_robotRunning = false;
              RobotBase.cleanup();
            }
          });

          // Also set up handlers for common termination signals
          process.on('SIGINT', () => {
            console.log('\nReceived SIGINT, shutting down...');
            if (RobotBase.m_robotRunning) {
              RobotBase.m_robotRunning = false;
              RobotBase.cleanup();
              process.exit(0);
            }
          });

          process.on('SIGTERM', () => {
            console.log('\nReceived SIGTERM, shutting down...');
            if (RobotBase.m_robotRunning) {
              RobotBase.m_robotRunning = false;
              RobotBase.cleanup();
              process.exit(0);
            }
          });

          console.log('Robot running. Press Ctrl+C to exit.');
        }
      } catch (error) {
        console.error("startCompetition() failed", error);
        RobotBase.m_robotRunning = false;
        RobotBase.cleanup();
        throw error;
      }
    } catch (error) {
      console.error("Unhandled exception", error);
      RobotBase.m_robotRunning = false;
      throw error;
    }
  }
}
