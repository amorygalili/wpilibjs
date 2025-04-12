/**
 * WebSocket server for NetworkTables.
 *
 * This class provides a WebSocket server that serves NetworkTables data to clients.
 */
import { EventEmitter } from 'events';
import * as WebSocket from 'ws';
import { networkTables } from './NetworkTablesInterface';

/**
 * Message types for the NetworkTables WebSocket protocol.
 */
export enum NTMessageType {
  /** Subscribe to a topic */
  Subscribe = 'subscribe',
  /** Unsubscribe from a topic */
  Unsubscribe = 'unsubscribe',
  /** Set a topic value */
  SetValue = 'setValue',
  /** Topic value changed */
  ValueChanged = 'valueChanged',
  /** List of available topics */
  TopicsList = 'topicsList',
  /** Error message */
  Error = 'error'
}

/**
 * Message for the NetworkTables WebSocket protocol.
 */
export interface NTMessage {
  /** Message type */
  type: NTMessageType;
  /** Topic key */
  key?: string;
  /** Topic value */
  value?: any;
  /** Error message */
  error?: string;
  /** List of topics */
  topics?: string[];
}

/**
 * WebSocket server for NetworkTables.
 *
 * This class provides a WebSocket server that serves NetworkTables data to clients.
 */
export class NetworkTablesWebSocketServer extends EventEmitter {
  private static instance: NetworkTablesWebSocketServer;
  private _server: WebSocket.Server | null = null;
  private _clients: Set<WebSocket.WebSocket> = new Set();
  private _subscriptions: Map<WebSocket.WebSocket, Set<string>> = new Map();
  private _topicListeners: Map<string, (value: any) => void> = new Map();
  private _port: number = 8080;

  /**
   * Get the singleton instance of the NetworkTablesWebSocketServer.
   */
  public static getInstance(): NetworkTablesWebSocketServer {
    if (!NetworkTablesWebSocketServer.instance) {
      NetworkTablesWebSocketServer.instance = new NetworkTablesWebSocketServer();
    }
    return NetworkTablesWebSocketServer.instance;
  }

  private constructor() {
    super();
  }

  /**
   * Start the WebSocket server.
   *
   * @param port The port to listen on.
   * @returns A promise that resolves when the server is started.
   */
  public start(port: number = 8080): Promise<void> {
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
        console.error('WebSocket server error:', error);
        this.emit('error', error);
        reject(error);
      });

      this._server.on('listening', () => {
        console.log(`NetworkTables WebSocket server listening on port ${port}`);
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

      // Remove all topic listeners
      this._topicListeners.forEach((listener, key) => {
        const topic = networkTables.getBoolean(key);
        topic.off('valueChanged', listener);
      });
      this._topicListeners.clear();

      // Close all client connections
      this._clients.forEach((client) => {
        client.close();
      });
      this._clients.clear();
      this._subscriptions.clear();

      // Close the server
      this._server.close((error) => {
        if (error) {
          console.error('Error closing WebSocket server:', error);
          reject(error);
          return;
        }

        this._server = null;
        console.log('NetworkTables WebSocket server stopped');
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
    console.log('Client connected to NetworkTables WebSocket server');
    this._clients.add(ws);
    this._subscriptions.set(ws, new Set());

    // Send the list of available topics
    this.sendTopicsList(ws);

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
      const message = JSON.parse(data.toString()) as NTMessage;

      switch (message.type) {
        case NTMessageType.Subscribe:
          this.handleSubscribe(ws, message);
          break;
        case NTMessageType.Unsubscribe:
          this.handleUnsubscribe(ws, message);
          break;
        case NTMessageType.SetValue:
          this.handleSetValue(ws, message);
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
    console.log('Client disconnected from NetworkTables WebSocket server');

    // Remove all subscriptions for this client
    const subscriptions = this._subscriptions.get(ws);
    if (subscriptions) {
      subscriptions.forEach((key) => {
        // Check if any other clients are subscribed to this topic
        let hasOtherSubscribers = false;
        this._subscriptions.forEach((subs, client) => {
          if (client !== ws && subs.has(key)) {
            hasOtherSubscribers = true;
          }
        });

        // If no other clients are subscribed, remove the listener
        if (!hasOtherSubscribers) {
          const listener = this._topicListeners.get(key);
          if (listener) {
            const topic = networkTables.getBoolean(key);
            topic.off('valueChanged', listener);
            this._topicListeners.delete(key);
          }
        }
      });
    }

    this._subscriptions.delete(ws);
    this._clients.delete(ws);
  }

  /**
   * Handle a subscribe message.
   *
   * @param ws The WebSocket connection.
   * @param message The message.
   */
  private handleSubscribe(ws: WebSocket.WebSocket, message: NTMessage): void {
    if (!message.key) {
      this.sendError(ws, 'Missing key in subscribe message');
      return;
    }

    const key = message.key;
    const subscriptions = this._subscriptions.get(ws);
    if (!subscriptions) {
      return;
    }

    // Add the subscription
    subscriptions.add(key);

    // Add a listener for this topic if we don't already have one
    if (!this._topicListeners.has(key)) {
      // Get the topic (we'll use getBoolean as a default, but it doesn't matter for the listener)
      const topic = networkTables.getBoolean(key);

      // Create a listener for value changes
      const listener = (value: any) => {
        // Send the value to all subscribed clients
        this._subscriptions.forEach((subs, client) => {
          if (subs.has(key)) {
            this.sendValueChanged(client, key, value);
          }
        });
      };

      // Add the listener
      topic.on('valueChanged', listener);
      this._topicListeners.set(key, listener);

      // Send the current value
      this.sendValueChanged(ws, key, topic.value);
    }
  }

  /**
   * Handle an unsubscribe message.
   *
   * @param ws The WebSocket connection.
   * @param message The message.
   */
  private handleUnsubscribe(ws: WebSocket.WebSocket, message: NTMessage): void {
    if (!message.key) {
      this.sendError(ws, 'Missing key in unsubscribe message');
      return;
    }

    const key = message.key;
    const subscriptions = this._subscriptions.get(ws);
    if (!subscriptions) {
      return;
    }

    // Remove the subscription
    subscriptions.delete(key);

    // Check if any other clients are subscribed to this topic
    let hasOtherSubscribers = false;
    this._subscriptions.forEach((subs, client) => {
      if (client !== ws && subs.has(key)) {
        hasOtherSubscribers = true;
      }
    });

    // If no other clients are subscribed, remove the listener
    if (!hasOtherSubscribers) {
      const listener = this._topicListeners.get(key);
      if (listener) {
        const topic = networkTables.getBoolean(key);
        topic.off('valueChanged', listener);
        this._topicListeners.delete(key);
      }
    }
  }

  /**
   * Handle a setValue message.
   *
   * @param ws The WebSocket connection.
   * @param message The message.
   */
  private handleSetValue(ws: WebSocket.WebSocket, message: NTMessage): void {
    if (!message.key) {
      this.sendError(ws, 'Missing key in setValue message');
      return;
    }

    if (message.value === undefined) {
      this.sendError(ws, 'Missing value in setValue message');
      return;
    }

    const key = message.key;
    const value = message.value;

    // Set the value in NetworkTables
    try {
      // Determine the type of the value and get the appropriate topic
      let topic;
      if (typeof value === 'boolean') {
        topic = networkTables.getBoolean(key);
      } else if (typeof value === 'number') {
        topic = networkTables.getNumber(key);
      } else if (typeof value === 'string') {
        topic = networkTables.getString(key);
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          if (typeof value[0] === 'boolean') {
            topic = networkTables.getBooleanArray(key);
          } else if (typeof value[0] === 'number') {
            topic = networkTables.getNumberArray(key);
          } else if (typeof value[0] === 'string') {
            topic = networkTables.getStringArray(key);
          } else {
            this.sendError(ws, `Unsupported array element type: ${typeof value[0]}`);
            return;
          }
        } else {
          // Empty array, default to number array
          topic = networkTables.getNumberArray(key);
        }
      } else {
        this.sendError(ws, `Unsupported value type: ${typeof value}`);
        return;
      }

      // Set the value
      topic.value = value;
    } catch (error) {
      console.error('Error setting NetworkTables value:', error);
      this.sendError(ws, `Error setting value: ${error}`);
    }
  }

  /**
   * Send a valueChanged message to a client.
   *
   * @param ws The WebSocket connection.
   * @param key The topic key.
   * @param value The topic value.
   */
  private sendValueChanged(ws: WebSocket.WebSocket, key: string, value: any): void {
    const message: NTMessage = {
      type: NTMessageType.ValueChanged,
      key,
      value
    };

    this.sendMessage(ws, message);
  }

  /**
   * Send an error message to a client.
   *
   * @param ws The WebSocket connection.
   * @param error The error message.
   */
  private sendError(ws: WebSocket.WebSocket, error: string): void {
    const message: NTMessage = {
      type: NTMessageType.Error,
      error
    };

    this.sendMessage(ws, message);
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

    const message: NTMessage = {
      type: NTMessageType.TopicsList,
      topics
    };

    this.sendMessage(ws, message);
  }

  /**
   * Send a message to a client.
   *
   * @param ws The WebSocket connection.
   * @param message The message to send.
   */
  private sendMessage(ws: WebSocket.WebSocket, message: NTMessage): void {
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
}

// Export singleton instance
export const ntWebSocketServer = NetworkTablesWebSocketServer.getInstance();
