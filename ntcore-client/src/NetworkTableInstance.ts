import { NetworkTable } from './NetworkTable';
import { Topic } from './Topic';
import { BooleanTopic } from './topics/BooleanTopic';
import { DoubleTopic } from './topics/DoubleTopic';
import { IntegerTopic } from './topics/IntegerTopic';
import { FloatTopic } from './topics/FloatTopic';
import { StringTopic } from './topics/StringTopic';
import { RawTopic } from './topics/RawTopic';
import { BooleanArrayTopic } from './topics/BooleanArrayTopic';
import { DoubleArrayTopic } from './topics/DoubleArrayTopic';
import { IntegerArrayTopic } from './topics/IntegerArrayTopic';
import { FloatArrayTopic } from './topics/FloatArrayTopic';
import { StringArrayTopic } from './topics/StringArrayTopic';
import { NT4_Client } from './NT4';

/**
 * NetworkTables Instance.
 *
 * Instances are completely independent from each other. Table operations on one instance will
 * not be visible to other instances unless the instances are connected via the network.
 */
export class NetworkTableInstance {
  private static defaultInstance: NetworkTableInstance | null = null;
  private client: NT4_Client;
  private tables: Map<string, NetworkTable> = new Map();
  private topics: Map<string, Topic> = new Map();
  private connected: boolean = false;

  /**
   * Client/server mode flag values (as returned by getNetworkMode()).
   */
  public static readonly NetworkMode = {
    kNetModeNone: 0,
    kNetModeServer: 0x01,
    kNetModeClient3: 0x02,
    kNetModeClient4: 0x04,
    kNetModeStarting: 0x08,
    kNetModeLocal: 0x10
  };

  /**
   * The default port that network tables operates on for NT4.
   */
  public static readonly kDefaultPort4 = 5810;

  /**
   * Private constructor - use static methods to create instances
   */
  private constructor(
    serverAddr: string = 'localhost',
    appName: string = 'NT4-Client'
  ) {
    this.client = new NT4_Client(
      serverAddr,
      appName,
      this.onTopicAnnounce.bind(this),
      this.onTopicUnannounce.bind(this),
      this.onNewTopicData.bind(this),
      this.onConnect.bind(this),
      this.onDisconnect.bind(this)
    );
  }

  /**
   * Get global default instance.
   *
   * @returns Global default instance
   */
  public static getDefault(): NetworkTableInstance {
    if (!NetworkTableInstance.defaultInstance) {
      NetworkTableInstance.defaultInstance = new NetworkTableInstance();
    }
    return NetworkTableInstance.defaultInstance;
  }

  /**
   * Create an instance.
   *
   * @returns Newly created instance
   */
  public static create(): NetworkTableInstance {
    return new NetworkTableInstance();
  }

  /**
   * Get the current network mode.
   *
   * @returns Bitmask of NetworkMode.
   */
  public getNetworkMode(): number {
    if (!this.connected) {
      return NetworkTableInstance.NetworkMode.kNetModeNone;
    }
    return NetworkTableInstance.NetworkMode.kNetModeClient4;
  }

  /**
   * Starts a NT4 client.
   *
   * @param identity network identity to advertise
   * @param serverAddr server address
   * @param port server port
   */
  public startClient4(identity: string, serverAddr: string = 'localhost', port: number = NetworkTableInstance.kDefaultPort4): void {
    // Pass the server address and port separately to the NT4_Client constructor
    this.client = new NT4_Client(
      serverAddr,
      identity,
      this.onTopicAnnounce.bind(this),
      this.onTopicUnannounce.bind(this),
      this.onNewTopicData.bind(this),
      this.onConnect.bind(this),
      this.onDisconnect.bind(this),
      port
    );
    this.client.connect();
  }

  /**
   * Stops the client if it is running.
   */
  public stopClient(): void {
    this.client.disconnect();
    this.connected = false;
  }

  /**
   * Gets a "generic" (untyped) topic.
   *
   * @param name topic name
   * @returns Topic
   */
  public getTopic(name: string): Topic {
    if (this.topics.has(name)) {
      return this.topics.get(name)!;
    }
    const topic = new Topic(this, name);
    this.topics.set(name, topic);
    return topic;
  }

  /**
   * Gets a boolean topic.
   *
   * @param name topic name
   * @returns BooleanTopic
   */
  public getBooleanTopic(name: string): BooleanTopic {
    return new BooleanTopic(this.getTopic(name));
  }

  /**
   * Gets a double topic.
   *
   * @param name topic name
   * @returns DoubleTopic
   */
  public getDoubleTopic(name: string): DoubleTopic {
    return new DoubleTopic(this.getTopic(name));
  }

  /**
   * Gets an integer topic.
   *
   * @param name topic name
   * @returns IntegerTopic
   */
  public getIntegerTopic(name: string): IntegerTopic {
    return new IntegerTopic(this.getTopic(name));
  }

  /**
   * Gets a float topic.
   *
   * @param name topic name
   * @returns FloatTopic
   */
  public getFloatTopic(name: string): FloatTopic {
    return new FloatTopic(this.getTopic(name));
  }

  /**
   * Gets a string topic.
   *
   * @param name topic name
   * @returns StringTopic
   */
  public getStringTopic(name: string): StringTopic {
    return new StringTopic(this.getTopic(name));
  }

  /**
   * Gets a raw topic.
   *
   * @param name topic name
   * @returns RawTopic
   */
  public getRawTopic(name: string): RawTopic {
    return new RawTopic(this.getTopic(name));
  }

  /**
   * Gets a boolean array topic.
   *
   * @param name topic name
   * @returns BooleanArrayTopic
   */
  public getBooleanArrayTopic(name: string): BooleanArrayTopic {
    return new BooleanArrayTopic(this.getTopic(name));
  }

  /**
   * Gets a double array topic.
   *
   * @param name topic name
   * @returns DoubleArrayTopic
   */
  public getDoubleArrayTopic(name: string): DoubleArrayTopic {
    return new DoubleArrayTopic(this.getTopic(name));
  }

  /**
   * Gets an integer array topic.
   *
   * @param name topic name
   * @returns IntegerArrayTopic
   */
  public getIntegerArrayTopic(name: string): IntegerArrayTopic {
    return new IntegerArrayTopic(this.getTopic(name));
  }

  /**
   * Gets a float array topic.
   *
   * @param name topic name
   * @returns FloatArrayTopic
   */
  public getFloatArrayTopic(name: string): FloatArrayTopic {
    return new FloatArrayTopic(this.getTopic(name));
  }

  /**
   * Gets a string array topic.
   *
   * @param name topic name
   * @returns StringArrayTopic
   */
  public getStringArrayTopic(name: string): StringArrayTopic {
    return new StringArrayTopic(this.getTopic(name));
  }

  /**
   * Gets the table with the specified key.
   *
   * @param key the key name
   * @returns The network table
   */
  public getTable(key: string): NetworkTable {
    if (this.tables.has(key)) {
      return this.tables.get(key)!;
    }
    const table = new NetworkTable(this, key);
    this.tables.set(key, table);
    return table;
  }

  /**
   * Gets the NT4 client instance.
   *
   * @returns NT4_Client instance
   * @internal This method is intended for internal use only
   */
  public getClient(): NT4_Client {
    return this.client;
  }

  /**
   * Flushes all local updates to the network.
   */
  public flush(): void {
    // NT4_Client doesn't have a flush method, but we could add one if needed
  }

  /**
   * Returns whether the instance is connected to the server.
   *
   * @returns True if connected
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Gets the current server time in microseconds.
   *
   * @returns Server time in microseconds or null if unknown
   */
  public getServerTime(): number | null {
    return this.client.getServerTime_us();
  }

  /**
   * Gets the current network latency in microseconds.
   *
   * @returns Network latency in microseconds
   */
  public getNetworkLatency(): number {
    return this.client.getNetworkLatency_us();
  }

  // Internal callback handlers
  private onTopicAnnounce(ntTopic: any): void {
    // Handle topic announcement
    if (this.topics.has(ntTopic.name)) {
      // Update existing topic
      const topic = this.topics.get(ntTopic.name)!;

      // Use the publish method to update type and existence
      if (!topic.exists()) {
        topic.publish(ntTopic.type);
      }

      // Update properties if any
      if (ntTopic.properties && Object.keys(ntTopic.properties).length > 0) {
        Object.entries(ntTopic.properties).forEach(([key, value]) => {
          topic.setProperty(key, value);
        });
      }
    } else {
      // Create new topic
      const topic = new Topic(this, ntTopic.name);

      // Use the publish method to set type and existence
      topic.publish(ntTopic.type);

      // Update properties if any
      if (ntTopic.properties && Object.keys(ntTopic.properties).length > 0) {
        Object.entries(ntTopic.properties).forEach(([key, value]) => {
          topic.setProperty(key, value);
        });
      }

      this.topics.set(ntTopic.name, topic);
    }
  }

  private onTopicUnannounce(ntTopic: any): void {
    // Handle topic unannouncement
    if (this.topics.has(ntTopic.name)) {
      const topic = this.topics.get(ntTopic.name)!;
      // Use unpublish to mark the topic as not existing
      topic.unpublish();
    }
  }

  private onNewTopicData(ntTopic: any, timestamp: number, value: any): void {
    // Handle new topic data
    if (this.topics.has(ntTopic.name)) {
      const topic = this.topics.get(ntTopic.name)!;
      // Update the topic's existence state if needed
      if (!topic.exists()) {
        topic.publish(ntTopic.type);
      }
    }
  }

  private onConnect(): void {
    this.connected = true;

    // Republish all topics when connection is established
    this.republishAllTopics();
  }

  /**
   * Republishes all topics in the instance.
   * This is called automatically when a connection is established.
   */
  private republishAllTopics(): void {
    // Iterate through all topics and republish them
    for (const topic of this.topics.values()) {
      // Only republish if the topic has a type (was previously published)
      if (topic.getType() !== '') {
        topic.publish(topic.getType(), topic.getProperties());
      }
    }
  }

  private onDisconnect(): void {
    this.connected = false;
  }
}
