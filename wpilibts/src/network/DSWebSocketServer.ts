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
export class DSWebSocketServer extends EventEmitter {
  private static instance: DSWebSocketServer;
  private server: WebSocket.Server | null = null;
  private clients: Set<WebSocket> = new Set();
  private port: number;
  private isRunning: boolean = false;

  /**
   * Constructor for DSWebSocketServer.
   * 
   * @param port The port to listen on
   */
  private constructor(port: number = 5810) {
    super();
    this.port = port;
  }

  /**
   * Get an instance of the DSWebSocketServer.
   * 
   * @param port The port to listen on
   * @return The DSWebSocketServer instance
   */
  public static getInstance(port: number = 5810): DSWebSocketServer {
    if (!DSWebSocketServer.instance) {
      DSWebSocketServer.instance = new DSWebSocketServer(port);
    }
    return DSWebSocketServer.instance;
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
      
      this.server.on('connection', (socket: WebSocket) => {
        console.log('Driver Station client connected');
        this.clients.add(socket);
        
        socket.on('message', (message: WebSocket.Data) => {
          try {
            const parsedMessage = JSON.parse(message.toString()) as DSMessage;
            this.emit('message', parsedMessage);
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        });
        
        socket.on('close', () => {
          console.log('Driver Station client disconnected');
          this.clients.delete(socket);
        });
        
        socket.on('error', (error) => {
          console.error('WebSocket error:', error);
          this.clients.delete(socket);
        });
        
        // Send a welcome message
        this.sendToClient(socket, {
          type: DSMessageType.ROBOT_STATE,
          data: {
            connected: true
          }
        });
      });
      
      this.server.on('error', (error) => {
        console.error('WebSocket server error:', error);
        this.stop();
      });
      
      this.isRunning = true;
      console.log(`Driver Station WebSocket server started on port ${this.port}`);
      return true;
    } catch (error) {
      console.error('Error starting WebSocket server:', error);
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

    // Close all client connections
    for (const client of this.clients) {
      client.close();
    }
    this.clients.clear();

    // Close the server
    this.server.close(() => {
      console.log('Driver Station WebSocket server stopped');
    });
    
    this.isRunning = false;
  }

  /**
   * Send a message to all connected clients.
   * 
   * @param message The message to send
   */
  public broadcast(message: DSMessage): void {
    if (!this.isRunning) {
      return;
    }

    const messageString = JSON.stringify(message);
    
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageString);
      }
    }
  }

  /**
   * Send a message to a specific client.
   * 
   * @param client The client to send the message to
   * @param message The message to send
   */
  private sendToClient(client: WebSocket, message: DSMessage): void {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
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
   * Get the number of connected clients.
   * 
   * @return The number of connected clients
   */
  public getClientCount(): number {
    return this.clients.size;
  }
}
