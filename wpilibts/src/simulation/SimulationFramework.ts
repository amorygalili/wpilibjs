/**
 * Simulation framework for WPILib.
 *
 * This framework allows any robot project to be run in simulation.
 */
import { EventEmitter } from 'events';
import { RobotBase } from '../RobotBase';
import { SimHooks } from './SimHooks';
import { NetworkTableInstance } from 'ntcore-client';
import { DriverStation } from '../DriverStation';

/**
 * Simulation framework for WPILib.
 *
 * This framework allows any robot project to be run in simulation.
 */
export class SimulationFramework extends EventEmitter {
  private robotClass: new () => RobotBase;
  private robot: RobotBase | null = null;
  private ntInstance: NetworkTableInstance;
  private running: boolean = false;
  private _lastConnectionState: boolean = false;
  private _connectionCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Create a new simulation framework.
   *
   * @param robotClass The robot class to simulate.
   */
  constructor(robotClass: new () => RobotBase) {
    super();
    this.robotClass = robotClass;

    // Get the default NetworkTables instance
    this.ntInstance = NetworkTableInstance.getDefault();
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

    // Set up a timer to check NetworkTables connection status and emit events
    // We don't initiate the connection here - RobotBase will handle that
    this._connectionCheckInterval = setInterval(() => {
      const isConnected = this.ntInstance.isConnected();
      if (isConnected && !this._lastConnectionState) {
        console.log('Connected to NetworkTables server');
        this.emit('ntConnected');
      } else if (!isConnected && this._lastConnectionState) {
        console.log('Disconnected from NetworkTables server');
        this.emit('ntDisconnected');
      }
      this._lastConnectionState = isConnected;
    }, 1000);

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

    // Clear the connection check interval
    if (this._connectionCheckInterval) {
      clearInterval(this._connectionCheckInterval);
      this._connectionCheckInterval = null;
    }

    // We don't disconnect from NetworkTables here
    // RobotBase will handle the disconnection

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
   * Get the NetworkTables instance.
   *
   * @returns The NetworkTables instance.
   */
  public getNetworkTablesInstance(): NetworkTableInstance {
    return this.ntInstance;
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
    return this.ntInstance.isConnected();
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
