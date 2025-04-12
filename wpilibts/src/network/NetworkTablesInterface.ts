/**
 * NetworkTables interface for WPILib.
 */
import { EventEmitter } from 'events';
// Import from the local ntcore package
import { NetworkTables } from '../../../ntcore/src/api/NetworkTables';
import { Topic } from '../../../ntcore/src/api/Topic';

/**
 * NetworkTables interface for WPILib.
 *
 * This class provides a wrapper around the NetworkTables API for use in WPILib.
 */
export class NetworkTablesInterface extends EventEmitter {
  private static instance: NetworkTablesInterface;
  private _nt: NetworkTables;
  private _connected: boolean = false;
  private _topics: Map<string, Topic<any>> = new Map();

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
    this._nt = new NetworkTables();

    // Listen for connection changes
    this._nt.on('connectionChanged', (connected: boolean) => {
      this._connected = connected;
      this.emit('connectionChanged', connected);
    });
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
      await this._nt.startServer({ port });
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
      await this._nt.connectAsClient({ host, port });
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
      await this._nt.disconnect();
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
  public getBoolean(key: string, defaultValue: boolean = false): Topic<boolean> {
    if (this._topics.has(key)) {
      return this._topics.get(key) as Topic<boolean>;
    }

    const topic = this._nt.getBoolean(key, defaultValue);
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
  public getNumber(key: string, defaultValue: number = 0): Topic<number> {
    if (this._topics.has(key)) {
      return this._topics.get(key) as Topic<number>;
    }

    const topic = this._nt.getNumber(key, defaultValue);
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
  public getString(key: string, defaultValue: string = ''): Topic<string> {
    if (this._topics.has(key)) {
      return this._topics.get(key) as Topic<string>;
    }

    const topic = this._nt.getString(key, defaultValue);
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
  public getBooleanArray(key: string, defaultValue: boolean[] = []): Topic<boolean[]> {
    if (this._topics.has(key)) {
      return this._topics.get(key) as Topic<boolean[]>;
    }

    const topic = this._nt.getBooleanArray(key, defaultValue);
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
  public getNumberArray(key: string, defaultValue: number[] = []): Topic<number[]> {
    if (this._topics.has(key)) {
      return this._topics.get(key) as Topic<number[]>;
    }

    const topic = this._nt.getNumberArray(key, defaultValue);
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
  public getStringArray(key: string, defaultValue: string[] = []): Topic<string[]> {
    if (this._topics.has(key)) {
      return this._topics.get(key) as Topic<string[]>;
    }

    const topic = this._nt.getStringArray(key, defaultValue);
    this._topics.set(key, topic);
    return topic;
  }

  /**
   * Get the underlying NetworkTables instance.
   *
   * @returns The NetworkTables instance.
   */
  public getNetworkTables(): NetworkTables {
    return this._nt;
  }
}

// Export singleton instance
export const networkTables = NetworkTablesInterface.getInstance();
