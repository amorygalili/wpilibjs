import { EventEmitter } from 'events';
import { DSWebSocketServer, DSMessageType, DSMessage } from './network/DSWebSocketServer';

/**
 * Thread that continuously polls for new data from the driver station.
 *
 * This class is responsible for updating the robot state based on data
 * received from the driver station.
 */
export class DriverStationThread extends EventEmitter {
  private static instance: DriverStationThread;
  private wsServer: DSWebSocketServer;
  private interval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private updatePeriod: number = 20; // 20ms update period (50Hz)

  /**
   * Constructor for DriverStationThread.
   */
  private constructor() {
    super();
    this.wsServer = DSWebSocketServer.getInstance();

    // Set up event listeners for WebSocket messages
    this.wsServer.on('message', (message: DSMessage) => {
      this.handleMessage(message);
    });
  }

  /**
   * Get an instance of the DriverStationThread.
   *
   * @return The DriverStationThread instance
   */
  public static getInstance(): DriverStationThread {
    if (!DriverStationThread.instance) {
      DriverStationThread.instance = new DriverStationThread();
    }
    return DriverStationThread.instance;
  }

  /**
   * Start the driver station thread.
   *
   * @return True if the thread was started successfully
   */
  public start(): boolean {
    if (this.isRunning) {
      return true;
    }

    // Start the WebSocket server
    if (!this.wsServer.isServerRunning()) {
      if (!this.wsServer.start()) {
        return false;
      }
    }

    // Start the update loop
    this.interval = setInterval(() => {
      this.update();
    }, this.updatePeriod);

    this.isRunning = true;
    console.log('Driver Station thread started');
    return true;
  }

  /**
   * Stop the driver station thread.
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    // Stop the update loop
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.isRunning = false;
    console.log('Driver Station thread stopped');
  }

  /**
   * Update the robot state based on driver station data.
   */
  private update(): void {
    // Get the driver station instance
    // We need to import it here to avoid circular dependencies
    const DriverStation = require('./DriverStation').DriverStation;
    const driverStation = DriverStation.getInstance();

    // Refresh the driver station data
    driverStation.refreshData();

    // Send the current robot state to the driver station
    this.wsServer.broadcast({
      type: DSMessageType.ROBOT_STATE,
      data: {
        enabled: driverStation.isEnabled(),
        autonomous: driverStation.isAutonomous(),
        test: driverStation.isTest(),
        estopped: driverStation.isEStopped(),
        dsAttached: driverStation.isDSAttached(),
        fmsAttached: driverStation.isFMSAttached()
      }
    });

    // Emit an update event
    this.emit('update');
  }

  /**
   * Handle a message from the driver station.
   *
   * @param message The message to handle
   */
  private handleMessage(message: DSMessage): void {
    // Get the driver station instance
    // We need to import it here to avoid circular dependencies
    const DriverStation = require('./DriverStation').DriverStation;
    const driverStation = DriverStation.getInstance();

    console.log(`Received message from driver station: ${message.type}`);

    switch (message.type) {
      case DSMessageType.CONTROL_WORD:
        // Update the control word
        console.log(`Control word: enabled=${message.data.enabled}, autonomous=${message.data.autonomous}, test=${message.data.test}, estopped=${message.data.estopped}`);
        driverStation.setEnabled(message.data.enabled);
        driverStation.setAutonomous(message.data.autonomous);
        driverStation.setTest(message.data.test);
        driverStation.setEStopped(message.data.estopped);
        driverStation.setFMSAttached(message.data.fmsAttached);
        driverStation.setDSAttached(message.data.dsAttached);

        // Log the current state after updating
        console.log(`Robot state after update: enabled=${driverStation.isEnabled()}, autonomous=${driverStation.isAutonomous()}, test=${driverStation.isTest()}, estopped=${driverStation.isEStopped()}`);
        break;

      case DSMessageType.JOYSTICK_DATA:
        // Update joystick data
        const { joystickIndex, axes, buttons, povs } = message.data;
        console.log(`Joystick data: index=${joystickIndex}, axes=${JSON.stringify(axes)}, buttons=${JSON.stringify(buttons)}, povs=${povs}`);

        // Update axes
        if (axes) {
          for (const [axisType, value] of Object.entries(axes)) {
            console.log(`Setting joystick axis: index=${joystickIndex}, axis=${axisType}, value=${value}`);
            driverStation.setJoystickAxis(joystickIndex, parseInt(axisType), value as number);
          }
        }

        // Update buttons
        if (buttons) {
          for (const buttonIndex of Object.keys(buttons)) {
            const pressed = buttons[buttonIndex];
            console.log(`Setting joystick button: index=${joystickIndex}, button=${buttonIndex}, pressed=${pressed}`);
            if (pressed) {
              driverStation.setJoystickButton(joystickIndex, parseInt(buttonIndex));
            } else {
              driverStation.clearJoystickButton(joystickIndex, parseInt(buttonIndex));
            }
          }
        }

        // Update POVs
        if (povs !== undefined && povs !== null) {
          try {
            console.log(`Setting joystick POV: index=${joystickIndex}, pov=${povs}`);
            driverStation.setJoystickPOV(joystickIndex, povs);
          } catch (error) {
            console.warn(`Error setting joystick POV: ${error}`);
          }
        }
        break;

      case DSMessageType.MATCH_INFO:
        // Update match info
        driverStation.setMatchInfo(message.data);
        break;

      case DSMessageType.PING:
        // Respond with a pong
        this.wsServer.broadcast({
          type: DSMessageType.PONG,
          data: {
            timestamp: Date.now()
          }
        });
        break;

      default:
        console.warn(`Unknown message type: ${message.type}`);
        break;
    }
  }

  /**
   * Check if the thread is running.
   *
   * @return True if the thread is running
   */
  public isThreadRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Set the update period for the thread.
   *
   * @param period The update period in milliseconds
   */
  public setUpdatePeriod(period: number): void {
    if (period <= 0) {
      throw new Error('Update period must be greater than 0');
    }

    this.updatePeriod = period;

    // Restart the thread if it's running
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Get the update period for the thread.
   *
   * @return The update period in milliseconds
   */
  public getUpdatePeriod(): number {
    return this.updatePeriod;
  }
}
