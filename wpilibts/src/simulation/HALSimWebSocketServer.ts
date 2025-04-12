/**
 * WebSocket server for HAL simulation.
 *
 * This class provides a WebSocket server that allows clients to control and monitor
 * the HAL simulation.
 */
import { EventEmitter } from 'events';
import * as WebSocket from 'ws';
import {
  SimHooks,
  DigitalInputSim,
  AnalogInputSim,
  PWMSim,
  EncoderSim
} from './index';

/**
 * Message types for the HALSim WebSocket protocol.
 */
export enum HALSimMessageType {
  /** Set a device value */
  SetDeviceValue = 'setDeviceValue',
  /** Device value changed */
  DeviceValueChanged = 'deviceValueChanged',
  /** List of available devices */
  DevicesList = 'devicesList',
  /** Set simulation timing */
  SetTiming = 'setTiming',
  /** Simulation timing changed */
  TimingChanged = 'timingChanged',
  /** Error message */
  Error = 'error'
}

/**
 * Device types for the HALSim WebSocket protocol.
 */
export enum HALSimDeviceType {
  /** Digital input */
  DigitalInput = 'digitalInput',
  /** Digital output */
  DigitalOutput = 'digitalOutput',
  /** Analog input */
  AnalogInput = 'analogInput',
  /** Analog output */
  AnalogOutput = 'analogOutput',
  /** PWM */
  PWM = 'pwm',
  /** Relay */
  Relay = 'relay',
  /** Encoder */
  Encoder = 'encoder',
  /** Counter */
  Counter = 'counter',
  /** Solenoid */
  Solenoid = 'solenoid',
  /** Compressor */
  Compressor = 'compressor',
  /** Accelerometer */
  Accelerometer = 'accelerometer',
  /** Gyro */
  Gyro = 'gyro'
}

/**
 * Message for the HALSim WebSocket protocol.
 */
export interface HALSimMessage {
  /** Message type */
  type: HALSimMessageType;
  /** Device type */
  deviceType?: HALSimDeviceType;
  /** Device index */
  deviceIndex?: number;
  /** Device property */
  property?: string;
  /** Device value */
  value?: any;
  /** Error message */
  error?: string;
  /** List of devices */
  devices?: {
    type: HALSimDeviceType;
    index: number;
    properties: string[];
  }[];
  /** Timing information */
  timing?: {
    paused?: boolean;
    step?: number;
    restart?: boolean;
  };
}

/**
 * WebSocket server for HAL simulation.
 *
 * This class provides a WebSocket server that allows clients to control and monitor
 * the HAL simulation.
 */
export class HALSimWebSocketServer extends EventEmitter {
  private static instance: HALSimWebSocketServer;
  private _server: WebSocket.Server | null = null;
  private _clients: Set<WebSocket.WebSocket> = new Set();
  private _port: number = 8081;

  // Simulated devices
  private _digitalInputs: Map<number, DigitalInputSim> = new Map();
  private _analogInputs: Map<number, AnalogInputSim> = new Map();
  private _pwms: Map<number, PWMSim> = new Map();
  private _encoders: Map<number, EncoderSim> = new Map();

  /**
   * Get the singleton instance of the HALSimWebSocketServer.
   */
  public static getInstance(): HALSimWebSocketServer {
    if (!HALSimWebSocketServer.instance) {
      HALSimWebSocketServer.instance = new HALSimWebSocketServer();
    }
    return HALSimWebSocketServer.instance;
  }

  private constructor() {
    super();

    // Listen for SimHooks events
    SimHooks.getInstance().on('timingPaused', () => {
      this.broadcastTimingChanged();
    });

    SimHooks.getInstance().on('timingResumed', () => {
      this.broadcastTimingChanged();
    });

    SimHooks.getInstance().on('timingRestarted', () => {
      this.broadcastTimingChanged();
    });

    SimHooks.getInstance().on('timingStepped', () => {
      this.broadcastTimingChanged();
    });
  }

  /**
   * Start the WebSocket server.
   *
   * @param port The port to listen on.
   * @returns A promise that resolves when the server is started.
   */
  public start(port: number = 8081): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this._server) {
        reject(new Error('Server already started'));
        return;
      }

      this._port = port;
      this._server = new WebSocket.Server({ port });

      this._server.on('connection', (ws) => {
        this.handleConnection(ws);
      });

      this._server.on('error', (error) => {
        console.error('HALSim WebSocket server error:', error);
        this.emit('error', error);
        reject(error);
      });

      this._server.on('listening', () => {
        console.log(`HALSim WebSocket server listening on port ${port}`);
        this.emit('listening', port);
        resolve();
      });
    });
  }

  /**
   * Stop the WebSocket server.
   *
   * @returns A promise that resolves when the server is stopped.
   */
  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this._server) {
        resolve();
        return;
      }

      // Close all client connections
      this._clients.forEach((client) => {
        client.close();
      });
      this._clients.clear();

      // Close the server
      this._server.close((error) => {
        if (error) {
          console.error('Error closing HALSim WebSocket server:', error);
          reject(error);
          return;
        }

        this._server = null;
        console.log('HALSim WebSocket server stopped');
        this.emit('stopped');
        resolve();
      });
    });
  }

  /**
   * Handle a new WebSocket connection.
   *
   * @param ws The WebSocket connection.
   */
  private handleConnection(ws: WebSocket.WebSocket): void {
    console.log('Client connected to HALSim WebSocket server');
    this._clients.add(ws);

    // Send the list of available devices
    this.sendDevicesList(ws);

    // Send the current timing state
    this.sendTimingChanged(ws);

    ws.on('message', (data) => {
      this.handleMessage(ws, data);
    });

    ws.on('close', () => {
      this.handleClose(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket client error:', error);
      this.handleClose(ws);
    });
  }

  /**
   * Handle a WebSocket message.
   *
   * @param ws The WebSocket connection.
   * @param data The message data.
   */
  private handleMessage(ws: WebSocket.WebSocket, data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString()) as HALSimMessage;

      switch (message.type) {
        case HALSimMessageType.SetDeviceValue:
          this.handleSetDeviceValue(ws, message);
          break;
        case HALSimMessageType.SetTiming:
          this.handleSetTiming(ws, message);
          break;
        default:
          this.sendError(ws, `Unknown message type: ${message.type}`);
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      this.sendError(ws, `Error handling message: ${error}`);
    }
  }

  /**
   * Handle a WebSocket close event.
   *
   * @param ws The WebSocket connection.
   */
  private handleClose(ws: WebSocket.WebSocket): void {
    console.log('Client disconnected from HALSim WebSocket server');
    this._clients.delete(ws);
  }

  /**
   * Handle a setDeviceValue message.
   *
   * @param ws The WebSocket connection.
   * @param message The message.
   */
  private handleSetDeviceValue(ws: WebSocket.WebSocket, message: HALSimMessage): void {
    if (!message.deviceType) {
      this.sendError(ws, 'Missing deviceType in setDeviceValue message');
      return;
    }

    if (message.deviceIndex === undefined) {
      this.sendError(ws, 'Missing deviceIndex in setDeviceValue message');
      return;
    }

    if (!message.property) {
      this.sendError(ws, 'Missing property in setDeviceValue message');
      return;
    }

    if (message.value === undefined) {
      this.sendError(ws, 'Missing value in setDeviceValue message');
      return;
    }

    const deviceType = message.deviceType;
    const deviceIndex = message.deviceIndex;
    const property = message.property;
    const value = message.value;

    try {
      switch (deviceType) {
        case HALSimDeviceType.DigitalInput:
          this.setDigitalInputValue(deviceIndex, property, value);
          break;
        case HALSimDeviceType.AnalogInput:
          this.setAnalogInputValue(deviceIndex, property, value);
          break;
        case HALSimDeviceType.PWM:
          this.setPWMValue(deviceIndex, property, value);
          break;
        case HALSimDeviceType.Encoder:
          this.setEncoderValue(deviceIndex, property, value);
          break;
        default:
          this.sendError(ws, `Unsupported device type: ${deviceType}`);
          return;
      }

      // Broadcast the device value change to all clients
      this.broadcastDeviceValueChanged(deviceType, deviceIndex, property, value);
    } catch (error) {
      console.error('Error setting device value:', error);
      this.sendError(ws, `Error setting device value: ${error}`);
    }
  }

  /**
   * Handle a setTiming message.
   *
   * @param ws The WebSocket connection.
   * @param message The message.
   */
  private handleSetTiming(ws: WebSocket.WebSocket, message: HALSimMessage): void {
    if (!message.timing) {
      this.sendError(ws, 'Missing timing in setTiming message');
      return;
    }

    const timing = message.timing;
    const simHooks = SimHooks.getInstance();

    try {
      if (timing.paused !== undefined) {
        if (timing.paused) {
          simHooks.pauseTiming();
        } else {
          simHooks.resumeTiming();
        }
      }

      if (timing.step !== undefined) {
        simHooks.stepTiming(timing.step);
      }

      if (timing.restart !== undefined && timing.restart) {
        simHooks.restartTiming();
      }

      // Broadcast the timing change to all clients
      this.broadcastTimingChanged();
    } catch (error) {
      console.error('Error setting timing:', error);
      this.sendError(ws, `Error setting timing: ${error}`);
    }
  }

  /**
   * Set a digital input value.
   *
   * @param index The device index.
   * @param property The device property.
   * @param value The device value.
   */
  private setDigitalInputValue(index: number, property: string, value: any): void {
    // Get or create the digital input
    let digitalInput = this._digitalInputs.get(index);
    if (!digitalInput) {
      digitalInput = new DigitalInputSim(index);
      digitalInput.setInitialized(true);
      this._digitalInputs.set(index, digitalInput);
    }

    // Set the property
    switch (property) {
      case 'value':
        digitalInput.setValue(Boolean(value));
        break;
      default:
        throw new Error(`Unsupported digital input property: ${property}`);
    }
  }

  /**
   * Set an analog input value.
   *
   * @param index The device index.
   * @param property The device property.
   * @param value The device value.
   */
  private setAnalogInputValue(index: number, property: string, value: any): void {
    // Get or create the analog input
    let analogInput = this._analogInputs.get(index);
    if (!analogInput) {
      analogInput = new AnalogInputSim(index);
      analogInput.setInitialized(true);
      this._analogInputs.set(index, analogInput);
    }

    // Set the property
    switch (property) {
      case 'voltage':
        analogInput.setVoltage(Number(value));
        break;
      case 'accumulatorValue':
        analogInput.setAccumulatorValue(BigInt(value));
        break;
      case 'accumulatorCount':
        analogInput.setAccumulatorCount(BigInt(value));
        break;
      case 'accumulatorCenter':
        analogInput.setAccumulatorCenter(Number(value));
        break;
      case 'accumulatorDeadband':
        analogInput.setAccumulatorDeadband(Number(value));
        break;
      default:
        throw new Error(`Unsupported analog input property: ${property}`);
    }
  }

  /**
   * Set a PWM value.
   *
   * @param index The device index.
   * @param property The device property.
   * @param value The device value.
   */
  private setPWMValue(index: number, property: string, value: any): void {
    // Get or create the PWM
    let pwm = this._pwms.get(index);
    if (!pwm) {
      pwm = new PWMSim(index);
      pwm.setInitialized(true);
      this._pwms.set(index, pwm);
    }

    // Set the property
    switch (property) {
      case 'speed':
        pwm.setSpeed(Number(value));
        break;
      case 'position':
        pwm.setPosition(Number(value));
        break;
      case 'rawValue':
        pwm.setRawValue(Number(value));
        break;
      case 'periodScale':
        pwm.setPeriodScale(Number(value));
        break;
      case 'zeroLatch':
        pwm.setZeroLatch(Boolean(value));
        break;
      default:
        throw new Error(`Unsupported PWM property: ${property}`);
    }
  }

  /**
   * Set an encoder value.
   *
   * @param index The device index.
   * @param property The device property.
   * @param value The device value.
   */
  private setEncoderValue(index: number, property: string, value: any): void {
    // Get or create the encoder
    let encoder = this._encoders.get(index);
    if (!encoder) {
      encoder = new EncoderSim(index);
      encoder.setInitialized(true);
      this._encoders.set(index, encoder);
    }

    // Set the property
    switch (property) {
      case 'count':
        encoder.setCount(Number(value));
        break;
      case 'period':
        encoder.setPeriod(Number(value));
        break;
      case 'reset':
        encoder.setReset(Boolean(value));
        break;
      case 'maxPeriod':
        encoder.setMaxPeriod(Number(value));
        break;
      case 'direction':
        encoder.setDirection(Boolean(value));
        break;
      case 'reverseDirection':
        encoder.setReverseDirection(Boolean(value));
        break;
      case 'samplesToAverage':
        encoder.setSamplesToAverage(Number(value));
        break;
      case 'distancePerPulse':
        encoder.setDistancePerPulse(Number(value));
        break;
      default:
        throw new Error(`Unsupported encoder property: ${property}`);
    }
  }

  /**
   * Send a deviceValueChanged message to a client.
   *
   * @param ws The WebSocket connection.
   * @param deviceType The device type.
   * @param deviceIndex The device index.
   * @param property The device property.
   * @param value The device value.
   */
  private sendDeviceValueChanged(ws: WebSocket.WebSocket, deviceType: HALSimDeviceType, deviceIndex: number, property: string, value: any): void {
    const message: HALSimMessage = {
      type: HALSimMessageType.DeviceValueChanged,
      deviceType,
      deviceIndex,
      property,
      value
    };

    this.sendMessage(ws, message);
  }

  /**
   * Broadcast a deviceValueChanged message to all clients.
   *
   * @param deviceType The device type.
   * @param deviceIndex The device index.
   * @param property The device property.
   * @param value The device value.
   */
  private broadcastDeviceValueChanged(deviceType: HALSimDeviceType, deviceIndex: number, property: string, value: any): void {
    this._clients.forEach((client) => {
      this.sendDeviceValueChanged(client, deviceType, deviceIndex, property, value);
    });
  }

  /**
   * Send a timingChanged message to a client.
   *
   * @param ws The WebSocket connection.
   */
  private sendTimingChanged(ws: WebSocket.WebSocket): void {
    const simHooks = SimHooks.getInstance();

    const message: HALSimMessage = {
      type: HALSimMessageType.TimingChanged,
      timing: {
        paused: simHooks.isTimingPaused(),
        step: 0 // We don't track the last step size
      }
    };

    this.sendMessage(ws, message);
  }

  /**
   * Broadcast a timingChanged message to all clients.
   */
  private broadcastTimingChanged(): void {
    this._clients.forEach((client) => {
      this.sendTimingChanged(client);
    });
  }

  /**
   * Send an error message to a client.
   *
   * @param ws The WebSocket connection.
   * @param error The error message.
   */
  private sendError(ws: WebSocket.WebSocket, error: string): void {
    const message: HALSimMessage = {
      type: HALSimMessageType.Error,
      error
    };

    this.sendMessage(ws, message);
  }

  /**
   * Send the list of available devices to a client.
   *
   * @param ws The WebSocket connection.
   */
  private sendDevicesList(ws: WebSocket.WebSocket): void {
    const devices = [
      {
        type: HALSimDeviceType.DigitalInput,
        index: 0,
        properties: ['value']
      },
      {
        type: HALSimDeviceType.AnalogInput,
        index: 0,
        properties: ['voltage', 'accumulatorValue', 'accumulatorCount', 'accumulatorCenter', 'accumulatorDeadband']
      },
      {
        type: HALSimDeviceType.PWM,
        index: 0,
        properties: ['speed', 'position', 'rawValue', 'periodScale', 'zeroLatch']
      },
      {
        type: HALSimDeviceType.PWM,
        index: 1,
        properties: ['speed', 'position', 'rawValue', 'periodScale', 'zeroLatch']
      },
      {
        type: HALSimDeviceType.Encoder,
        index: 0,
        properties: ['count', 'period', 'reset', 'maxPeriod', 'direction', 'reverseDirection', 'samplesToAverage', 'distancePerPulse']
      }
    ];

    const message: HALSimMessage = {
      type: HALSimMessageType.DevicesList,
      devices
    };

    this.sendMessage(ws, message);
  }

  /**
   * Send a message to a client.
   *
   * @param ws The WebSocket connection.
   * @param message The message to send.
   */
  private sendMessage(ws: WebSocket.WebSocket, message: HALSimMessage): void {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Get the port the server is listening on.
   *
   * @returns The port.
   */
  public getPort(): number {
    return this._port;
  }

  /**
   * Check if the server is running.
   *
   * @returns True if the server is running.
   */
  public isRunning(): boolean {
    return this._server !== null;
  }

  /**
   * Get a digital input.
   *
   * @param index The device index.
   * @returns The digital input.
   */
  public getDigitalInput(index: number): DigitalInputSim | undefined {
    return this._digitalInputs.get(index);
  }

  /**
   * Get an analog input.
   *
   * @param index The device index.
   * @returns The analog input.
   */
  public getAnalogInput(index: number): AnalogInputSim | undefined {
    return this._analogInputs.get(index);
  }

  /**
   * Get a PWM.
   *
   * @param index The device index.
   * @returns The PWM.
   */
  public getPWM(index: number): PWMSim | undefined {
    return this._pwms.get(index);
  }

  /**
   * Get an encoder.
   *
   * @param index The device index.
   * @returns The encoder.
   */
  public getEncoder(index: number): EncoderSim | undefined {
    return this._encoders.get(index);
  }
}

// Export singleton instance
export const halSimWebSocketServer = HALSimWebSocketServer.getInstance();
