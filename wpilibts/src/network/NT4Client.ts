/**
 * NetworkTables 4 Client implementation for TypeScript.
 *
 * This client connects to a NetworkTables 4 server and provides methods for
 * publishing, subscribing, and getting values from NetworkTables.
 */
import { EventEmitter } from 'events';
import WebSocket from 'ws';

/**
 * NetworkTables 4 message types.
 */
export enum NT4MessageType {
  /** Publish a topic value */
  Publish = 0,
  /** Publish a topic value with extended properties */
  PublishEx = 1,
  /** Subscribe to a topic or topics */
  Subscribe = 2,
  /** Unsubscribe from a topic or topics */
  Unsubscribe = 3,
  /** Get or set topic properties */
  Properties = 4,
  /** Update topic properties */
  PropertiesUpdate = 5,
  /** Announce a topic */
  Announce = 6,
  /** Unannounce a topic */
  Unannounce = 7,
  /** Set topic properties */
  SetProperties = 8,
}

/**
 * NetworkTables 4 data types.
 */
export enum NT4DataType {
  /** Boolean value */
  Boolean = 0,
  /** Double-precision floating point value */
  Double = 1,
  /** String value */
  String = 2,
  /** Raw byte array value */
  Raw = 3,
  /** Boolean array value */
  BooleanArray = 4,
  /** Double-precision floating point array value */
  DoubleArray = 5,
  /** String array value */
  StringArray = 6,
  /** JSON-encoded value */
  Json = 7,
}

/**
 * NetworkTables 4 topic subscription options.
 */
export interface NT4SubscriptionOptions {
  /** Topic name prefix to subscribe to */
  prefix?: string;
  /** Specific topics to subscribe to */
  topics?: string[];
  /** Data types to subscribe to */
  types?: NT4DataType[];
  /** Whether to subscribe to all topics */
  all?: boolean;
  /** Whether to subscribe to topic announcements */
  topicsOnly?: boolean;
  /** Whether to immediately receive the current value upon subscription */
  immediate?: boolean;
}

/**
 * NetworkTables 4 topic properties.
 */
export interface NT4TopicProperties {
  /** Whether the topic is persistent */
  persistent?: boolean;
  /** Whether the topic is retained */
  retained?: boolean;
  /** Whether the topic is transient (not saved to disk) */
  transient?: boolean;
  /** Custom properties */
  [key: string]: any;
}

/**
 * NetworkTables 4 topic.
 */
export interface NT4Topic {
  /** Topic name */
  name: string;
  /** Topic ID */
  id: number;
  /** Topic data type */
  type: NT4DataType;
  /** Topic properties */
  properties: NT4TopicProperties;
  /** Current value */
  value?: any;
  /** Timestamp of the last update */
  timestamp?: number;
}

/**
 * NetworkTables 4 client.
 *
 * This client connects to a NetworkTables 4 server and provides methods for
 * publishing, subscribing, and getting values from NetworkTables.
 */
export class NT4Client extends EventEmitter {
  private ws: WebSocket.WebSocket | null = null;
  private serverUrl: string;
  private connected: boolean = false;
  private topics: Map<string, NT4Topic> = new Map();
  private topicsById: Map<number, NT4Topic> = new Map();
  private subscriptions: Map<number, NT4SubscriptionOptions> = new Map();
  private nextSubscriptionId: number = 0;
  private valueListeners: Map<string, Set<(value: any, timestamp: number) => void>> = new Map();
  private announcementListeners: Set<(topic: NT4Topic) => void> = new Set();
  private unAnnouncementListeners: Set<(topicName: string, topicId: number) => void> = new Set();

  /**
   * Create a new NetworkTables 4 client.
   *
   * @param serverUrl The URL of the NetworkTables server.
   */
  constructor(serverUrl: string = 'ws://localhost:5810') {
    super();
    this.serverUrl = serverUrl;
  }

  /**
   * Connect to the NetworkTables server.
   *
   * @returns A promise that resolves when the connection is established.
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve();
        return;
      }

      this.ws = new WebSocket.WebSocket(this.serverUrl);

      this.ws.on('open', () => {
        console.log('Connected to NetworkTables server');
        this.connected = true;
        this.emit('connected');
        resolve();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(data);
      });

      this.ws.on('close', () => {
        console.log('Disconnected from NetworkTables server');
        this.connected = false;
        this.emit('disconnected');
      });

      this.ws.on('error', (error) => {
        console.error('NetworkTables WebSocket error:', error);
        this.emit('error', error);
        reject(error);
      });
    });
  }

  /**
   * Disconnect from the NetworkTables server.
   */
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }

  /**
   * Check if the client is connected to the NetworkTables server.
   *
   * @returns True if connected, false otherwise.
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Subscribe to topics.
   *
   * @param options Subscription options.
   * @returns The subscription ID.
   */
  public subscribe(options: NT4SubscriptionOptions): number {
    if (!this.connected) {
      throw new Error('Not connected to NetworkTables server');
    }

    const subId = this.nextSubscriptionId++;
    this.subscriptions.set(subId, options);

    const message = {
      type: NT4MessageType.Subscribe,
      subuid: subId,
      options
    };

    this.sendMessage(message);
    return subId;
  }

  /**
   * Unsubscribe from a subscription.
   *
   * @param subId The subscription ID.
   */
  public unsubscribe(subId: number): void {
    if (!this.connected) {
      throw new Error('Not connected to NetworkTables server');
    }

    if (!this.subscriptions.has(subId)) {
      return;
    }

    const message = {
      type: NT4MessageType.Unsubscribe,
      subuid: subId
    };

    this.sendMessage(message);
    this.subscriptions.delete(subId);
  }

  /**
   * Publish a value to a topic.
   *
   * @param name The topic name.
   * @param value The value to publish.
   * @param type The data type of the value.
   * @param properties Optional topic properties.
   */
  public publish(name: string, value: any, type: NT4DataType, properties?: NT4TopicProperties): void {
    if (!this.connected) {
      throw new Error('Not connected to NetworkTables server');
    }

    // Check if the topic already exists
    const existingTopic = this.topics.get(name);
    if (existingTopic) {
      // If the topic exists, just publish the value
      const message = {
        type: NT4MessageType.Publish,
        topic: existingTopic.id,
        value
      };
      this.sendMessage(message);
    } else {
      // If the topic doesn't exist, announce it first
      const message = {
        type: NT4MessageType.PublishEx,
        name,
        dataType: type,
        properties: properties || {},
        value
      };
      this.sendMessage(message);
    }
  }

  /**
   * Get the current value of a topic.
   *
   * @param name The topic name.
   * @returns The current value, or undefined if the topic doesn't exist.
   */
  public getValue(name: string): any {
    const topic = this.topics.get(name);
    return topic ? topic.value : undefined;
  }

  /**
   * Get all topics.
   *
   * @returns A map of topic names to topics.
   */
  public getTopics(): Map<string, NT4Topic> {
    return new Map(this.topics);
  }

  /**
   * Add a listener for value changes on a topic.
   *
   * @param name The topic name.
   * @param listener The listener function.
   */
  public addValueListener(name: string, listener: (value: any, timestamp: number) => void): void {
    let listeners = this.valueListeners.get(name);
    if (!listeners) {
      listeners = new Set();
      this.valueListeners.set(name, listeners);
    }
    listeners.add(listener);
  }

  /**
   * Remove a listener for value changes on a topic.
   *
   * @param name The topic name.
   * @param listener The listener function.
   */
  public removeValueListener(name: string, listener: (value: any, timestamp: number) => void): void {
    const listeners = this.valueListeners.get(name);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.valueListeners.delete(name);
      }
    }
  }

  /**
   * Add a listener for topic announcements.
   *
   * @param listener The listener function.
   */
  public addAnnouncementListener(listener: (topic: NT4Topic) => void): void {
    this.announcementListeners.add(listener);
  }

  /**
   * Remove a listener for topic announcements.
   *
   * @param listener The listener function.
   */
  public removeAnnouncementListener(listener: (topic: NT4Topic) => void): void {
    this.announcementListeners.delete(listener);
  }

  /**
   * Add a listener for topic unannouncements.
   *
   * @param listener The listener function.
   */
  public addUnAnnouncementListener(listener: (topicName: string, topicId: number) => void): void {
    this.unAnnouncementListeners.add(listener);
  }

  /**
   * Remove a listener for topic unannouncements.
   *
   * @param listener The listener function.
   */
  public removeUnAnnouncementListener(listener: (topicName: string, topicId: number) => void): void {
    this.unAnnouncementListeners.delete(listener);
  }

  /**
   * Handle a message from the NetworkTables server.
   *
   * @param data The message data.
   */
  private handleMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());
      const type = message.type;

      switch (type) {
        case NT4MessageType.Publish:
          this.handlePublish(message);
          break;
        case NT4MessageType.Announce:
          this.handleAnnounce(message);
          break;
        case NT4MessageType.Unannounce:
          this.handleUnannounce(message);
          break;
        case NT4MessageType.Properties:
          this.handleProperties(message);
          break;
        case NT4MessageType.PropertiesUpdate:
          this.handlePropertiesUpdate(message);
          break;
        default:
          console.warn('Unknown message type:', type);
          break;
      }
    } catch (error) {
      console.error('Error handling NetworkTables message:', error);
    }
  }

  /**
   * Handle a publish message.
   *
   * @param message The message.
   */
  private handlePublish(message: any): void {
    const topicId = message.topic;
    const value = message.value;
    const timestamp = message.timestamp || Date.now();

    const topic = this.topicsById.get(topicId);
    if (!topic) {
      console.warn('Received publish for unknown topic ID:', topicId);
      return;
    }

    topic.value = value;
    topic.timestamp = timestamp;

    // Notify value listeners
    const listeners = this.valueListeners.get(topic.name);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(value, timestamp);
        } catch (error) {
          console.error('Error in value listener:', error);
        }
      });
    }

    this.emit('valueChanged', topic.name, value, timestamp);
  }

  /**
   * Handle an announce message.
   *
   * @param message The message.
   */
  private handleAnnounce(message: any): void {
    const name = message.name;
    const id = message.id;
    const type = message.type;
    const properties = message.properties || {};

    const topic: NT4Topic = {
      name,
      id,
      type,
      properties
    };

    this.topics.set(name, topic);
    this.topicsById.set(id, topic);

    // Notify announcement listeners
    this.announcementListeners.forEach(listener => {
      try {
        listener(topic);
      } catch (error) {
        console.error('Error in announcement listener:', error);
      }
    });

    this.emit('topicAnnounced', topic);
  }

  /**
   * Handle an unannounce message.
   *
   * @param message The message.
   */
  private handleUnannounce(message: any): void {
    const topicId = message.id;

    const topic = this.topicsById.get(topicId);
    if (!topic) {
      console.warn('Received unannounce for unknown topic ID:', topicId);
      return;
    }

    const topicName = topic.name;

    this.topics.delete(topicName);
    this.topicsById.delete(topicId);

    // Notify unannouncement listeners
    this.unAnnouncementListeners.forEach(listener => {
      try {
        listener(topicName, topicId);
      } catch (error) {
        console.error('Error in unannouncement listener:', error);
      }
    });

    this.emit('topicUnannounced', topicName, topicId);
  }

  /**
   * Handle a properties message.
   *
   * @param message The message.
   */
  private handleProperties(message: any): void {
    const topicId = message.id;
    const properties = message.properties || {};

    const topic = this.topicsById.get(topicId);
    if (!topic) {
      console.warn('Received properties for unknown topic ID:', topicId);
      return;
    }

    topic.properties = properties;

    this.emit('propertiesChanged', topic.name, properties);
  }

  /**
   * Handle a properties update message.
   *
   * @param message The message.
   */
  private handlePropertiesUpdate(message: any): void {
    const topicId = message.id;
    const update = message.update || {};

    const topic = this.topicsById.get(topicId);
    if (!topic) {
      console.warn('Received properties update for unknown topic ID:', topicId);
      return;
    }

    // Update the properties
    Object.assign(topic.properties, update);

    this.emit('propertiesUpdated', topic.name, update);
  }

  /**
   * Send a message to the NetworkTables server.
   *
   * @param message The message to send.
   */
  private sendMessage(message: any): void {
    if (!this.ws || this.ws.readyState !== 1) { // WebSocket.OPEN
      throw new Error('Not connected to NetworkTables server');
    }

    this.ws.send(JSON.stringify(message));
  }
}

// Export singleton instance
export const nt4Client = new NT4Client();
