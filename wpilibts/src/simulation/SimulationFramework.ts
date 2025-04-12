/**
 * Simulation framework for WPILib.
 *
 * This framework allows any robot project to be run in simulation.
 */
import { EventEmitter } from 'events';
import { RobotBase } from '../RobotBase';
import { SimHooks } from './SimHooks';
import { NT4Bridge } from '../network/NT4Bridge';
import { NT4Client } from '../network/NT4Client';
import { DriverStation } from '../DriverStation';

/**
 * Simulation framework for WPILib.
 *
 * This framework allows any robot project to be run in simulation.
 */
export class SimulationFramework extends EventEmitter {
  private robotClass: new () => RobotBase;
  private robot: RobotBase | null = null;
  private ntBridge: NT4Bridge;
  private ntClient: NT4Client;
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
    this.ntClient = new NT4Client(ntServerUrl);
    this.ntBridge = new NT4Bridge(this.ntClient);
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
      await this.ntBridge.connect();
      console.log('Connected to NetworkTables server');
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
    this.ntBridge.disconnect();

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
