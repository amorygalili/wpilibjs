import { EventEmitter } from 'events';
import { NTValue, NTValueType, NTEntryFlags } from '../types/NTTypes';
import { NTInstance } from '../instance/NTInstance';
import { NTConnectionInfo } from '../types/NTTypes';
import { NTClient } from '../client/NTClient';
import { NTServer } from '../server/NTServer';
import { Topic } from './Topic';

/**
 * NetworkTables connection mode
 */
export enum ConnectionMode {
  /** Not connected to NetworkTables */
  Disconnected = 'disconnected',
  /** Connected as a client */
  Client = 'client',
  /** Connected as a server */
  Server = 'server'
}

/**
 * NetworkTables connection options
 */
export interface ConnectionOptions {
  /** Server host (for client mode) */
  host?: string;
  /** Server port */
  port?: number;
  /** Maximum reconnect attempts (0 for unlimited) */
  maxReconnectAttempts?: number;
  /** Reconnect interval (in milliseconds) */
  reconnectInterval?: number;
}

/**
 * Default connection options
 */
const DEFAULT_CONNECTION_OPTIONS: ConnectionOptions = {
  host: 'localhost',
  port: 1735,
  maxReconnectAttempts: 0,
  reconnectInterval: 1000
};

/**
 * NetworkTables API
 *
 * Provides a high-level interface for interacting with NetworkTables
 */
export class NetworkTables extends EventEmitter {
  private _instance: NTInstance;
  private _client: NTClient | null = null;
  private _server: NTServer | null = null;
  private _mode: ConnectionMode = ConnectionMode.Disconnected;
  private _topics: Map<string, Topic<any>> = new Map();
  private _connectionListenerId: number | null = null;
  private _entryListenerId: number | null = null;

  /**
   * Create a new NetworkTables instance
   */
  constructor() {
    super();
    this._instance = new NTInstance();

    // Listen for connection status changes
    this._connectionListenerId = this._instance.addConnectionListener((notification: any) => {
      this.emit('connectionChanged', notification.connected);
    });
  }

  /**
   * Get the current connection mode
   */
  get mode(): ConnectionMode {
    return this._mode;
  }

  /**
   * Get whether NetworkTables is connected
   */
  get connected(): boolean {
    return this._mode !== ConnectionMode.Disconnected;
  }

  /**
   * Connect to a NetworkTables server
   *
   * @param options Connection options
   * @returns Promise that resolves when connected
   */
  async connectAsClient(options: ConnectionOptions = {}): Promise<void> {
    // Disconnect if already connected
    if (this._mode !== ConnectionMode.Disconnected) {
      await this.disconnect();
    }

    // Merge options with defaults
    const mergedOptions = { ...DEFAULT_CONNECTION_OPTIONS, ...options };

    // Create client
    this._client = new NTClient(this._instance, {
      host: mergedOptions.host!,
      port: mergedOptions.port!,
      maxReconnectAttempts: mergedOptions.maxReconnectAttempts,
      reconnectInterval: mergedOptions.reconnectInterval
    });

    // Connect
    await this._client.connect();
    this._mode = ConnectionMode.Client;

    // Set up entry listener to forward updates to the client
    if (this._entryListenerId === null) {
      this._entryListenerId = this._instance.addEntryListener(
        (notification) => {
          if (this._client && notification.name) {
            // Get the entry
            const entry = this._instance.getEntry(notification.name);
            if (entry) {
              // Send the update to the client
              // Use false for notifyListeners to avoid infinite recursion
              this._client.sendValueUpdate(
                notification.name,
                notification.value,
                entry.type,
                notification.flags
              );
            }
          }
        },
        {
          notifyOnUpdate: true,
          notifyOnNew: true,
          notifyOnDelete: false,
          notifyOnFlagsChange: true,
          notifyImmediately: false
        }
      );
    }

    this.emit('connected', this._mode);
  }

  /**
   * Start a NetworkTables server
   *
   * @param options Connection options
   * @returns Promise that resolves when server is started
   */
  async startServer(options: ConnectionOptions = {}): Promise<void> {
    // Disconnect if already connected
    if (this._mode !== ConnectionMode.Disconnected) {
      await this.disconnect();
    }

    // Merge options with defaults
    const mergedOptions = { ...DEFAULT_CONNECTION_OPTIONS, ...options };

    // Create server
    this._server = new NTServer(this._instance, {
      port: mergedOptions.port!
    });

    // Start server
    await this._server.start();
    this._mode = ConnectionMode.Server;

    // Set up entry listener to forward updates to clients
    if (this._entryListenerId === null) {
      this._entryListenerId = this._instance.addEntryListener(
        (notification) => {
          if (this._server && notification.name) {
            // Get the entry
            const entry = this._instance.getEntry(notification.name);
            if (entry) {
              // Send the update to all clients
              // Use false for notifyListeners to avoid infinite recursion
              this._server.broadcastValueUpdate(
                notification.name,
                notification.value,
                entry.type,
                notification.flags
              );
            }
          }
        },
        {
          notifyOnUpdate: true,
          notifyOnNew: true,
          notifyOnDelete: false,
          notifyOnFlagsChange: true,
          notifyImmediately: false
        }
      );
    }

    this.emit('connected', this._mode);
  }

  /**
   * Disconnect from NetworkTables
   *
   * @returns Promise that resolves when disconnected
   */
  async disconnect(): Promise<void> {
    if (this._client) {
      this._client.disconnect();
      this._client = null;
    }

    if (this._server) {
      this._server.stop();
      this._server = null;
    }

    // Remove entry listener
    if (this._entryListenerId !== null) {
      this._instance.removeEntryListener(this._entryListenerId);
      this._entryListenerId = null;
    }

    this._mode = ConnectionMode.Disconnected;
    this.emit('disconnected');
  }

  /**
   * Get a topic by name
   *
   * @param name Topic name
   * @param defaultValue Default value (used to determine type if topic doesn't exist)
   * @returns Topic instance
   */
  getTopic<T extends NTValue>(name: string, defaultValue?: T): Topic<T> {
    // Check if topic already exists
    if (this._topics.has(name)) {
      return this._topics.get(name) as Topic<T>;
    }

    // Create new topic
    const topic = new Topic<T>(this._instance, name, defaultValue as T);
    this._topics.set(name, topic);
    return topic;
  }

  /**
   * Get a boolean topic
   *
   * @param name Topic name
   * @param defaultValue Default value
   * @returns Boolean topic
   */
  getBoolean(name: string, defaultValue: boolean = false): Topic<boolean> {
    return this.getTopic<boolean>(name, defaultValue);
  }

  /**
   * Get a number topic
   *
   * @param name Topic name
   * @param defaultValue Default value
   * @returns Number topic
   */
  getNumber(name: string, defaultValue: number = 0): Topic<number> {
    return this.getTopic<number>(name, defaultValue);
  }

  /**
   * Get a string topic
   *
   * @param name Topic name
   * @param defaultValue Default value
   * @returns String topic
   */
  getString(name: string, defaultValue: string = ''): Topic<string> {
    return this.getTopic<string>(name, defaultValue);
  }

  /**
   * Get a boolean array topic
   *
   * @param name Topic name
   * @param defaultValue Default value
   * @returns Boolean array topic
   */
  getBooleanArray(name: string, defaultValue: boolean[] = []): Topic<boolean[]> {
    return this.getTopic<boolean[]>(name, defaultValue);
  }

  /**
   * Get a number array topic
   *
   * @param name Topic name
   * @param defaultValue Default value
   * @returns Number array topic
   */
  getNumberArray(name: string, defaultValue: number[] = []): Topic<number[]> {
    return this.getTopic<number[]>(name, defaultValue);
  }

  /**
   * Get a string array topic
   *
   * @param name Topic name
   * @param defaultValue Default value
   * @returns String array topic
   */
  getStringArray(name: string, defaultValue: string[] = []): Topic<string[]> {
    return this.getTopic<string[]>(name, defaultValue);
  }

  /**
   * Get a raw topic
   *
   * @param name Topic name
   * @param defaultValue Default value
   * @returns Raw topic
   */
  getRaw(name: string, defaultValue: Uint8Array = new Uint8Array()): Topic<Uint8Array> {
    return this.getTopic<Uint8Array>(name, defaultValue);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Disconnect
    if (this._mode !== ConnectionMode.Disconnected) {
      this.disconnect();
    }

    // Remove listeners
    if (this._connectionListenerId !== null) {
      this._instance.removeConnectionListener(this._connectionListenerId);
      this._connectionListenerId = null;
    }

    if (this._entryListenerId !== null) {
      this._instance.removeEntryListener(this._entryListenerId);
      this._entryListenerId = null;
    }

    // Dispose topics
    this._topics.forEach(topic => topic.dispose());
    this._topics.clear();
  }
}
