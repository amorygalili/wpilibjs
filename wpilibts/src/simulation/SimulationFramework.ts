/**
 * Simulation framework for WPILib.
 *
 * This framework allows any robot project to be run in simulation.
 */
import { EventEmitter } from 'events';
import { RobotBase } from '../RobotBase';
import { SimHooks } from './SimHooks';
import { NT4_Client } from 'ntcore-client';
import { DriverStation } from '../DriverStation';

/**
 * Simulation framework for WPILib.
 *
 * This framework allows any robot project to be run in simulation.
 */
export class SimulationFramework extends EventEmitter {
  private robotClass: new () => RobotBase;
  private robot: RobotBase | null = null;
  private ntClient: NT4_Client;
  private running: boolean = false;

  /**
   * Create a new simulation framework.
   *
   * @param robotClass The robot class to simulate.
   * @param ntServerUrl The URL of the NetworkTables server.
   */
  constructor(robotClass: new () => RobotBase, ntServerUrl: string = 'ws://localhost:5810') {
    super();
    this.robotClass = robotClass;
    this.ntClient = new NT4_Client(ntServerUrl, 'WPILib-Simulation',
      () => {}, // onTopicAnnounce
      () => {}, // onTopicUnannounce
      () => {}, // onNewTopicData
      () => {
        console.log('Connected to NetworkTables server');
        this.emit('ntConnected');
      }, // onConnect
      () => {
        console.log('Disconnected from NetworkTables server');
        this.emit('ntDisconnected');
      } // onDisconnect
    );
  }

  /**
   * Start the simulation.
   *
   * @returns A promise that resolves when the simulation is started.
   */
  public async start(): Promise<void> {
    if (this.running) {
      return;
    }

    // Connect to the NetworkTables server
    try {
      this.ntClient.connect();
      console.log('Connecting to NetworkTables server...');
    } catch (error) {
      console.error('Failed to connect to NetworkTables server:', error);
      // Continue without NetworkTables
    }

    // Create robot instance
    // We need to use RobotBase.main to create and start the robot
    RobotBase.main(this.robotClass);

    // Start simulation
    SimHooks.getInstance().resumeTiming();

    this.running = true;
    this.emit('started');
  }

  /**
   * Stop the simulation.
   */
  public stop(): void {
    if (!this.running) {
      return;
    }

    // Stop robot
    if (this.robot) {
      this.robot.endCompetition();
      this.robot = null;
    }

    // Stop simulation
    SimHooks.getInstance().pauseTiming();

    // Disconnect from NetworkTables server
    this.ntClient.disconnect();

    this.running = false;
    this.emit('stopped');
  }

  /**
   * Check if the simulation is running.
   *
   * @returns True if the simulation is running, false otherwise.
   */
  public isRunning(): boolean {
    return this.running;
  }

  /**
   * Set the robot instance.
   *
   * @param robot The robot instance.
   */
  public setRobot(robot: RobotBase): void {
    this.robot = robot;
  }

  /**
   * Get the robot instance.
   *
   * @returns The robot instance.
   */
  public getRobot(): RobotBase | null {
    return this.robot;
  }

  /**
   * Get the robot class.
   *
   * @returns The robot class.
   */
  public getRobotClass(): new () => RobotBase {
    return this.robotClass;
  }

  /**
   * Get the NetworkTables client.
   *
   * @returns The NetworkTables client.
   */
  public getNetworkTablesClient(): NT4_Client {
    return this.ntClient;
  }

  /**
   * Set the enabled state of the robot.
   *
   * @param enabled Whether the robot should be enabled.
   */
  public setEnabled(enabled: boolean): void {
    DriverStation.getInstance().setEnabled(enabled);
  }

  /**
   * Set the autonomous mode of the robot.
   *
   * @param autonomous Whether the robot should be in autonomous mode.
   */
  public setAutonomous(autonomous: boolean): void {
    DriverStation.getInstance().setAutonomous(autonomous);
  }

  /**
   * Set the test mode of the robot.
   *
   * @param test Whether the robot should be in test mode.
   */
  public setTest(test: boolean): void {
    DriverStation.getInstance().setTest(test);
  }

  /**
   * Check if connected to NetworkTables.
   *
   * @returns True if connected to NetworkTables.
   */
  public isConnectedToNetworkTables(): boolean {
    // NT4_Client doesn't have an isConnected method, so we'll check if we have a server time
    return this.ntClient.getServerTime_us() !== null;
  }

  /**
   * Set the joystick values.
   *
   * @param joystickIndex The joystick index.
   * @param axes The joystick axes values.
   * @param buttons The joystick button values.
   * @param povs The joystick POV values.
   */
  public setJoystickValues(joystickIndex: number, axes: number[], buttons: boolean[], povs: number[]): void {
    const ds = DriverStation.getInstance();

    // Set joystick axes
    for (let i = 0; i < axes.length; i++) {
      ds.setJoystickAxis(joystickIndex, i, axes[i]);
    }

    // Set joystick buttons
    for (let i = 0; i < buttons.length; i++) {
      if (buttons[i]) {
        ds.setJoystickButton(joystickIndex, i + 1, true);
      } else {
        ds.setJoystickButton(joystickIndex, i + 1, false);
      }
    }

    // Set joystick POVs
    if (povs.length > 0) {
      ds.setJoystickPOV(joystickIndex, 0, povs[0]);
    }
  }
}

// No need to export here, it's already exported by the class declaration
