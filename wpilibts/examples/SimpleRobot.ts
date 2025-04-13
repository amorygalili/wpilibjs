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

    // Initialize counters
    this.initCounter = 0;
    this.periodicCounter = 0;

    // Get the default NetworkTables instance
    this.ntInstance = NetworkTableInstance.getDefault();

    // Create a table for robot state
    this.stateTable = this.ntInstance.getTable('RobotState');

    // Create entries for the current state, last state, and counters
    this.currentStateEntry = this.stateTable.getEntry('CurrentState');
    this.lastStateEntry = this.stateTable.getEntry('LastState');
    this.initCountEntry = this.stateTable.getEntry('InitCount');
    this.periodicCountEntry = this.stateTable.getEntry('PeriodicCount');

    // Set up a connection check to initialize NetworkTables when connected
    this.setupNetworkTablesConnection();
  }

  /**
   * Set up a connection check for NetworkTables.
   * This ensures that topics are published and values are set only after connection is established.
   */
  private setupNetworkTablesConnection(): void {
    let connected = false;
    // We're not storing the interval ID because we want it to run for the lifetime of the robot
    setInterval(() => {
      const isConnected = this.ntInstance.isConnected();
      if (isConnected && !connected) {
        connected = true;
        console.log('SimpleRobot: Connected to NetworkTables server!');
        this.initializeNetworkTables();
      } else if (!isConnected && connected) {
        connected = false;
        console.log('SimpleRobot: Disconnected from NetworkTables server!');
      }
    }, 1000);
  }

  /**
   * Initialize NetworkTables topics and set initial values.
   * This is called once when the connection to NetworkTables is established.
   */
  private initializeNetworkTables(): void {
    console.log('SimpleRobot: Initializing NetworkTables topics and values...');

    // Create topics directly
    const currentStateTopic = this.ntInstance.getTopic(this.stateTable.getPath() + '/CurrentState');
    const lastStateTopic = this.ntInstance.getTopic(this.stateTable.getPath() + '/LastState');
    const initCountTopic = this.ntInstance.getTopic(this.stateTable.getPath() + '/InitCount');
    const periodicCountTopic = this.ntInstance.getTopic(this.stateTable.getPath() + '/PeriodicCount');

    // Publish the topics with their types
    currentStateTopic.publish('string');
    lastStateTopic.publish('string');
    initCountTopic.publish('double');
    periodicCountTopic.publish('double');

    // Set initial values
    this.currentStateEntry.setString('Constructor');
    this.lastStateEntry.setString('None');
    this.initCountEntry.setDouble(0);
    this.periodicCountEntry.setDouble(0);

    console.log('SimpleRobot: NetworkTables initialization complete.');
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
    console.log(`SimpleRobot: Updating NetworkTables - LastState: ${lastState} -> ${this.currentStateEntry.getString('Unknown')}`);
    console.log(`SimpleRobot: Updating NetworkTables - CurrentState: ${this.currentStateEntry.getString('Unknown')} -> ${state}`);

    // Force publish the topics if they don't exist
    const currentStateTopic = this.ntInstance.getTopic(this.stateTable.getPath() + '/CurrentState');
    const lastStateTopic = this.ntInstance.getTopic(this.stateTable.getPath() + '/LastState');
    const initCountTopic = this.ntInstance.getTopic(this.stateTable.getPath() + '/InitCount');
    const periodicCountTopic = this.ntInstance.getTopic(this.stateTable.getPath() + '/PeriodicCount');

    if (!currentStateTopic.exists()) {
      console.log(`SimpleRobot: CurrentState topic doesn't exist, publishing it`);
      currentStateTopic.publish('string');
    }

    if (!lastStateTopic.exists()) {
      console.log(`SimpleRobot: LastState topic doesn't exist, publishing it`);
      lastStateTopic.publish('string');
    }

    if (!initCountTopic.exists()) {
      console.log(`SimpleRobot: InitCount topic doesn't exist, publishing it`);
      initCountTopic.publish('double');
    }

    if (!periodicCountTopic.exists()) {
      console.log(`SimpleRobot: PeriodicCount topic doesn't exist, publishing it`);
      periodicCountTopic.publish('double');
    }

    // Set the values
    this.lastStateEntry.setString(lastState);
    this.currentStateEntry.setString(state);

    // Update counters
    if (isInit) {
      this.initCounter++;
      console.log(`SimpleRobot: Updating NetworkTables - InitCount: ${this.initCounter-1} -> ${this.initCounter}`);
      this.initCountEntry.setDouble(this.initCounter);
    }

    if (isPeriodic) {
      this.periodicCounter++;
      console.log(`SimpleRobot: Updating NetworkTables - PeriodicCount: ${this.periodicCounter-1} -> ${this.periodicCounter}`);
      this.periodicCountEntry.setDouble(this.periodicCounter);
    }

    // Force a flush of the NetworkTables values
    try {
      // Get the NT4_Client from the NetworkTableInstance
      const client = (this.ntInstance as any).client;
      if (client) {
        console.log('SimpleRobot: Flushing NetworkTables values');
        client.flushLocal();
      } else {
        console.log('SimpleRobot: No NT4_Client available to flush');
      }
    } catch (error) {
      console.error('SimpleRobot: Error flushing NetworkTables values:', error);
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
