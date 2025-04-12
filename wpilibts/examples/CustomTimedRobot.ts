/**
 * Custom TimedRobot implementation that extends CustomRobotBase.
 *
 * This is a modified version of the TimedRobot class that extends CustomRobotBase
 * to allow disabling the NetworkTables server.
 */
import { CustomRobotBase } from './CustomRobotBase';
import { DriverStation } from '../src/DriverStation';
import { simHooks } from '../src/simulation/SimHooks';

/**
 * TimedRobot options.
 */
export interface TimedRobotOptions {
  /**
   * Period in seconds.
   */
  period?: number;
}

/**
 * CustomTimedRobot implements a specific type of robot program framework, extending the CustomRobotBase class.
 *
 * The CustomTimedRobot class is intended to be subclassed by a user creating a robot program.
 *
 * This class periodically calls the various functions based on the state of the robot.
 * Timing is controlled by the period passed to the constructor.
 */
export class CustomTimedRobot extends CustomRobotBase {
  private static kDefaultPeriod = 0.02;

  private m_period: number;
  private m_watchdog: NodeJS.Timeout | null = null;
  private m_lastTime = 0;
  private m_robotName: string;

  /**
   * Constructor for CustomTimedRobot.
   *
   * @param options The options for the CustomTimedRobot
   */
  constructor(options: TimedRobotOptions = {}) {
    super();
    this.m_period = options.period ?? CustomTimedRobot.kDefaultPeriod;
    this.m_robotName = this.constructor.name;
  }

  /**
   * Get the robot name.
   *
   * @return The robot name
   */
  public getRobotName(): string {
    return this.m_robotName;
  }

  /**
   * Provide an alternate "main loop" via startCompetition().
   */
  public startCompetition(): void {
    this.robotInit();

    // Tell the DS that the robot is ready to be enabled
    DriverStation.observeUserProgramStarting();

    // Loop forever, calling the appropriate mode-dependent function
    this.m_lastTime = Date.now() / 1000;
    this.m_watchdog = setInterval(() => {
      this.loopFunc();
    }, this.m_period * 1000);
  }

  /**
   * End the competition.
   */
  public endCompetition(): void {
    if (this.m_watchdog) {
      clearInterval(this.m_watchdog);
      this.m_watchdog = null;
    }
  }

  /**
   * Get the period of the robot.
   *
   * @return The period of the robot in seconds
   */
  public getPeriod(): number {
    return this.m_period;
  }

  /**
   * The main loop function.
   */
  private loopFunc(): void {
    // Get current time
    const currentTime = Date.now() / 1000;

    // If we're in simulation, we need to update the simulation time
    if (CustomRobotBase.isSimulation()) {
      const deltaTime = currentTime - this.m_lastTime;
      simHooks.stepTiming(deltaTime);
    }

    this.m_lastTime = currentTime;

    // Call the appropriate function depending upon the current robot mode
    if (this.isDisabled()) {
      // Call DisabledInit() if we are now just entering disabled mode from either a different mode
      // or from power-on.
      if (!this.m_lastMode || this.m_lastMode !== 'Disabled') {
        this.disabledInit();
        this.m_lastMode = 'Disabled';
      }

      this.disabledPeriodic();
    } else if (this.isAutonomous()) {
      // Call AutonomousInit() if we are now just entering autonomous mode from either a different
      // mode or from power-on.
      if (!this.m_lastMode || this.m_lastMode !== 'Autonomous') {
        this.autonomousInit();
        this.m_lastMode = 'Autonomous';
      }

      this.autonomousPeriodic();
    } else if (this.isTeleop()) {
      // Call TeleopInit() if we are now just entering teleop mode from either a different mode or
      // from power-on.
      if (!this.m_lastMode || this.m_lastMode !== 'Teleop') {
        this.teleopInit();
        this.m_lastMode = 'Teleop';
      }

      this.teleopPeriodic();
    } else {
      // Call TestInit() if we are now just entering test mode from either a different mode or from
      // power-on.
      if (!this.m_lastMode || this.m_lastMode !== 'Test') {
        this.testInit();
        this.m_lastMode = 'Test';
      }

      this.testPeriodic();
    }

    this.robotPeriodic();
  }

  private m_lastMode: 'Disabled' | 'Autonomous' | 'Teleop' | 'Test' | null = null;
}
