/**
 * Mock implementation of the NetworkTables API.
 * 
 * This is a simplified version of the NetworkTables API for use in simulation.
 */
import { EventEmitter } from 'events';

/**
 * NetworkTables connection options.
 */
export interface ConnectionOptions {
  host?: string;
  port?: number;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
}

/**
 * NetworkTables server options.
 */
export interface ServerOptions {
  port?: number;
  persistentFilePath?: string;
}

/**
 * NetworkTables connection mode.
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
 * NetworkTables topic.
 */
export class Topic<T> extends EventEmitter {
  private _value: T;
  private _key: string;
  private _nt: NetworkTables;

  /**
   * Constructor.
   * 
   * @param nt The NetworkTables instance.
   * @param key The topic key.
   * @param defaultValue The default value.
   */
  constructor(nt: NetworkTables, key: string, defaultValue: T) {
    super();
    this._nt = nt;
    this._key = key;
    this._value = defaultValue;
  }

  /**
   * Get the topic key.
   */
  get key(): string {
    return this._key;
  }

  /**
   * Get the topic value.
   */
  get value(): T {
    return this._value;
  }

  /**
   * Set the topic value.
   */
  set value(value: T) {
    if (this._value !== value) {
      this._value = value;
      this.emit('valueChanged', value);
      this._nt.emit('valueChanged', this._key, value);
    }
  }
}

/**
 * NetworkTables API.
 */
export class NetworkTables extends EventEmitter {
  private _mode: ConnectionMode = ConnectionMode.Disconnected;
  private _topics: Map<string, Topic<any>> = new Map();

  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * Get the current connection mode.
   */
  get mode(): ConnectionMode {
    return this._mode;
  }

  /**
   * Get whether NetworkTables is connected.
   */
  get connected(): boolean {
    return this._mode !== ConnectionMode.Disconnected;
  }

  /**
   * Connect to a NetworkTables server.
   * 
   * @param options Connection options.
   * @returns Promise that resolves when connected.
   */
  async connectAsClient(options: ConnectionOptions = {}): Promise<void> {
    // Simulate connection
    this._mode = ConnectionMode.Client;
    this.emit('connectionChanged', true);
    return Promise.resolve();
  }

  /**
   * Start a NetworkTables server.
   * 
   * @param options Server options.
   * @returns Promise that resolves when the server is started.
   */
  async startServer(options: ServerOptions = {}): Promise<void> {
    // Simulate server start
    this._mode = ConnectionMode.Server;
    this.emit('connectionChanged', true);
    return Promise.resolve();
  }

  /**
   * Disconnect from NetworkTables.
   * 
   * @returns Promise that resolves when disconnected.
   */
  async disconnect(): Promise<void> {
    // Simulate disconnection
    this._mode = ConnectionMode.Disconnected;
    this.emit('connectionChanged', false);
    return Promise.resolve();
  }

  /**
   * Get a boolean topic.
   * 
   * @param key The topic key.
   * @param defaultValue The default value.
   * @returns The boolean topic.
   */
  getBoolean(key: string, defaultValue: boolean = false): Topic<boolean> {
    if (this._topics.has(key)) {
      return this._topics.get(key) as Topic<boolean>;
    }

    const topic = new Topic<boolean>(this, key, defaultValue);
    this._topics.set(key, topic);
    return topic;
  }

  /**
   * Get a number topic.
   * 
   * @param key The topic key.
   * @param defaultValue The default value.
   * @returns The number topic.
   */
  getNumber(key: string, defaultValue: number = 0): Topic<number> {
    if (this._topics.has(key)) {
      return this._topics.get(key) as Topic<number>;
    }

    const topic = new Topic<number>(this, key, defaultValue);
    this._topics.set(key, topic);
    return topic;
  }

  /**
   * Get a string topic.
   * 
   * @param key The topic key.
   * @param defaultValue The default value.
   * @returns The string topic.
   */
  getString(key: string, defaultValue: string = ''): Topic<string> {
    if (this._topics.has(key)) {
      return this._topics.get(key) as Topic<string>;
    }

    const topic = new Topic<string>(this, key, defaultValue);
    this._topics.set(key, topic);
    return topic;
  }

  /**
   * Get a boolean array topic.
   * 
   * @param key The topic key.
   * @param defaultValue The default value.
   * @returns The boolean array topic.
   */
  getBooleanArray(key: string, defaultValue: boolean[] = []): Topic<boolean[]> {
    if (this._topics.has(key)) {
      return this._topics.get(key) as Topic<boolean[]>;
    }

    const topic = new Topic<boolean[]>(this, key, defaultValue);
    this._topics.set(key, topic);
    return topic;
  }

  /**
   * Get a number array topic.
   * 
   * @param key The topic key.
   * @param defaultValue The default value.
   * @returns The number array topic.
   */
  getNumberArray(key: string, defaultValue: number[] = []): Topic<number[]> {
    if (this._topics.has(key)) {
      return this._topics.get(key) as Topic<number[]>;
    }

    const topic = new Topic<number[]>(this, key, defaultValue);
    this._topics.set(key, topic);
    return topic;
  }

  /**
   * Get a string array topic.
   * 
   * @param key The topic key.
   * @param defaultValue The default value.
   * @returns The string array topic.
   */
  getStringArray(key: string, defaultValue: string[] = []): Topic<string[]> {
    if (this._topics.has(key)) {
      return this._topics.get(key) as Topic<string[]>;
    }

    const topic = new Topic<string[]>(this, key, defaultValue);
    this._topics.set(key, topic);
    return topic;
  }

  /**
   * Dispose of the NetworkTables instance.
   */
  dispose(): void {
    this.disconnect();
    this.removeAllListeners();
    this._topics.clear();
  }
}
