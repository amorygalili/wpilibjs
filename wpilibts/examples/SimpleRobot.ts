/**
 * Simple robot example that logs its state to the console and NetworkTables.
 *
 * This example demonstrates how to use the TimedRobot class and NetworkTables
 * to create a simple robot program that logs its state.
 */

import { TimedRobot } from '../src';
import { NetworkTableInstance, NetworkTable, NetworkTableEntry } from 'ntcore-client';

/**
 * Simple robot example that logs its state to the console and NetworkTables.
 */
export class SimpleRobot extends TimedRobot {
  private ntInstance: NetworkTableInstance;
  private stateTable: NetworkTable;
  private currentStateEntry: NetworkTableEntry;
  private lastStateEntry: NetworkTableEntry;
  private initCountEntry: NetworkTableEntry;
  private periodicCountEntry: NetworkTableEntry;

  private periodicCounter = 0;
  private initCounter = 0;

  /**
   * Constructor for the SimpleRobot.
   */
  constructor() {
    super();
    console.log('SimpleRobot: Constructor called');

    // Get the default NetworkTables instance
    this.ntInstance = NetworkTableInstance.getDefault();

    // Create a table for robot state
    this.stateTable = this.ntInstance.getTable('RobotState');

    // Create entries for the current state, last state, and counters
    this.currentStateEntry = this.stateTable.getEntry('CurrentState');
    this.lastStateEntry = this.stateTable.getEntry('LastState');
    this.initCountEntry = this.stateTable.getEntry('InitCount');
    this.periodicCountEntry = this.stateTable.getEntry('PeriodicCount');

    // Initialize entries with default values
    this.currentStateEntry.setString('Constructor');
    this.lastStateEntry.setString('None');
    this.initCountEntry.setDouble(0);
    this.periodicCountEntry.setDouble(0);
  }

  /**
   * Log the current state to console and NetworkTables.
   *
   * @param state The current state
   * @param isInit Whether this is an init method
   * @param isPeriodic Whether this is a periodic method
   */
  private logState(state: string, isInit = false, isPeriodic = false): void {
    // Log to console
    console.log(`SimpleRobot: ${state}`);

    // Update NetworkTables
    const lastState = this.currentStateEntry.getString('Unknown');
    this.lastStateEntry.setString(lastState);
    this.currentStateEntry.setString(state);

    // Update counters
    if (isInit) {
      this.initCounter++;
      this.initCountEntry.setDouble(this.initCounter);
    }

    if (isPeriodic) {
      this.periodicCounter++;
      this.periodicCountEntry.setDouble(this.periodicCounter);
    }
  }

  /**
   * Robot-wide initialization code should go here.
   *
   * This method is called once when the robot is first started up.
   */
  public override robotInit(): void {
    this.logState('robotInit', true, false);
  }

  /**
   * Robot-wide periodic code should go here.
   *
   * This method is called periodically at a regular rate regardless of mode.
   */
  public override robotPeriodic(): void {
    this.logState('robotPeriodic', false, true);
  }

  /**
   * Initialization code for disabled mode should go here.
   *
   * This method is called once each time the robot enters disabled mode.
   */
  public override disabledInit(): void {
    this.logState('disabledInit', true, false);
  }

  /**
   * Periodic code for disabled mode should go here.
   *
   * This method is called periodically when the robot is in disabled mode.
   */
  public override disabledPeriodic(): void {
    this.logState('disabledPeriodic', false, true);
  }

  /**
   * Initialization code for autonomous mode should go here.
   *
   * This method is called once each time the robot enters autonomous mode.
   */
  public override autonomousInit(): void {
    this.logState('autonomousInit', true, false);
  }

  /**
   * Periodic code for autonomous mode should go here.
   *
   * This method is called periodically when the robot is in autonomous mode.
   */
  public override autonomousPeriodic(): void {
    this.logState('autonomousPeriodic', false, true);
  }

  /**
   * Initialization code for teleop mode should go here.
   *
   * This method is called once each time the robot enters teleop mode.
   */
  public override teleopInit(): void {
    this.logState('teleopInit', true, false);
  }

  /**
   * Periodic code for teleop mode should go here.
   *
   * This method is called periodically when the robot is in teleop mode.
   */
  public override teleopPeriodic(): void {
    this.logState('teleopPeriodic', false, true);
  }

  /**
   * Initialization code for test mode should go here.
   *
   * This method is called once each time the robot enters test mode.
   */
  public override testInit(): void {
    this.logState('testInit', true, false);
  }

  /**
   * Periodic code for test mode should go here.
   *
   * This method is called periodically when the robot is in test mode.
   */
  public override testPeriodic(): void {
    this.logState('testPeriodic', false, true);
  }
}

// Main entry point
// Note: This code will only run when the file is executed directly
// When imported by another module, this code won't execute
// This is the ES module equivalent of the CommonJS require.main === module check
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // This will start the robot program
  console.log('Starting SimpleRobot...');
  SimpleRobot.main(SimpleRobot);
}
