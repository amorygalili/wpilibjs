import { RobotBase } from './RobotBase';
import { Watchdog } from './Watchdog';
import { DriverStation } from './DriverStation';

/**
 * Robot mode enumeration.
 */
export enum Mode {
  kNone,
  kDisabled,
  kAutonomous,
  kTeleop,
  kTest
}

/**
 * IterativeRobotBase implements a specific type of robot program framework, extending the RobotBase
 * class.
 *
 * The IterativeRobotBase class does not implement startCompetition(), so it should not be used
 * by teams directly.
 *
 * This class provides the following functions which are called by the main loop,
 * startCompetition(), at the appropriate times:
 *
 * robotInit() -- provide for initialization at robot power-on
 *
 * driverStationConnected() -- provide for initialization the first time the DS is connected
 *
 * init() functions -- each of the following functions is called once when the appropriate mode
 * is entered:
 *   - disabledInit() -- called each and every time disabled is entered from another mode
 *   - autonomousInit() -- called each and every time autonomous is entered from another mode
 *   - teleopInit() -- called each and every time teleop is entered from another mode
 *   - testInit() -- called each and every time test is entered from another mode
 *
 * periodic() functions -- each of these functions is called on an interval:
 *   - robotPeriodic()
 *   - disabledPeriodic()
 *   - autonomousPeriodic()
 *   - teleopPeriodic()
 *   - testPeriodic()
 *
 * exit() functions -- each of the following functions is called once when the appropriate mode
 * is exited:
 *   - disabledExit() -- called each and every time disabled is exited
 *   - autonomousExit() -- called each and every time autonomous is exited
 *   - teleopExit() -- called each and every time teleop is exited
 *   - testExit() -- called each and every time test is exited
 */
export abstract class IterativeRobotBase extends RobotBase {

  protected m_lastMode: Mode = Mode.kNone;
  protected m_period: number;
  private m_watchdog: Watchdog;
  private m_ntFlushEnabled: boolean = true;
  private m_lwEnabledInTest: boolean = false;
  private m_calledDsConnected: boolean = false;

  // First run flags for the periodic functions
  private m_rpFirstRun: boolean = true;
  private m_spFirstRun: boolean = true;
  private m_dpFirstRun: boolean = true;
  private m_apFirstRun: boolean = true;
  private m_tpFirstRun: boolean = true;
  private m_tmpFirstRun: boolean = true;

  /**
   * Constructor for IterativeRobotBase.
   *
   * @param period Period in seconds.
   */
  constructor(period: number) {
    super();
    this.m_period = period;
    this.m_watchdog = new Watchdog(period, this.printLoopOverrunMessage.bind(this));
  }

  /**
   * Provide an alternate "main loop" via startCompetition().
   */
  public abstract startCompetition(): void;

  /* ----------- Overridable initialization code ----------------- */

  /**
   * Robot-wide initialization code should go here.
   *
   * Users should override this method for default Robot-wide initialization which will be called
   * when the robot is first powered on. It will be called exactly one time.
   *
   * Note: This method is functionally identical to the class constructor so that should be used
   * instead.
   */
  public robotInit(): void {}

  /**
   * Code that needs to know the DS state should go here.
   *
   * Users should override this method for initialization that needs to occur after the DS is
   * connected, such as needing the alliance information.
   */
  public driverStationConnected(): void {}

  /**
   * Robot-wide simulation initialization code should go here.
   *
   * Users should override this method for default Robot-wide simulation related initialization
   * which will be called when the robot is first started. It will be called exactly one time after
   * RobotInit is called only when the robot is in simulation.
   */
  public simulationInit(): void {}

  /**
   * Initialization code for disabled mode should go here.
   *
   * Users should override this method for initialization code which will be called each time the
   * robot enters disabled mode.
   */
  public disabledInit(): void {}

  /**
   * Initialization code for autonomous mode should go here.
   *
   * Users should override this method for initialization code which will be called each time the
   * robot enters autonomous mode.
   */
  public autonomousInit(): void {}

  /**
   * Initialization code for teleop mode should go here.
   *
   * Users should override this method for initialization code which will be called each time the
   * robot enters teleop mode.
   */
  public teleopInit(): void {}

  /**
   * Initialization code for test mode should go here.
   *
   * Users should override this method for initialization code which will be called each time the
   * robot enters test mode.
   */
  public testInit(): void {}

  /* ----------- Overridable periodic code ----------------- */

  /**
   * Periodic code for all robot modes should go here.
   */
  public robotPeriodic(): void {
    if (this.m_rpFirstRun) {
      console.log("Default robotPeriodic() method... Override me!");
      this.m_rpFirstRun = false;
    }
  }

  /**
   * Periodic simulation code should go here.
   *
   * This function is called in a simulated robot after user code executes.
   */
  public simulationPeriodic(): void {
    if (this.m_spFirstRun) {
      console.log("Default simulationPeriodic() method... Override me!");
      this.m_spFirstRun = false;
    }
  }

  /**
   * Periodic code for disabled mode should go here.
   */
  public disabledPeriodic(): void {
    if (this.m_dpFirstRun) {
      console.log("Default disabledPeriodic() method... Override me!");
      this.m_dpFirstRun = false;
    }
  }

  /**
   * Periodic code for autonomous mode should go here.
   */
  public autonomousPeriodic(): void {
    if (this.m_apFirstRun) {
      console.log("Default autonomousPeriodic() method... Override me!");
      this.m_apFirstRun = false;
    }
  }

  /**
   * Periodic code for teleop mode should go here.
   */
  public teleopPeriodic(): void {
    if (this.m_tpFirstRun) {
      console.log("Default teleopPeriodic() method... Override me!");
      this.m_tpFirstRun = false;
    }
  }

  /**
   * Periodic code for test mode should go here.
   */
  public testPeriodic(): void {
    if (this.m_tmpFirstRun) {
      console.log("Default testPeriodic() method... Override me!");
      this.m_tmpFirstRun = false;
    }
  }

  /**
   * Exit code for disabled mode should go here.
   *
   * Users should override this method for code which will be called each time the robot exits
   * disabled mode.
   */
  public disabledExit(): void {}

  /**
   * Exit code for autonomous mode should go here.
   *
   * Users should override this method for code which will be called each time the robot exits
   * autonomous mode.
   */
  public autonomousExit(): void {}

  /**
   * Exit code for teleop mode should go here.
   *
   * Users should override this method for code which will be called each time the robot exits
   * teleop mode.
   */
  public teleopExit(): void {}

  /**
   * Exit code for test mode should go here.
   *
   * Users should override this method for code which will be called each time the robot exits
   * test mode.
   */
  public testExit(): void {}

  /**
   * Enables or disables flushing NetworkTables every loop iteration. By default, this is enabled.
   *
   * @param enabled True to enable, false to disable
   */
  public setNetworkTablesFlushEnabled(enabled: boolean): void {
    this.m_ntFlushEnabled = enabled;
  }

  /**
   * Sets whether LiveWindow operation is enabled during test mode.
   *
   * @param testLW True to enable, false to disable. Defaults to false.
   * @throws Error if this is called during test mode.
   */
  public enableLiveWindowInTest(testLW: boolean): void {
    if (this.isTest()) {
      throw new Error("Can't configure test mode while in test mode!");
    }
    this.m_lwEnabledInTest = testLW;
  }

  /**
   * Whether LiveWindow operation is enabled during test mode.
   *
   * @return whether LiveWindow should be enabled in test mode.
   */
  public isLiveWindowEnabledInTest(): boolean {
    return this.m_lwEnabledInTest;
  }

  /**
   * Gets time period between calls to Periodic() functions.
   *
   * @return The time period between calls to Periodic() functions.
   */
  public getPeriod(): number {
    return this.m_period;
  }

  /**
   * Loop function called by subclasses.
   */
  protected loopFunc(): void {
    DriverStation.getInstance().refreshData();
    this.m_watchdog.reset();

    // Get the robot state from the DriverStation
    const ds = DriverStation.getInstance();
    const isDisabled = ds.isDisabled();
    const isAutonomous = ds.isAutonomous();
    const isTeleop = ds.isTeleop();
    const isTest = ds.isTest();
    const isDSAttached = ds.isDSAttached();
    const isEStopped = ds.isEStopped();

    // If the robot is e-stopped, force it to be disabled
    if (isEStopped && !isDisabled) {
      console.log("Robot is e-stopped! Forcing disabled mode.");
      // Force disabled mode
      ds.setEnabled(false);
    }

    // Get current mode
    let mode = Mode.kNone;
    if (isDisabled) {
      mode = Mode.kDisabled;
    } else if (isAutonomous) {
      mode = Mode.kAutonomous;
    } else if (isTeleop) {
      mode = Mode.kTeleop;
    } else if (isTest) {
      mode = Mode.kTest;
    }

    if (!this.m_calledDsConnected && isDSAttached) {
      this.m_calledDsConnected = true;
      this.driverStationConnected();
    }

    // If mode changed, call mode exit and entry functions
    if (this.m_lastMode !== mode) {
      // Call last mode's exit function
      switch (this.m_lastMode) {
        case Mode.kDisabled:
          this.disabledExit();
          break;
        case Mode.kAutonomous:
          this.autonomousExit();
          break;
        case Mode.kTeleop:
          this.teleopExit();
          break;
        case Mode.kTest:
          if (this.m_lwEnabledInTest) {
            // TODO: Implement LiveWindow.setEnabled(false);
            // TODO: Implement Shuffleboard.disableActuatorWidgets();
          }
          this.testExit();
          break;
        default:
          break;
      }

      // Call current mode's entry function
      switch (mode) {
        case Mode.kDisabled:
          this.disabledInit();
          this.m_watchdog.addEpoch("disabledInit()");
          break;
        case Mode.kAutonomous:
          this.autonomousInit();
          this.m_watchdog.addEpoch("autonomousInit()");
          break;
        case Mode.kTeleop:
          this.teleopInit();
          this.m_watchdog.addEpoch("teleopInit()");
          break;
        case Mode.kTest:
          if (this.m_lwEnabledInTest) {
            // TODO: Implement LiveWindow.setEnabled(true);
            // TODO: Implement Shuffleboard.enableActuatorWidgets();
          }
          this.testInit();
          this.m_watchdog.addEpoch("testInit()");
          break;
        default:
          break;
      }

      this.m_lastMode = mode;
    }

    // Call the appropriate function depending upon the current robot mode
    switch (mode) {
      case Mode.kDisabled:
        DriverStation.observeUserProgramDisabled();
        this.disabledPeriodic();
        this.m_watchdog.addEpoch("disabledPeriodic()");
        break;
      case Mode.kAutonomous:
        DriverStation.observeUserProgramAutonomous();
        this.autonomousPeriodic();
        this.m_watchdog.addEpoch("autonomousPeriodic()");
        break;
      case Mode.kTeleop:
        DriverStation.observeUserProgramTeleop();
        this.teleopPeriodic();
        this.m_watchdog.addEpoch("teleopPeriodic()");
        break;
      case Mode.kTest:
        DriverStation.observeUserProgramTest();
        this.testPeriodic();
        this.m_watchdog.addEpoch("testPeriodic()");
        break;
      default:
        break;
    }

    this.robotPeriodic();
    this.m_watchdog.addEpoch("robotPeriodic()");

    // TODO: Implement SmartDashboard.updateValues();
    this.m_watchdog.addEpoch("SmartDashboard.updateValues()");

    // TODO: Implement LiveWindow.updateValues();
    this.m_watchdog.addEpoch("LiveWindow.updateValues()");

    // TODO: Implement Shuffleboard.update();
    this.m_watchdog.addEpoch("Shuffleboard.update()");

    if (this.isSimulation()) {
      // TODO: Implement HAL.simPeriodicBefore();
      this.simulationPeriodic();
      // TODO: Implement HAL.simPeriodicAfter();
      this.m_watchdog.addEpoch("simulationPeriodic()");
    }

    this.m_watchdog.disable();

    // Flush NetworkTables
    if (this.m_ntFlushEnabled) {
      // TODO: Implement NetworkTableInstance.getDefault().flushLocal();
    }

    // Warn on loop time overruns
    if (this.m_watchdog.isExpired()) {
      this.m_watchdog.printEpochs();
    }
  }

  /**
   * Prints list of epochs added so far and their times.
   */
  public printWatchdogEpochs(): void {
    this.m_watchdog.printEpochs();
  }

  private printLoopOverrunMessage(): void {
    console.warn(`Loop time of ${this.m_period}s overrun`);
  }
}
