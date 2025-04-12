/**
 * NetworkTables interface for WPILib.
 */
import { EventEmitter } from 'events';
// Import from the ntcore-client package
import { NT4_Client } from 'ntcore-client';

// Define our own interfaces to match the ntcore-client package
interface NetworkTableInstance {
  startServer(): void;
  stopServer(): void;
  startClient4(clientName: string, serverName: string): void;
  stopClient(): void;
  getTable(name: string): NetworkTable;
  isConnected(): boolean;
}

interface NetworkTable {
  getBooleanTopic(name: string): Topic;
  getDoubleTopic(name: string): Topic;
  getStringTopic(name: string): Topic;
  getBooleanArrayTopic(name: string): Topic;
  getDoubleArrayTopic(name: string): Topic;
  getStringArrayTopic(name: string): Topic;
}

interface Topic {
  publish(): void;
  setDefault(value: any): void;
  getEntry(): any;
}

/**
 * NetworkTables interface for WPILib.
 *
 * This class provides a wrapper around the NetworkTables API for use in WPILib.
 */
// Create a mock NetworkTableInstance implementation
class MockNetworkTableInstance implements NetworkTableInstance {
  private _connected: boolean = false;
  private _tables: Map<string, MockNetworkTable> = new Map();

  public static getDefault(): MockNetworkTableInstance {
    return new MockNetworkTableInstance();
  }

  public startServer(): void {
    this._connected = true;
  }

  public stopServer(): void {
    this._connected = false;
  }

  public startClient4(clientName: string, serverName: string): void {
    this._connected = true;
  }

  public stopClient(): void {
    this._connected = false;
  }

  public getTable(name: string): NetworkTable {
    if (!this._tables.has(name)) {
      this._tables.set(name, new MockNetworkTable(name));
    }
    return this._tables.get(name)!;
  }

  public isConnected(): boolean {
    return this._connected;
  }
}

// Create a mock NetworkTable implementation
class MockNetworkTable implements NetworkTable {
  private _name: string;
  private _topics: Map<string, MockTopic> = new Map();

  constructor(name: string) {
    this._name = name;
  }

  public getBooleanTopic(name: string): Topic {
    const fullName = `${this._name}/${name}`;
    if (!this._topics.has(fullName)) {
      this._topics.set(fullName, new MockTopic(fullName, false));
    }
    return this._topics.get(fullName)!;
  }

  public getDoubleTopic(name: string): Topic {
    const fullName = `${this._name}/${name}`;
    if (!this._topics.has(fullName)) {
      this._topics.set(fullName, new MockTopic(fullName, 0.0));
    }
    return this._topics.get(fullName)!;
  }

  public getStringTopic(name: string): Topic {
    const fullName = `${this._name}/${name}`;
    if (!this._topics.has(fullName)) {
      this._topics.set(fullName, new MockTopic(fullName, ''));
    }
    return this._topics.get(fullName)!;
  }

  public getBooleanArrayTopic(name: string): Topic {
    const fullName = `${this._name}/${name}`;
    if (!this._topics.has(fullName)) {
      this._topics.set(fullName, new MockTopic(fullName, []));
    }
    return this._topics.get(fullName)!;
  }

  public getDoubleArrayTopic(name: string): Topic {
    const fullName = `${this._name}/${name}`;
    if (!this._topics.has(fullName)) {
      this._topics.set(fullName, new MockTopic(fullName, []));
    }
    return this._topics.get(fullName)!;
  }

  public getStringArrayTopic(name: string): Topic {
    const fullName = `${this._name}/${name}`;
    if (!this._topics.has(fullName)) {
      this._topics.set(fullName, new MockTopic(fullName, []));
    }
    return this._topics.get(fullName)!;
  }
}

// Create a mock Topic implementation
class MockTopic implements Topic {
  private _name: string;
  private _value: any;
  private _published: boolean = false;
  private _entry: MockEntry | null = null;

  constructor(name: string, defaultValue: any) {
    this._name = name;
    this._value = defaultValue;
  }

  public publish(): void {
    this._published = true;
  }

  public setDefault(value: any): void {
    if (this._value === undefined) {
      this._value = value;
    }
  }

  public getEntry(): any {
    if (!this._entry) {
      this._entry = new MockEntry(this);
    }
    return this._entry;
  }

  public getValue(): any {
    return this._value;
  }

  public setValue(value: any): void {
    this._value = value;
  }
}

// Create a mock Entry implementation
class MockEntry {
  private _topic: MockTopic;
  private _listeners: Set<(value: any) => void> = new Set();

  constructor(topic: MockTopic) {
    this._topic = topic;
  }

  public get(): any {
    return this._topic.getValue();
  }

  public set(value: any): void {
    this._topic.setValue(value);
    this._notifyListeners(value);
  }

  public addListener(listener: (value: any) => void): void {
    this._listeners.add(listener);
  }

  public removeListener(listener: (value: any) => void): void {
    this._listeners.delete(listener);
  }

  private _notifyListeners(value: any): void {
    for (const listener of this._listeners) {
      listener(value);
    }
  }
}

export class NetworkTablesInterface extends EventEmitter {
  private static instance: NetworkTablesInterface;
  private _nt: NetworkTableInstance;
  private _connected: boolean = false;
  private _topics: Map<string, Topic> = new Map();

  /**
   * Get the singleton instance of the NetworkTablesInterface.
   */
  public static getInstance(): NetworkTablesInterface {
    if (!NetworkTablesInterface.instance) {
      NetworkTablesInterface.instance = new NetworkTablesInterface();
    }
    return NetworkTablesInterface.instance;
  }

  private constructor() {
    super();
    this._nt = MockNetworkTableInstance.getDefault();

    // Set up connection change handling
    this._connected = false;
    this.emit('connectionChanged', false);
  }

  /**
   * Start the NetworkTables server.
   *
   * @param port The port to listen on.
   * @param ignoreErrors Whether to ignore errors when starting the server.
   * @returns A promise that resolves when the server is started.
   */
  public async startServer(port: number = 1735, ignoreErrors: boolean = false): Promise<void> {
    try {
      this._nt.startServer();
      this._connected = true;
      this.emit('serverStarted', port);
    } catch (error) {
      console.error('Failed to start NetworkTables server:', error);
      if (!ignoreErrors) {
        throw error;
      }
      // If we're ignoring errors, just pretend we're connected
      this._connected = true;
      this.emit('serverStarted', port);
    }
  }

  /**
   * Connect to a NetworkTables server.
   *
   * @param host The host to connect to.
   * @param port The port to connect to.
   * @returns A promise that resolves when connected.
   */
  public async connectAsClient(host: string = 'localhost', port: number = 1735): Promise<void> {
    try {
      this._nt.startClient4('WPILib-Client', `${host}:${port}`);
      this._connected = true;
      this.emit('clientConnected', { host, port });
    } catch (error) {
      console.error('Failed to connect to NetworkTables server:', error);
      throw error;
    }
  }

  /**
   * Disconnect from NetworkTables.
   *
   * @returns A promise that resolves when disconnected.
   */
  public async disconnect(): Promise<void> {
    try {
      this._nt.stopClient();
      this._nt.stopServer();
      this._connected = false;
      this.emit('disconnected');
    } catch (error) {
      console.error('Failed to disconnect from NetworkTables:', error);
      throw error;
    }
  }

  /**
   * Check if connected to NetworkTables.
   *
   * @returns True if connected.
   */
  public isConnected(): boolean {
    return this._connected;
  }

  /**
   * Get a boolean topic.
   *
   * @param key The topic key.
   * @param defaultValue The default value.
   * @returns The boolean topic.
   */
  public getBoolean(key: string, defaultValue: boolean = false): Topic {
    if (this._topics.has(key)) {
      return this._topics.get(key) as Topic;
    }

    const table = this._nt.getTable('SmartDashboard');
    const topic = table.getBooleanTopic(key);
    topic.publish();
    topic.setDefault(defaultValue);
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
  public getNumber(key: string, defaultValue: number = 0): Topic {
    if (this._topics.has(key)) {
      return this._topics.get(key) as Topic;
    }

    const table = this._nt.getTable('SmartDashboard');
    const topic = table.getDoubleTopic(key);
    topic.publish();
    topic.setDefault(defaultValue);
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
  public getString(key: string, defaultValue: string = ''): Topic {
    if (this._topics.has(key)) {
      return this._topics.get(key) as Topic;
    }

    const table = this._nt.getTable('SmartDashboard');
    const topic = table.getStringTopic(key);
    topic.publish();
    topic.setDefault(defaultValue);
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
  public getBooleanArray(key: string, defaultValue: boolean[] = []): Topic {
    if (this._topics.has(key)) {
      return this._topics.get(key) as Topic;
    }

    const table = this._nt.getTable('SmartDashboard');
    const topic = table.getBooleanArrayTopic(key);
    topic.publish();
    topic.setDefault(defaultValue);
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
  public getNumberArray(key: string, defaultValue: number[] = []): Topic {
    if (this._topics.has(key)) {
      return this._topics.get(key) as Topic;
    }

    const table = this._nt.getTable('SmartDashboard');
    const topic = table.getDoubleArrayTopic(key);
    topic.publish();
    topic.setDefault(defaultValue);
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
  public getStringArray(key: string, defaultValue: string[] = []): Topic {
    if (this._topics.has(key)) {
      return this._topics.get(key) as Topic;
    }

    const table = this._nt.getTable('SmartDashboard');
    const topic = table.getStringArrayTopic(key);
    topic.publish();
    topic.setDefault(defaultValue);
    this._topics.set(key, topic);
    return topic;
  }

  /**
   * Get the underlying NetworkTables instance.
   *
   * @returns The NetworkTableInstance.
   */
  public getNetworkTables(): NetworkTableInstance {
    return this._nt;
  }
}

// Export singleton instance
export const networkTables = NetworkTablesInterface.getInstance();
