/**
 * Custom RobotBase implementation that allows disabling the NetworkTables server.
 * 
 * This is a modified version of the RobotBase class that allows disabling the
 * NetworkTables server to avoid port conflicts.
 */
import { DriverStation } from '../src/DriverStation';
import { networkTables } from '../src/network/NetworkTablesInterface';
import { simHooks } from '../src/simulation/SimHooks';

/**
 * CustomRobotBase is a modified version of RobotBase that allows disabling the NetworkTables server.
 */
export abstract class CustomRobotBase {
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
   * @return True if the robot is currently operating Teleoperatively.
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
   * Determine if the robot is currently in Simulation mode.
   *
   * @return True if the robot is currently running in simulation.
   */
  public static isSimulation(): boolean {
    return process.env.WPILIB_SIMULATION === 'true';
  }

  /**
   * Determine if the robot is currently in Real mode.
   *
   * @return True if the robot is currently running in the real world.
   */
  public static isReal(): boolean {
    return !CustomRobotBase.isSimulation();
  }

  /**
   * Get the current robot name.
   *
   * @return The current robot name.
   */
  public abstract getRobotName(): string;

  /**
   * Provide an alternate "main loop" via startCompetition().
   */
  public abstract startCompetition(): void;

  /**
   * This hook is called right before startCompetition() is called.
   * By default, it does nothing.
   */
  public robotInit(): void {}

  /**
   * This hook is called right after startCompetition() is called.
   * By default, it does nothing.
   */
  public robotStarted(): void {}

  /**
   * This hook is called right before the robot is disabled.
   * By default, it does nothing.
   */
  public disabledInit(): void {}

  /**
   * This hook is called right before the robot enters autonomous mode.
   * By default, it does nothing.
   */
  public autonomousInit(): void {}

  /**
   * This hook is called right before the robot enters teleop mode.
   * By default, it does nothing.
   */
  public teleopInit(): void {}

  /**
   * This hook is called right before the robot enters test mode.
   * By default, it does nothing.
   */
  public testInit(): void {}

  /**
   * This hook is called periodically while the robot is disabled.
   * By default, it does nothing.
   */
  public disabledPeriodic(): void {}

  /**
   * This hook is called periodically while the robot is in autonomous mode.
   * By default, it does nothing.
   */
  public autonomousPeriodic(): void {}

  /**
   * This hook is called periodically while the robot is in teleop mode.
   * By default, it does nothing.
   */
  public teleopPeriodic(): void {}

  /**
   * This hook is called periodically while the robot is in test mode.
   * By default, it does nothing.
   */
  public testPeriodic(): void {}

  /**
   * This hook is called periodically regardless of mode.
   * By default, it does nothing.
   */
  public robotPeriodic(): void {}

  /**
   * This hook is called right before the robot is shut down.
   * By default, it does nothing.
   */
  public endCompetition(): void {}

  /**
   * Starting point for the robot applications.
   */
  public static main(robotClass: new () => CustomRobotBase, disableNTServer: boolean = false): void {
    if (CustomRobotBase.m_robotInitialized) {
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

    if (!isNetworkTablesTest && !disableNTServer) {
      if (CustomRobotBase.isSimulation()) {
        // Start NetworkTables server in simulation mode
        networkTables.startServer(port).catch(error => {
          console.error("Failed to start NetworkTables server:", error);
        });
      } else {
        // Connect to NetworkTables server in real mode
        networkTables.connectAsClient().catch(error => {
          console.error("Failed to connect to NetworkTables server:", error);
        });
      }
    }

    CustomRobotBase.m_robotInitialized = true;
    CustomRobotBase.m_robotRunning = true;

    let robot: CustomRobotBase | undefined;
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
          robot.endCompetition();
        } catch (error) {
          console.error("endCompetition() failed", error);
        }
      }
      CustomRobotBase.m_robotRunning = false;
    }
  }
}
