/**
 * WebSocket server implementation
 */

import * as WebSocket from 'ws';
import { HALSimulator } from '../HALSimulator';
import { WSMessage } from './WSMessageTypes';

/**
 * WebSocket server options
 */
export interface WSServerOptions {
  port?: number;
  host?: string;
  path?: string;
}

/**
 * WebSocket server for HAL simulation
 */
export class WSServer {
  private readonly hal: HALSimulator;
  private readonly options: WSServerOptions;
  private server: WebSocket.Server | null = null;
  private clients: Set<WebSocket.WebSocket> = new Set();

  /**
   * Create a new WebSocket server
   * @param hal HAL simulator instance
   * @param options Server options
   */
  constructor(hal: HALSimulator, options: WSServerOptions = {}) {
    this.hal = hal;
    this.options = {
      port: options.port || 3300,
      host: options.host || 'localhost',
      path: options.path || '/wpilibws'
    };
  }

  /**
   * Start the WebSocket server
   */
  start(): void {
    if (this.server) {
      return;
    }

    this.server = new WebSocket.Server({
      port: this.options.port,
      host: this.options.host,
      path: this.options.path
    });

    console.log(`WebSocket server started on ws://${this.options.host}:${this.options.port}${this.options.path}`);

    this.server.on('connection', (socket) => {
      console.log('Client connected');
      this.clients.add(socket);

      // Set up event handlers
      socket.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString()) as WSMessage;
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      socket.on('close', () => {
        console.log('Client disconnected');
        this.clients.delete(socket);
      });

      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(socket);
      });

      // Send initial state
      this.sendInitialState(socket);
    });

    this.server.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });

    // Set up HAL callbacks
    this.setupHALCallbacks();
  }

  /**
   * Stop the WebSocket server
   */
  stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
      this.clients.clear();
      console.log('WebSocket server stopped');
    }
  }

  /**
   * Handle an incoming message
   * @param message WebSocket message
   */
  private handleMessage(message: WSMessage): void {
    console.log('Received message:', message);

    switch (message.type) {
      case 'DIO':
        this.handleDIOMessage(message);
        break;
      case 'PWM':
        this.handlePWMMessage(message);
        break;
      case 'AI':
        this.handleAnalogInputMessage(message);
        break;
      case 'Encoder':
        this.handleEncoderMessage(message);
        break;
      case 'HAL':
        this.handleHALMessage(message);
        break;
      default:
        console.warn('Unhandled message type:', message.type);
    }
  }

  /**
   * Handle a DIO message
   * @param message DIO message
   */
  private handleDIOMessage(message: WSMessage): void {
    const channel = parseInt(message.device, 10);
    if (isNaN(channel)) {
      console.error('Invalid DIO channel:', message.device);
      return;
    }

    const dio = this.hal.getDigitalInput(channel);
    if (!dio) {
      console.error('DIO not found for channel:', channel);
      return;
    }

    const data = message.data;
    if ('>value' in data) {
      dio.setValue(data['>value'] as boolean);
    }
  }

  /**
   * Handle a PWM message
   * @param message PWM message
   */
  private handlePWMMessage(message: WSMessage): void {
    const channel = parseInt(message.device, 10);
    if (isNaN(channel)) {
      console.error('Invalid PWM channel:', message.device);
      return;
    }

    const pwm = this.hal.getPWM(channel);
    if (!pwm) {
      console.error('PWM not found for channel:', channel);
      return;
    }

    const data = message.data;
    if ('<speed' in data) {
      pwm.setSpeed(data['<speed'] as number);
    }
    if ('<position' in data) {
      pwm.setPosition(data['<position'] as number);
    }
  }

  /**
   * Handle an Analog Input message
   * @param message Analog Input message
   */
  private handleAnalogInputMessage(message: WSMessage): void {
    const channel = parseInt(message.device, 10);
    if (isNaN(channel)) {
      console.error('Invalid Analog Input channel:', message.device);
      return;
    }

    const ai = this.hal.getAnalogInput(channel);
    if (!ai) {
      console.error('Analog Input not found for channel:', channel);
      return;
    }

    const data = message.data;
    if ('>voltage' in data) {
      ai.setVoltage(data['>voltage'] as number);
    }
  }

  /**
   * Handle an Encoder message
   * @param message Encoder message
   */
  private handleEncoderMessage(message: WSMessage): void {
    const index = parseInt(message.device, 10);
    if (isNaN(index)) {
      console.error('Invalid Encoder index:', message.device);
      return;
    }

    const encoder = this.hal.getEncoder(index);
    if (!encoder) {
      console.error('Encoder not found for index:', index);
      return;
    }

    const data = message.data;
    if ('>count' in data) {
      encoder.setCount(data['>count'] as number);
    }
    if ('>period' in data) {
      encoder.setPeriod(data['>period'] as number);
    }
    if ('>direction' in data) {
      encoder.setDirection(data['>direction'] as boolean);
    }
  }

  /**
   * Handle a HAL message
   * @param message HAL message
   */
  private handleHALMessage(message: WSMessage): void {
    // Handle HAL messages if needed
  }

  /**
   * Send a message to all connected clients
   * @param message Message to send
   */
  private broadcast(message: WSMessage): void {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  /**
   * Send initial state to a client
   * @param client WebSocket client
   */
  private sendInitialState(client: WebSocket.WebSocket): void {
    // Send initial state of all devices
    // This is a simplified example - you would need to iterate through all devices
    
    // Send DIO states
    for (let i = 0; i < this.hal.getDigitalInputCount(); i++) {
      const dio = this.hal.getDigitalInput(i);
      if (dio && dio.getInitialized()) {
        const message: WSMessage = {
          type: 'DIO',
          device: i.toString(),
          data: {
            '<init': dio.getInitialized(),
            '<>value': dio.getValue(),
            '<is_input': dio.getIsInput()
          }
        };
        client.send(JSON.stringify(message));
      }
    }

    // Send PWM states
    for (let i = 0; i < this.hal.getPWMCount(); i++) {
      const pwm = this.hal.getPWM(i);
      if (pwm && pwm.getInitialized()) {
        const message: WSMessage = {
          type: 'PWM',
          device: i.toString(),
          data: {
            '<init': pwm.getInitialized(),
            '<speed': pwm.getSpeed(),
            '<position': pwm.getPosition()
          }
        };
        client.send(JSON.stringify(message));
      }
    }

    // Send Analog Input states
    for (let i = 0; i < this.hal.getAnalogInputCount(); i++) {
      const ai = this.hal.getAnalogInput(i);
      if (ai && ai.getInitialized()) {
        const message: WSMessage = {
          type: 'AI',
          device: i.toString(),
          data: {
            '<init': ai.getInitialized(),
            '>voltage': ai.getVoltage()
          }
        };
        client.send(JSON.stringify(message));
      }
    }

    // Send Encoder states
    for (let i = 0; i < this.hal.getEncoderCount(); i++) {
      const encoder = this.hal.getEncoder(i);
      if (encoder && encoder.getInitialized()) {
        const message: WSMessage = {
          type: 'Encoder',
          device: i.toString(),
          data: {
            '<init': encoder.getInitialized(),
            '<channel_a': encoder.getDigitalChannelA(),
            '<channel_b': encoder.getDigitalChannelB(),
            '>count': encoder.getCount(),
            '>period': encoder.getPeriod(),
            '>direction': encoder.getDirection()
          }
        };
        client.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Set up HAL callbacks
   */
  private setupHALCallbacks(): void {
    // Set up callbacks for all devices to broadcast changes
    
    // Example for DIO
    for (let i = 0; i < this.hal.getDigitalInputCount(); i++) {
      const dio = this.hal.getDigitalInput(i);
      if (dio) {
        dio.registerValueCallback((name, param, value) => {
          const message: WSMessage = {
            type: 'DIO',
            device: i.toString(),
            data: {
              '<>value': value.data as boolean
            }
          };
          this.broadcast(message);
        }, null, false);
      }
    }

    // Example for PWM
    for (let i = 0; i < this.hal.getPWMCount(); i++) {
      const pwm = this.hal.getPWM(i);
      if (pwm) {
        pwm.registerSpeedCallback((name, param, value) => {
          const message: WSMessage = {
            type: 'PWM',
            device: i.toString(),
            data: {
              '<speed': value.data as number
            }
          };
          this.broadcast(message);
        }, null, false);
      }
    }

    // Similar callbacks would be set up for other device types
  }
}
