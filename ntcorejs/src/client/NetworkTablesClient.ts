import WebSocket from 'ws';
import { EventEmitter } from 'events';
import {
  NT4_SUBPROTOCOL,
  NT4_FALLBACK_SUBPROTOCOL,
  RTT_SUBPROTOCOL,
  PING_INTERVAL,
  PING_TIMEOUT,
  encodeClientMessage,
  encodeValue,
  encodeRTT,
  decodeServerMessage,
  decodeBinaryMessage,
  decodeBinaryMessages
} from '../protocol';
import {
  ClientMessageType,
  ServerMessageType,
  PublishMessage,
  UnpublishMessage,
  SetPropertiesMessage,
  SubscribeMessage,
  UnsubscribeMessage,
  Properties,
  PubSubOptions,
  Topic,
  Subscription,
  Publication,
  Value,
  DataType
} from '../types';
import {
  getCurrentTimeMicros,
  calculateServerTimeOffset,
  clientTimeToServerTime,
  generateId
} from '../utils';

/**
 * NetworkTables client events
 */
export enum NetworkTablesClientEvent {
  Connected = 'connected',
  Disconnected = 'disconnected',
  TopicAnnounced = 'topicAnnounced',
  TopicUnannounced = 'topicUnannounced',
  TopicPropertiesChanged = 'topicPropertiesChanged',
  ValueChanged = 'valueChanged',
  TimeSyncUpdated = 'timeSyncUpdated'
}

/**
 * NetworkTables client options
 */
export interface NetworkTablesClientOptions {
  serverHost: string;
  serverPort?: number;
  secure?: boolean;
  clientName?: string;
  connectionTimeout?: number;
}

/**
 * NetworkTables client
 */
export class NetworkTablesClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private serverHost: string;
  private serverPort: number;
  private secure: boolean;
  private clientName: string;
  private connectionTimeout: number;
  private connected: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private pingTimeoutTimer: NodeJS.Timeout | null = null;
  private lastPingTime: number = 0;
  private serverTimeOffset: number = 0;
  private topics: Map<string, Topic> = new Map();
  private topicsById: Map<number, Topic> = new Map();
  private subscriptions: Map<number, Subscription> = new Map();
  private publications: Map<number, Publication> = new Map();
  private nextSubscriptionId: number = 1;
  private nextPublicationId: number = 1;

  /**
   * Creates a new NetworkTables client
   * @param options The client options
   */
  constructor(options: NetworkTablesClientOptions) {
    super();
    this.serverHost = options.serverHost;
    this.serverPort = options.serverPort || 5810;
    this.secure = options.secure || false;
    this.clientName = options.clientName || 'ntcorejs-client';
    this.connectionTimeout = options.connectionTimeout || 5000;
  }

  /**
   * Connects to the NetworkTables server
   */
  public connect(): void {
    if (this.ws) {
      return;
    }

    const protocol = this.secure ? 'wss' : 'ws';
    const url = `${protocol}://${this.serverHost}:${this.serverPort}`;

    // Create main WebSocket connection
    // Use a single protocol to avoid issues
    this.ws = new WebSocket(url, NT4_FALLBACK_SUBPROTOCOL);

    this.ws.on('open', () => {
      this.connected = true;
      this.startPingTimer();
      this.syncTime();
      this.emit(NetworkTablesClientEvent.Connected);
    });

    this.ws.on('message', (data) => {
      this.handleMessage(data);
    });

    this.ws.on('close', () => {
      this.handleDisconnect();
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleDisconnect();
    });

    // Skip RTT WebSocket for now as it's causing issues
    // We'll use the main WebSocket for time sync
    this.syncTime();
  }

  /**
   * Disconnects from the NetworkTables server
   */
  public disconnect(): void {
    this.stopPingTimer();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.terminate();
      this.ws = null;
    }

    this.connected = false;
  }

  /**
   * Publishes a topic
   * @param name The topic name
   * @param type The topic type
   * @param properties The topic properties
   * @returns The publication ID
   */
  public publish(name: string, type: string, properties: Properties = {}): number {
    const pubuid = this.nextPublicationId++;

    const message: PublishMessage = {
      method: ClientMessageType.Publish,
      params: {
        name,
        type,
        pubuid,
        properties
      }
    };

    this.sendMessage(message);

    this.publications.set(pubuid, {
      id: pubuid,
      name,
      type,
      properties
    });

    return pubuid;
  }

  /**
   * Unpublishes a topic
   * @param pubuid The publication ID
   */
  public unpublish(pubuid: number): void {
    if (!this.publications.has(pubuid)) {
      return;
    }

    const message: UnpublishMessage = {
      method: ClientMessageType.Unpublish,
      params: {
        pubuid
      }
    };

    this.sendMessage(message);
    this.publications.delete(pubuid);
  }

  /**
   * Sets properties for a topic
   * @param name The topic name
   * @param properties The properties to set
   */
  public setProperties(name: string, properties: Properties): void {
    const message: SetPropertiesMessage = {
      method: ClientMessageType.SetProperties,
      params: {
        name,
        update: properties
      }
    };

    this.sendMessage(message);
  }

  /**
   * Subscribes to topics
   * @param topics The topics to subscribe to
   * @param options The subscription options
   * @returns The subscription ID
   */
  public subscribe(topics: string[], options: PubSubOptions = {}): number {
    const subuid = this.nextSubscriptionId++;

    const message: SubscribeMessage = {
      method: ClientMessageType.Subscribe,
      params: {
        subuid,
        topics,
        options
      }
    };

    this.sendMessage(message);

    this.subscriptions.set(subuid, {
      id: subuid,
      topics,
      options
    });

    return subuid;
  }

  /**
   * Unsubscribes from topics
   * @param subuid The subscription ID
   */
  public unsubscribe(subuid: number): void {
    if (!this.subscriptions.has(subuid)) {
      return;
    }

    const message: UnsubscribeMessage = {
      method: ClientMessageType.Unsubscribe,
      params: {
        subuid
      }
    };

    this.sendMessage(message);
    this.subscriptions.delete(subuid);
  }

  /**
   * Sets a value for a topic
   * @param pubuid The publication ID
   * @param value The value
   */
  public setValue(pubuid: number, value: any): void {
    if (!this.publications.has(pubuid)) {
      throw new Error(`Publication ${pubuid} not found`);
    }

    const publication = this.publications.get(pubuid)!;
    const topic = Array.from(this.topics.values()).find(t => t.name === publication.name);

    if (!topic) {
      throw new Error(`Topic ${publication.name} not found`);
    }

    const timestamp = clientTimeToServerTime(getCurrentTimeMicros(), this.serverTimeOffset);
    let dataType: DataType;
    let dataValue: any;

    // Determine the data type based on the value and topic type
    switch (typeof value) {
      case 'boolean':
        dataType = DataType.Boolean;
        dataValue = value;
        break;
      case 'number':
        if (Number.isInteger(value)) {
          dataType = DataType.Integer;
        } else {
          dataType = DataType.Double;
        }
        dataValue = value;
        break;
      case 'string':
        dataType = DataType.String;
        dataValue = value;
        break;
      case 'object':
        if (value === null) {
          throw new Error('Cannot set null value');
        } else if (Array.isArray(value)) {
          if (value.length === 0) {
            throw new Error('Cannot set empty array');
          }

          const firstType = typeof value[0];
          if (firstType === 'boolean') {
            dataType = DataType.BooleanArray;
          } else if (firstType === 'number') {
            if (value.every(v => Number.isInteger(v))) {
              dataType = DataType.IntegerArray;
            } else {
              dataType = DataType.DoubleArray;
            }
          } else if (firstType === 'string') {
            dataType = DataType.StringArray;
          } else {
            throw new Error(`Unsupported array element type: ${firstType}`);
          }
          dataValue = value;
        } else if (value instanceof Uint8Array) {
          dataType = DataType.Raw;
          dataValue = value;
        } else {
          // Assume it's a JSON object
          dataType = DataType.String;
          dataValue = JSON.stringify(value);
        }
        break;
      default:
        throw new Error(`Unsupported value type: ${typeof value}`);
    }

    if (this.ws && this.connected) {
      const binary = encodeValue(topic.id, {
        type: dataType,
        value: dataValue,
        time: timestamp
      });
      this.ws.send(binary);
    }
  }

  /**
   * Gets a topic by name
   * @param name The topic name
   * @returns The topic or undefined if not found
   */
  public getTopic(name: string): Topic | undefined {
    return this.topics.get(name);
  }

  /**
   * Gets all topics
   * @returns An array of all topics
   */
  public getTopics(): Topic[] {
    return Array.from(this.topics.values());
  }

  /**
   * Gets the server time offset
   * @returns The server time offset in microseconds
   */
  public getServerTimeOffset(): number {
    return this.serverTimeOffset;
  }

  /**
   * Checks if the client is connected
   * @returns Whether the client is connected
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Handles a message from the server
   * @param data The message data
   */
  private handleMessage(data: WebSocket.Data): void {
    // Handle binary message (value update or control message)
    if (data instanceof Buffer || data instanceof Uint8Array) {
      try {
        // Try to decode as a control message first
        try {
          const messages = decodeServerMessage(data);

          for (const message of messages) {
            switch (message.method) {
              case ServerMessageType.Announce:
                this.handleAnnounce(message);
                break;
              case ServerMessageType.Unannounce:
                this.handleUnannounce(message);
                break;
              case ServerMessageType.Properties:
                this.handleProperties(message);
                break;
            }
          }
          return;
        } catch (controlError) {
          // Not a control message, try as a value message
        }

        // Try to decode as a single message first
        try {
          const message = decodeBinaryMessage(data);

          // Handle RTT message
          if (message.topicId === -1) {
            this.handleRTTMessage(data);
            return;
          }

          // Handle value update
          const topic = this.topicsById.get(message.topicId);

          if (topic) {
            const value: Value = {
              type: message.type,
              value: message.value,
              time: message.timestamp
            };

            topic.value = value;

            this.emit(NetworkTablesClientEvent.ValueChanged, topic.name, value);
          }
        } catch (singleError: any) {
          // If single message decoding fails, try as multiple messages
          try {
            const messages = decodeBinaryMessages(data);

            for (const message of messages) {
              // Handle RTT message
              if (message.topicId === -1) {
                this.handleRTTMessage(data);
                continue;
              }

              // Handle value update
              const topic = this.topicsById.get(message.topicId);

              if (topic) {
                const value: Value = {
                  type: message.type,
                  value: message.value,
                  time: message.timestamp
                };

                topic.value = value;

                this.emit(NetworkTablesClientEvent.ValueChanged, topic.name, value);
              }
            }
          } catch (multiError: any) {
            // Both single and multiple message decoding failed
            throw new Error(`Failed to decode binary message: ${singleError.message} and ${multiError.message}`);
          }
        }
      } catch (error) {
        console.error('Failed to decode binary message:', error);
      }
      return;
    }

    // Handle text message (legacy support)
    if (typeof data === 'string') {
      try {
        // Convert string to Uint8Array for MessagePack decoding
        const encoder = new TextEncoder();
        const binaryData = encoder.encode(data);

        // Try to decode as a control message
        try {
          const messages = decodeServerMessage(binaryData);

          for (const message of messages) {
            switch (message.method) {
              case ServerMessageType.Announce:
                this.handleAnnounce(message);
                break;
              case ServerMessageType.Unannounce:
                this.handleUnannounce(message);
                break;
              case ServerMessageType.Properties:
                this.handleProperties(message);
                break;
            }
          }
        } catch (error) {
          console.error('Failed to decode text message as control message:', error);
        }
      } catch (error) {
        console.error('Failed to process text message:', error);
      }
    }
  }

  /**
   * Handles an announce message
   * @param message The announce message
   */
  private handleAnnounce(message: any): void {
    const { name, id, type, pubuid, properties } = message.params;

    const topic: Topic = {
      name,
      id,
      type,
      properties
    };

    this.topics.set(name, topic);
    this.topicsById.set(id, topic);

    this.emit(NetworkTablesClientEvent.TopicAnnounced, topic);
  }

  /**
   * Handles an unannounce message
   * @param message The unannounce message
   */
  private handleUnannounce(message: any): void {
    const { name, id } = message.params;

    const topic = this.topics.get(name);

    if (topic) {
      this.topics.delete(name);
      this.topicsById.delete(id);

      this.emit(NetworkTablesClientEvent.TopicUnannounced, topic);
    }
  }

  /**
   * Handles a properties message
   * @param message The properties message
   */
  private handleProperties(message: any): void {
    const { name, properties } = message.params;

    const topic = this.topics.get(name);

    if (topic) {
      // Update properties
      for (const [key, value] of Object.entries(properties)) {
        if (value === null) {
          delete topic.properties[key];
        } else {
          topic.properties[key] = value;
        }
      }

      this.emit(NetworkTablesClientEvent.TopicPropertiesChanged, topic);
    }
  }

  /**
   * Handles an RTT message
   * @param data The message data
   */
  private handleRTTMessage(data: WebSocket.Data): void {
    if (!(data instanceof Buffer) && !(data instanceof Uint8Array)) {
      return;
    }

    try {
      const message = decodeBinaryMessage(data);

      if (message.topicId === -1) {
        const clientReceiveTime = getCurrentTimeMicros();
        const serverTime = message.timestamp;

        // Calculate server time offset
        const offset = calculateServerTimeOffset(
          this.lastPingTime,
          serverTime,
          clientReceiveTime
        );

        this.serverTimeOffset = offset;

        this.emit(NetworkTablesClientEvent.TimeSyncUpdated, offset);
      }
    } catch (error) {
      console.error('Failed to decode RTT message:', error);
    }
  }

  /**
   * Handles a disconnect
   */
  private handleDisconnect(): void {
    this.connected = false;
    this.stopPingTimer();

    this.emit(NetworkTablesClientEvent.Disconnected);

    // Attempt to reconnect
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, this.connectionTimeout);
    }
  }

  /**
   * Sends a message to the server
   * @param message The message to send
   */
  private sendMessage(message: any): void {
    if (this.ws && this.connected) {
      const encoded = encodeClientMessage(message);
      this.ws.send(encoded);
    }
  }

  /**
   * Starts the ping timer
   */
  private startPingTimer(): void {
    this.stopPingTimer();

    this.pingTimer = setInterval(() => {
      this.sendPing();
    }, PING_INTERVAL);
  }

  /**
   * Stops the ping timer
   */
  private stopPingTimer(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    if (this.pingTimeoutTimer) {
      clearTimeout(this.pingTimeoutTimer);
      this.pingTimeoutTimer = null;
    }
  }

  /**
   * Sends a ping to the server
   */
  private sendPing(): void {
    if (!this.ws || !this.connected) {
      return;
    }

    // Send WebSocket ping
    this.ws.ping();

    // Send RTT message as fallback
    this.syncTime();

    // Set ping timeout
    if (this.pingTimeoutTimer) {
      clearTimeout(this.pingTimeoutTimer);
    }

    this.pingTimeoutTimer = setTimeout(() => {
      console.warn('Ping timeout');
      this.handleDisconnect();
    }, PING_TIMEOUT);
  }

  /**
   * Synchronizes time with the server
   */
  private syncTime(): void {
    if (this.ws && this.connected) {
      this.lastPingTime = getCurrentTimeMicros();
      const rtt = encodeRTT(this.lastPingTime);
      this.ws.send(rtt);
    }
  }
}
