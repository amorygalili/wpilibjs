/**
 * Minimal WebSocket server for driver station communication.
 * 
 * This class provides a WebSocket server that can communicate with a driver station client.
 * It handles sending and receiving messages to/from the driver station.
 */
import * as WebSocket from 'ws';
import { EventEmitter } from 'events';

/**
 * Message types for driver station communication.
 */
export enum DSMessageType {
  CONTROL_WORD = 'control_word',
  JOYSTICK_DATA = 'joystick_data',
  MATCH_INFO = 'match_info',
  ROBOT_STATE = 'robot_state',
  PING = 'ping',
  PONG = 'pong'
}

/**
 * Interface for driver station messages.
 */
export interface DSMessage {
  type: DSMessageType;
  data: any;
}

/**
 * WebSocket server for driver station communication.
 * 
 * This class provides a WebSocket server that can communicate with a driver station client.
 * It handles sending and receiving messages to/from the driver station.
 */
export class MinimalDSWebSocketServer extends EventEmitter {
  private static instance: MinimalDSWebSocketServer;
  private server: WebSocket.Server | null = null;
  private clients: Set<WebSocket.WebSocket> = new Set();
  private port: number;
  private isRunning: boolean = false;

  /**
   * Constructor for MinimalDSWebSocketServer.
   * 
   * @param port The port to listen on
   */
  private constructor(port: number = 8085) {
    super();
    this.port = port;
  }

  /**
   * Get an instance of the MinimalDSWebSocketServer.
   * 
   * @param port The port to listen on
   * @return The MinimalDSWebSocketServer instance
   */
  public static getInstance(port: number = 8085): MinimalDSWebSocketServer {
    if (!MinimalDSWebSocketServer.instance) {
      MinimalDSWebSocketServer.instance = new MinimalDSWebSocketServer(port);
    }
    return MinimalDSWebSocketServer.instance;
  }

  /**
   * Start the WebSocket server.
   * 
   * @return True if the server was started successfully
   */
  public start(): boolean {
    if (this.isRunning) {
      return true;
    }

    try {
      this.server = new WebSocket.Server({ port: this.port });
      console.log(`Driver Station WebSocket server started on port ${this.port}`);

      this.server.on('connection', (ws) => {
        console.log('Driver Station client connected');
        this.clients.add(ws);

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString()) as DSMessage;
            this.emit('message', message);
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        });

        ws.on('close', () => {
          console.log('Driver Station client disconnected');
          this.clients.delete(ws);
        });

        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
        });
      });

      this.server.on('error', (error) => {
        console.error('WebSocket server error:', error);
        this.isRunning = false;
        return false;
      });

      this.isRunning = true;
      return true;
    } catch (error) {
      console.error('Error starting WebSocket server:', error);
      this.isRunning = false;
      return false;
    }
  }

  /**
   * Stop the WebSocket server.
   */
  public stop(): void {
    if (!this.isRunning || !this.server) {
      return;
    }

    this.server.close();
    this.server = null;
    this.isRunning = false;
    this.clients.clear();
  }

  /**
   * Send a message to all connected clients.
   * 
   * @param message The message to send
   */
  public sendMessage(message: DSMessage): void {
    if (!this.isRunning) {
      return;
    }

    const messageStr = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(messageStr);
      }
    });
  }

  /**
   * Check if the server is running.
   * 
   * @return True if the server is running
   */
  public isServerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get the port the server is listening on.
   * 
   * @return The port
   */
  public getPort(): number {
    return this.port;
  }
}
