/**
 * WebSocket server for NetworkTables.
 *
 * This class provides a WebSocket server that serves NetworkTables data to clients.
 */
import { EventEmitter } from 'events';
import * as WebSocket from 'ws';
import { NetworkTableInstance, NT4_Topic } from 'ntcore-client';
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
  private _ntInstance: NetworkTableInstance;
  private _topicSubscriptionId: number = -1;
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
    this._ntInstance = NetworkTableInstance.getDefault();

    // Subscribe to all topics
    const client = this._ntInstance.getClient();
    this._topicSubscriptionId = client.subscribe(["/"], true);

    // Set up a callback for new topic data
    const onNewTopicData = (topic: NT4_Topic, _timestamp: number, value: any) => {
      // Find all clients subscribed to this topic
      this._subscriptions.forEach((subs, client) => {
        if (subs.has(topic.name)) {
          this.sendValueChanged(client, topic.name, value);
        }
      });
    };

    // Replace the client's onNewTopicData callback with our own
    (client as any).onNewTopicData = onNewTopicData;
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

      // Clear all topic listeners
      this._topicListeners.clear();

      // Unsubscribe from all topics
      if (this._topicSubscriptionId !== -1) {
        try {
          const client = this._ntInstance.getClient();
          client.unsubscribe(this._topicSubscriptionId);
          this._topicSubscriptionId = -1;
        } catch (e) {
          console.error('Failed to unsubscribe from topics:', e);
        }
      }

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
            // Just remove the listener from our map
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
      // Create a listener for value changes
      const listener = (value: any) => {
        // Send the value to all subscribed clients
        this._subscriptions.forEach((subs, client) => {
          if (subs.has(key)) {
            this.sendValueChanged(client, key, value);
          }
        });
      };

      // Store the listener
      this._topicListeners.set(key, listener);

      // Get the current value
      const table = this._ntInstance.getTable('');
      const entry = table.getEntry(key);
      const currentValue = entry.getValue();

      // Send the current value if it exists
      if (currentValue !== null) {
        this.sendValueChanged(ws, key, currentValue);
      }
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
        // Just remove the listener from our map
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
      // Get the entry for this topic
      const table = this._ntInstance.getTable('');
      const entry = table.getEntry(key);

      // Set the value based on its type
      if (typeof value === 'boolean') {
        entry.setBoolean(value);
      } else if (typeof value === 'number') {
        entry.setDouble(value);
      } else if (typeof value === 'string') {
        entry.setString(value);
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          if (typeof value[0] === 'boolean') {
            entry.setBooleanArray(value as boolean[]);
          } else if (typeof value[0] === 'number') {
            entry.setDoubleArray(value as number[]);
          } else if (typeof value[0] === 'string') {
            entry.setStringArray(value as string[]);
          } else {
            this.sendError(ws, `Unsupported array element type: ${typeof value[0]}`);
            return;
          }
        } else {
          // Empty array, default to number array
          entry.setDoubleArray([]);
        }
      } else {
        this.sendError(ws, `Unsupported value type: ${typeof value}`);
        return;
      }
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
    // Get the list of topics from NetworkTables
    const topics: string[] = [];

    // Get all topics from the NT instance
    const client = this._ntInstance.getClient();

    // Use the client's internal topics map
    const clientTopics = (client as any)._topics as Map<string, NT4_Topic>;

    // Extract the topic names
    clientTopics.forEach((_topic, name) => {
      topics.push(name);
    });

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
