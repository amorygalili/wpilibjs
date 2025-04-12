/**
 * Simulation Example
 *
 * This example demonstrates how to use the simulation features of WPILib.
 * It creates a simple robot with a drivetrain and some sensors, and shows
 * how to use the simulation classes to simulate the robot's behavior.
 */

import {
  TimedRobot,
  RobotBase,
  DriverStation,
  networkTables,
  SimHooks,
  DigitalInputSim,
  AnalogInputSim,
  PWMSim,
  EncoderSim
} from '../src';

// Import WebSocket directly
import * as WebSocket from 'ws';

/**
 * A simple robot example that demonstrates simulation features.
 */
class SimulationExample extends TimedRobot {
  // Simulated devices
  private leftMotorSim: PWMSim;
  private rightMotorSim: PWMSim;
  private encoderSim: EncoderSim;
  private limitSwitchSim: DigitalInputSim;
  private potentiometerSim: AnalogInputSim;

  // WebSocket servers
  private ntServer: WebSocket.Server | null = null;
  private halSimServer: WebSocket.Server | null = null;
  private ntClients: Set<WebSocket.WebSocket> = new Set();
  private halSimClients: Set<WebSocket.WebSocket> = new Set();

  // NetworkTables topics
  private leftMotorTopic = networkTables.getNumber('Robot/LeftMotor');
  private rightMotorTopic = networkTables.getNumber('Robot/RightMotor');
  private encoderTopic = networkTables.getNumber('Robot/Encoder');
  private limitSwitchTopic = networkTables.getBoolean('Robot/LimitSwitch');
  private potentiometerTopic = networkTables.getNumber('Robot/Potentiometer');
  private robotEnabledTopic = networkTables.getBoolean('Robot/Enabled');
  private robotModeTopic = networkTables.getString('Robot/Mode');

  // Robot state
  private position = 0;
  private velocity = 0;

  /**
   * Constructor
   */
  constructor() {
    super();

    // Initialize simulated devices
    this.leftMotorSim = new PWMSim(0);
    this.rightMotorSim = new PWMSim(1);
    this.encoderSim = new EncoderSim(0);
    this.limitSwitchSim = new DigitalInputSim(0);
    this.potentiometerSim = new AnalogInputSim(0);

    // Initialize the devices
    this.leftMotorSim.setInitialized(true);
    this.rightMotorSim.setInitialized(true);
    this.encoderSim.setInitialized(true);
    this.limitSwitchSim.setInitialized(true);
    this.potentiometerSim.setInitialized(true);
  }

  /**
   * This function is run when the robot is first started up.
   */
  public override robotInit(): void {
    console.log('Robot initialized!');

    // Start the WebSocket servers
    try {
      // Start the NetworkTables WebSocket server on port 8082
      console.log('Starting NetworkTables WebSocket server on port 8082...');
      this.ntServer = new WebSocket.Server({ port: 8082 });
      console.log('NetworkTables WebSocket server started on port 8082');

      // Keep the server alive
      setInterval(() => {
        if (this.ntServer) {
          console.log('NetworkTables WebSocket server is still running');
        }
      }, 5000);

      // Handle NetworkTables WebSocket connections
      this.ntServer.on('connection', (ws) => {
        console.log('Client connected to NetworkTables WebSocket server');
        this.ntClients.add(ws);

        // Send the list of available topics
        this.sendTopicsList(ws);

        // Handle messages from the client
        ws.on('message', (data) => {
          this.handleNTMessage(ws, data);
        });

        // Handle close
        ws.on('close', () => {
          console.log('Client disconnected from NetworkTables WebSocket server');
          this.ntClients.delete(ws);
        });

        // Handle errors
        ws.on('error', (error) => {
          console.error('NetworkTables WebSocket client error:', error);
        });
      });

      // Handle NetworkTables WebSocket server errors
      this.ntServer.on('error', (error) => {
        console.error('NetworkTables WebSocket server error:', error);
      });

      // Start the HALSim WebSocket server on port 8083
      console.log('Starting HALSim WebSocket server on port 8083...');
      this.halSimServer = new WebSocket.Server({ port: 8083 });
      console.log('HALSim WebSocket server started on port 8083');

      // Handle HALSim WebSocket connections
      this.halSimServer.on('connection', (ws) => {
        console.log('Client connected to HALSim WebSocket server');
        this.halSimClients.add(ws);

        // Send the list of available devices
        this.sendDevicesList(ws);

        // Handle messages from the client
        ws.on('message', (data) => {
          this.handleHALSimMessage(ws, data);
        });

        // Handle close
        ws.on('close', () => {
          console.log('Client disconnected from HALSim WebSocket server');
          this.halSimClients.delete(ws);
        });

        // Handle errors
        ws.on('error', (error) => {
          console.error('HALSim WebSocket client error:', error);
        });
      });

      // Handle HALSim WebSocket server errors
      this.halSimServer.on('error', (error) => {
        console.error('HALSim WebSocket server error:', error);
      });
    } catch (error) {
      console.error('Failed to start WebSocket servers:', error);
    }

    // Set initial values for NetworkTables
    this.leftMotorTopic.value = 0;
    this.rightMotorTopic.value = 0;
    this.encoderTopic.value = 0;
    this.limitSwitchTopic.value = false;
    this.potentiometerTopic.value = 0;
    this.robotEnabledTopic.value = false;
    this.robotModeTopic.value = 'Disabled';

    // Listen for changes to the motor values from NetworkTables
    this.leftMotorTopic.on('valueChanged', (value) => {
      this.leftMotorSim.setSpeed(value);
    });

    this.rightMotorTopic.on('valueChanged', (value) => {
      this.rightMotorSim.setSpeed(value);
    });
  }

  /**
   * This function is called periodically in all robot modes.
   */
  public override robotPeriodic(): void {
    // Update NetworkTables with the current robot state
    this.robotEnabledTopic.value = this.isEnabled();

    if (this.isDisabled()) {
      this.robotModeTopic.value = 'Disabled';
    } else if (this.isAutonomous()) {
      this.robotModeTopic.value = 'Autonomous';
    } else if (this.isTeleop()) {
      this.robotModeTopic.value = 'Teleop';
    } else if (this.isTest()) {
      this.robotModeTopic.value = 'Test';
    }

    // Update simulated sensor values
    this.encoderTopic.value = this.encoderSim.getCount();
    this.limitSwitchTopic.value = this.limitSwitchSim.getValue();
    this.potentiometerTopic.value = this.potentiometerSim.getVoltage();
  }

  /**
   * This function is called periodically when the robot is in autonomous mode.
   */
  public override autonomousPeriodic(): void {
    // Simple autonomous mode: drive forward
    this.leftMotorSim.setSpeed(0.5);
    this.rightMotorSim.setSpeed(0.5);
    this.leftMotorTopic.value = 0.5;
    this.rightMotorTopic.value = 0.5;

    // Update simulated encoder
    this.updateSimulation();
  }

  /**
   * This function is called periodically when the robot is in teleop mode.
   */
  public override teleopPeriodic(): void {
    // In teleop mode, the motors are controlled by joysticks
    const ds = DriverStation.getInstance();
    const leftStick = ds.getStickAxis(0, 1); // Left Y axis
    const rightStick = ds.getStickAxis(1, 1); // Right Y axis

    // Set motor speeds based on joystick input
    this.leftMotorSim.setSpeed(-leftStick);
    this.rightMotorSim.setSpeed(-rightStick);
    this.leftMotorTopic.value = -leftStick;
    this.rightMotorTopic.value = -rightStick;

    // Update simulated encoder
    this.updateSimulation();
  }

  /**
   * This function is called periodically when the robot is disabled.
   */
  public override disabledPeriodic(): void {
    // Stop motors when disabled
    this.leftMotorSim.setSpeed(0);
    this.rightMotorSim.setSpeed(0);
    this.leftMotorTopic.value = 0;
    this.rightMotorTopic.value = 0;
  }

  /**
   * Update the simulation based on the current state of the robot.
   */
  private updateSimulation(): void {
    // Calculate new position and velocity based on motor speeds
    const leftSpeed = this.leftMotorSim.getSpeed();
    const rightSpeed = this.rightMotorSim.getSpeed();
    const averageSpeed = (leftSpeed + rightSpeed) / 2;

    // Simple physics model: velocity changes based on motor output
    this.velocity = averageSpeed * 5; // Scale factor for simulation
    this.position += this.velocity * 0.02; // 20ms update rate

    // Update encoder count based on position
    this.encoderSim.setCount(Math.round(this.position * 100)); // Scale factor for encoder counts

    // Update limit switch based on position
    this.limitSwitchSim.setValue(this.position > 10);

    // Update potentiometer based on position (0-5V range)
    this.potentiometerSim.setVoltage(Math.min(5, Math.max(0, this.position / 2)));
  }

  /**
   * This function is called when the robot is being closed.
   */
  public override close(): void {
    // Stop the WebSocket servers
    if (this.ntServer) {
      this.ntServer.close((error) => {
        if (error) {
          console.error('Failed to stop NetworkTables WebSocket server:', error);
        } else {
          console.log('NetworkTables WebSocket server stopped');
        }
      });
      this.ntServer = null;
    }

    if (this.halSimServer) {
      this.halSimServer.close((error) => {
        if (error) {
          console.error('Failed to stop HALSim WebSocket server:', error);
        } else {
          console.log('HALSim WebSocket server stopped');
        }
      });
      this.halSimServer = null;
    }

    super.close();
  }

  /**
   * Send the list of available topics to a client.
   *
   * @param ws The WebSocket connection.
   */
  private sendTopicsList(ws: WebSocket.WebSocket): void {
    // In a real implementation, we would get the list of topics from NetworkTables
    // For now, we'll just send a hardcoded list
    const topics = [
      'Robot/LeftMotor',
      'Robot/RightMotor',
      'Robot/Encoder',
      'Robot/LimitSwitch',
      'Robot/Potentiometer',
      'Robot/Enabled',
      'Robot/Mode'
    ];

    const message = {
      type: 'topicsList',
      topics
    };

    this.sendNTMessage(ws, message);
  }

  /**
   * Send the list of available devices to a client.
   *
   * @param ws The WebSocket connection.
   */
  private sendDevicesList(ws: WebSocket.WebSocket): void {
    const devices = [
      {
        type: 'digitalInput',
        index: 0,
        properties: ['value']
      },
      {
        type: 'analogInput',
        index: 0,
        properties: ['voltage']
      },
      {
        type: 'pwm',
        index: 0,
        properties: ['speed', 'position']
      },
      {
        type: 'pwm',
        index: 1,
        properties: ['speed', 'position']
      },
      {
        type: 'encoder',
        index: 0,
        properties: ['count', 'period', 'direction']
      }
    ];

    const message = {
      type: 'devicesList',
      devices
    };

    this.sendHALSimMessage(ws, message);
  }

  /**
   * Handle a NetworkTables WebSocket message.
   *
   * @param ws The WebSocket connection.
   * @param data The message data.
   */
  private handleNTMessage(ws: WebSocket.WebSocket, data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'subscribe':
          this.handleNTSubscribe(ws, message);
          break;
        case 'unsubscribe':
          this.handleNTUnsubscribe(ws, message);
          break;
        case 'setValue':
          this.handleNTSetValue(ws, message);
          break;
        default:
          this.sendNTError(ws, `Unknown message type: ${message.type}`);
          break;
      }
    } catch (error) {
      console.error('Error handling NetworkTables WebSocket message:', error);
      this.sendNTError(ws, `Error handling message: ${error}`);
    }
  }

  /**
   * Handle a HALSim WebSocket message.
   *
   * @param ws The WebSocket connection.
   * @param data The message data.
   */
  private handleHALSimMessage(ws: WebSocket.WebSocket, data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'setDeviceValue':
          this.handleHALSimSetDeviceValue(ws, message);
          break;
        case 'setTiming':
          this.handleHALSimSetTiming(ws, message);
          break;
        default:
          this.sendHALSimError(ws, `Unknown message type: ${message.type}`);
          break;
      }
    } catch (error) {
      console.error('Error handling HALSim WebSocket message:', error);
      this.sendHALSimError(ws, `Error handling message: ${error}`);
    }
  }

  /**
   * Handle a NetworkTables subscribe message.
   *
   * @param ws The WebSocket connection.
   * @param message The message.
   */
  private handleNTSubscribe(ws: WebSocket.WebSocket, message: any): void {
    if (!message.key) {
      this.sendNTError(ws, 'Missing key in subscribe message');
      return;
    }

    const key = message.key;

    // In a real implementation, we would subscribe to the topic
    // For now, we'll just send the current value
    let value;
    switch (key) {
      case 'Robot/LeftMotor':
        value = this.leftMotorTopic.value;
        break;
      case 'Robot/RightMotor':
        value = this.rightMotorTopic.value;
        break;
      case 'Robot/Encoder':
        value = this.encoderTopic.value;
        break;
      case 'Robot/LimitSwitch':
        value = this.limitSwitchTopic.value;
        break;
      case 'Robot/Potentiometer':
        value = this.potentiometerTopic.value;
        break;
      case 'Robot/Enabled':
        value = this.robotEnabledTopic.value;
        break;
      case 'Robot/Mode':
        value = this.robotModeTopic.value;
        break;
      default:
        value = null;
        break;
    }

    if (value !== null) {
      this.sendNTValueChanged(ws, key, value);
    }
  }

  /**
   * Handle a NetworkTables unsubscribe message.
   *
   * @param ws The WebSocket connection.
   * @param message The message.
   */
  private handleNTUnsubscribe(ws: WebSocket.WebSocket, message: any): void {
    if (!message.key) {
      this.sendNTError(ws, 'Missing key in unsubscribe message');
      return;
    }

    // In a real implementation, we would unsubscribe from the topic
    // For now, we'll just log the unsubscribe
    console.log(`Unsubscribed from topic: ${message.key}`);
  }

  /**
   * Handle a NetworkTables setValue message.
   *
   * @param ws The WebSocket connection.
   * @param message The message.
   */
  private handleNTSetValue(ws: WebSocket.WebSocket, message: any): void {
    if (!message.key) {
      this.sendNTError(ws, 'Missing key in setValue message');
      return;
    }

    if (message.value === undefined) {
      this.sendNTError(ws, 'Missing value in setValue message');
      return;
    }

    const key = message.key;
    const value = message.value;

    // Set the value in NetworkTables
    switch (key) {
      case 'Robot/LeftMotor':
        this.leftMotorTopic.value = value;
        this.leftMotorSim.setSpeed(value);
        break;
      case 'Robot/RightMotor':
        this.rightMotorTopic.value = value;
        this.rightMotorSim.setSpeed(value);
        break;
      case 'Robot/Enabled':
        this.robotEnabledTopic.value = value;
        break;
      case 'Robot/Mode':
        this.robotModeTopic.value = value;
        break;
      default:
        this.sendNTError(ws, `Unknown topic: ${key}`);
        return;
    }

    // Broadcast the value change to all clients
    this.broadcastNTValueChanged(key, value);
  }

  /**
   * Handle a HALSim setDeviceValue message.
   *
   * @param ws The WebSocket connection.
   * @param message The message.
   */
  private handleHALSimSetDeviceValue(ws: WebSocket.WebSocket, message: any): void {
    if (!message.deviceType) {
      this.sendHALSimError(ws, 'Missing deviceType in setDeviceValue message');
      return;
    }

    if (message.deviceIndex === undefined) {
      this.sendHALSimError(ws, 'Missing deviceIndex in setDeviceValue message');
      return;
    }

    if (!message.property) {
      this.sendHALSimError(ws, 'Missing property in setDeviceValue message');
      return;
    }

    if (message.value === undefined) {
      this.sendHALSimError(ws, 'Missing value in setDeviceValue message');
      return;
    }

    const deviceType = message.deviceType;
    const deviceIndex = message.deviceIndex;
    const property = message.property;
    const value = message.value;

    // Set the device value
    switch (deviceType) {
      case 'digitalInput':
        if (deviceIndex === 0 && property === 'value') {
          this.limitSwitchSim.setValue(Boolean(value));
        } else {
          this.sendHALSimError(ws, `Unknown device: ${deviceType}[${deviceIndex}].${property}`);
          return;
        }
        break;
      case 'analogInput':
        if (deviceIndex === 0 && property === 'voltage') {
          this.potentiometerSim.setVoltage(Number(value));
        } else {
          this.sendHALSimError(ws, `Unknown device: ${deviceType}[${deviceIndex}].${property}`);
          return;
        }
        break;
      case 'pwm':
        if (deviceIndex === 0 && property === 'speed') {
          this.leftMotorSim.setSpeed(Number(value));
        } else if (deviceIndex === 1 && property === 'speed') {
          this.rightMotorSim.setSpeed(Number(value));
        } else {
          this.sendHALSimError(ws, `Unknown device: ${deviceType}[${deviceIndex}].${property}`);
          return;
        }
        break;
      case 'encoder':
        if (deviceIndex === 0 && property === 'count') {
          this.encoderSim.setCount(Number(value));
        } else {
          this.sendHALSimError(ws, `Unknown device: ${deviceType}[${deviceIndex}].${property}`);
          return;
        }
        break;
      default:
        this.sendHALSimError(ws, `Unknown device type: ${deviceType}`);
        return;
    }

    // Broadcast the device value change to all clients
    this.broadcastHALSimDeviceValueChanged(deviceType, deviceIndex, property, value);
  }

  /**
   * Handle a HALSim setTiming message.
   *
   * @param ws The WebSocket connection.
   * @param message The message.
   */
  private handleHALSimSetTiming(ws: WebSocket.WebSocket, message: any): void {
    if (!message.timing) {
      this.sendHALSimError(ws, 'Missing timing in setTiming message');
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
      this.broadcastHALSimTimingChanged();
    } catch (error) {
      console.error('Error setting timing:', error);
      this.sendHALSimError(ws, `Error setting timing: ${error}`);
    }
  }

  /**
   * Send a NetworkTables valueChanged message to a client.
   *
   * @param ws The WebSocket connection.
   * @param key The topic key.
   * @param value The topic value.
   */
  private sendNTValueChanged(ws: WebSocket.WebSocket, key: string, value: any): void {
    const message = {
      type: 'valueChanged',
      key,
      value
    };

    this.sendNTMessage(ws, message);
  }

  /**
   * Broadcast a NetworkTables valueChanged message to all clients.
   *
   * @param key The topic key.
   * @param value The topic value.
   */
  private broadcastNTValueChanged(key: string, value: any): void {
    this.ntClients.forEach((client) => {
      this.sendNTValueChanged(client, key, value);
    });
  }

  /**
   * Send a NetworkTables error message to a client.
   *
   * @param ws The WebSocket connection.
   * @param error The error message.
   */
  private sendNTError(ws: WebSocket.WebSocket, error: string): void {
    const message = {
      type: 'error',
      error
    };

    this.sendNTMessage(ws, message);
  }

  /**
   * Send a NetworkTables message to a client.
   *
   * @param ws The WebSocket connection.
   * @param message The message to send.
   */
  private sendNTMessage(ws: WebSocket.WebSocket, message: any): void {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send a HALSim deviceValueChanged message to a client.
   *
   * @param ws The WebSocket connection.
   * @param deviceType The device type.
   * @param deviceIndex The device index.
   * @param property The device property.
   * @param value The device value.
   */
  private sendHALSimDeviceValueChanged(ws: WebSocket.WebSocket, deviceType: string, deviceIndex: number, property: string, value: any): void {
    const message = {
      type: 'deviceValueChanged',
      deviceType,
      deviceIndex,
      property,
      value
    };

    this.sendHALSimMessage(ws, message);
  }

  /**
   * Broadcast a HALSim deviceValueChanged message to all clients.
   *
   * @param deviceType The device type.
   * @param deviceIndex The device index.
   * @param property The device property.
   * @param value The device value.
   */
  private broadcastHALSimDeviceValueChanged(deviceType: string, deviceIndex: number, property: string, value: any): void {
    this.halSimClients.forEach((client) => {
      this.sendHALSimDeviceValueChanged(client, deviceType, deviceIndex, property, value);
    });
  }

  /**
   * Send a HALSim timingChanged message to a client.
   *
   * @param ws The WebSocket connection.
   */
  private sendHALSimTimingChanged(ws: WebSocket.WebSocket): void {
    const simHooks = SimHooks.getInstance();

    const message = {
      type: 'timingChanged',
      timing: {
        paused: simHooks.isTimingPaused()
      }
    };

    this.sendHALSimMessage(ws, message);
  }

  /**
   * Broadcast a HALSim timingChanged message to all clients.
   */
  private broadcastHALSimTimingChanged(): void {
    this.halSimClients.forEach((client) => {
      this.sendHALSimTimingChanged(client);
    });
  }

  /**
   * Send a HALSim error message to a client.
   *
   * @param ws The WebSocket connection.
   * @param error The error message.
   */
  private sendHALSimError(ws: WebSocket.WebSocket, error: string): void {
    const message = {
      type: 'error',
      error
    };

    this.sendHALSimMessage(ws, message);
  }

  /**
   * Send a HALSim message to a client.
   *
   * @param ws The WebSocket connection.
   * @param message The message to send.
   */
  private sendHALSimMessage(ws: WebSocket.WebSocket, message: any): void {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(JSON.stringify(message));
    }
  }
}

// Start the robot program
if (require.main === module) {
  RobotBase.main(SimulationExample);
}
