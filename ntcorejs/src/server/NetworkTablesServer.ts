import WebSocket from 'ws';
import { EventEmitter } from 'events';
import {
  NT4_SUBPROTOCOL,
  NT4_FALLBACK_SUBPROTOCOL,
  RTT_SUBPROTOCOL,
  PING_INTERVAL,
  PING_TIMEOUT,
  encodeServerMessage,
  encodeValue,
  encodeRTT,
  decodeClientMessage,
  decodeBinaryMessage,
  decodeBinaryMessages
} from '../protocol';
import {
  ClientMessageType,
  ServerMessageType,
  AnnounceMessage,
  UnannounceMessage,
  PropertiesMessage,
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
  topicMatches,
  generateId
} from '../utils';

/**
 * NetworkTables server events
 */
export enum NetworkTablesServerEvent {
  Started = 'started',
  Stopped = 'stopped',
  ClientConnected = 'clientConnected',
  ClientDisconnected = 'clientDisconnected',
  TopicPublished = 'topicPublished',
  TopicUnpublished = 'topicUnpublished',
  TopicPropertiesChanged = 'topicPropertiesChanged',
  ValueChanged = 'valueChanged'
}

/**
 * NetworkTables server options
 */
export interface NetworkTablesServerOptions {
  port?: number;
  persistentFilePath?: string;
}

/**
 * NetworkTables server client
 */
interface Client {
  id: string;
  ws: WebSocket;
  subscriptions: Map<number, Subscription>;
  publications: Map<number, number>; // pubuid -> topicId
  lastPingTime: number;
  pingTimeoutTimer: NodeJS.Timeout | null;
  version: number; // 0x0400 or 0x0401
}

/**
 * NetworkTables server
 */
export class NetworkTablesServer extends EventEmitter {
  private wss: WebSocket.Server | null = null;
  private port: number;
  private persistentFilePath: string | null;
  private running: boolean = false;
  private clients: Map<string, Client> = new Map();
  private topics: Map<string, Topic> = new Map();
  private topicsById: Map<number, Topic> = new Map();
  private nextTopicId: number = 1;
  private pingTimer: NodeJS.Timeout | null = null;

  /**
   * Creates a new NetworkTables server
   * @param options The server options
   */
  constructor(options: NetworkTablesServerOptions = {}) {
    super();
    this.port = options.port || 5810;
    this.persistentFilePath = options.persistentFilePath || null;
  }

  /**
   * Starts the NetworkTables server
   */
  public start(): void {
    if (this.running) {
      return;
    }

    // Create main WebSocket server with a simpler configuration
    this.wss = new WebSocket.Server({
      port: this.port
    });

    // Set up main WebSocket server events
    this.wss.on('connection', (ws, request) => {
      this.handleConnection(ws, request);
    });

    // Start ping timer and emit started event
    this.running = true;
    this.startPingTimer();
    this.emit(NetworkTablesServerEvent.Started, this.port);

    // Load persistent values if available
    if (this.persistentFilePath) {
      this.loadPersistentValues();
    }
  }

  /**
   * Stops the NetworkTables server
   */
  public stop(): void {
    if (!this.running) {
      return;
    }

    // Save persistent values if enabled
    if (this.persistentFilePath) {
      this.savePersistentValues();
    }

    this.stopPingTimer();

    // Close all client connections
    for (const client of this.clients.values()) {
      client.ws.terminate();
      if (client.pingTimeoutTimer) {
        clearTimeout(client.pingTimeoutTimer);
      }
    }

    this.clients.clear();

    // Close WebSocket server
    if (this.wss) {
      this.wss.close(() => {
        this.running = false;
        this.emit(NetworkTablesServerEvent.Stopped);
      });
      this.wss = null;
    } else {
      this.running = false;
      this.emit(NetworkTablesServerEvent.Stopped);
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
   * Gets all clients
   * @returns An array of client IDs
   */
  public getClients(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Checks if the server is running
   * @returns Whether the server is running
   */
  public isRunning(): boolean {
    return this.running;
  }

  /**
   * Handles a WebSocket connection
   * @param ws The WebSocket connection
   * @param request The HTTP request
   */
  private handleConnection(ws: WebSocket, request: any): void {
    const clientId = `${request.socket.remoteAddress}:${request.socket.remotePort}`;
    // Use a fixed version since we're not checking protocols
    const version = 0x0400;

    // Create client
    const client: Client = {
      id: clientId,
      ws,
      subscriptions: new Map(),
      publications: new Map(),
      lastPingTime: 0,
      pingTimeoutTimer: null,
      version
    };

    this.clients.set(clientId, client);

    // Set up WebSocket events
    ws.on('message', (data) => {
      this.handleMessage(client, data);
    });

    ws.on('close', () => {
      this.handleDisconnect(client);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      this.handleDisconnect(client);
    });

    ws.on('pong', () => {
      // Reset ping timeout
      if (client.pingTimeoutTimer) {
        clearTimeout(client.pingTimeoutTimer);
        client.pingTimeoutTimer = null;
      }
    });

    // Announce existing topics to the new client
    for (const topic of this.topics.values()) {
      this.sendAnnounce(client, topic);
    }

    this.emit(NetworkTablesServerEvent.ClientConnected, clientId);
  }

  /**
   * Handles a message from a client
   * @param client The client
   * @param data The message data
   */
  private handleMessage(client: Client, data: WebSocket.Data): void {
    // Handle binary message (value update or control message)
    if (data instanceof Buffer || data instanceof Uint8Array) {
      try {
        // Try to decode as a control message first
        try {
          const messages = decodeClientMessage(data);

          for (const message of messages) {
            switch (message.method) {
              case ClientMessageType.Publish:
                this.handlePublish(client, message);
                break;
              case ClientMessageType.Unpublish:
                this.handleUnpublish(client, message);
                break;
              case ClientMessageType.Subscribe:
                this.handleSubscribe(client, message);
                break;
              case ClientMessageType.Unsubscribe:
                this.handleUnsubscribe(client, message);
                break;
              case ClientMessageType.SetProperties:
                this.handleSetProperties(client, message);
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
            const serverTime = getCurrentTimeMicros();
            const rtt = encodeRTT(serverTime);
            client.ws.send(rtt);
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

            // Broadcast value to all subscribed clients
            this.broadcastValue(topic, value, client.id);

            this.emit(NetworkTablesServerEvent.ValueChanged, topic.name, value);
          }
        } catch (singleError: any) {
          // If single message decoding fails, try as multiple messages
          try {
            const messages = decodeBinaryMessages(data);

            for (const message of messages) {
              // Handle RTT message
              if (message.topicId === -1) {
                const serverTime = getCurrentTimeMicros();
                const rtt = encodeRTT(serverTime);
                client.ws.send(rtt);
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

                // Broadcast value to all subscribed clients
                this.broadcastValue(topic, value, client.id);

                this.emit(NetworkTablesServerEvent.ValueChanged, topic.name, value);
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
          const messages = decodeClientMessage(binaryData);

          for (const message of messages) {
            switch (message.method) {
              case ClientMessageType.Publish:
                this.handlePublish(client, message);
                break;
              case ClientMessageType.Unpublish:
                this.handleUnpublish(client, message);
                break;
              case ClientMessageType.Subscribe:
                this.handleSubscribe(client, message);
                break;
              case ClientMessageType.Unsubscribe:
                this.handleUnsubscribe(client, message);
                break;
              case ClientMessageType.SetProperties:
                this.handleSetProperties(client, message);
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
   * Handles a publish message
   * @param client The client
   * @param message The publish message
   */
  private handlePublish(client: Client, message: any): void {
    const { name, type, pubuid, properties } = message.params;

    // Check if topic already exists
    let topic = this.topics.get(name);

    if (topic) {

      // Update existing topic
      topic.type = type;

      // Update properties
      for (const [key, value] of Object.entries(properties)) {
        topic.properties[key] = value;
      }

      // Associate publication with client
      client.publications.set(pubuid, topic.id);

      // Notify clients of property changes
      this.broadcastProperties(topic);

      this.emit(NetworkTablesServerEvent.TopicPropertiesChanged, topic);
    } else {
      // Create new topic
      const id = this.nextTopicId++;

      topic = {
        name,
        id,
        type,
        properties: { ...properties }
      };

      this.topics.set(name, topic);
      this.topicsById.set(id, topic);

      // Associate publication with client
      client.publications.set(pubuid, id);

      // Announce new topic to all clients
      this.broadcastAnnounce(topic, pubuid);

      // Also send the announcement directly to the publishing client
      this.sendAnnounce(client, topic, pubuid);

      this.emit(NetworkTablesServerEvent.TopicPublished, topic);
    }
  }

  /**
   * Handles an unpublish message
   * @param client The client
   * @param message The unpublish message
   */
  private handleUnpublish(client: Client, message: any): void {
    const { pubuid } = message.params;

    const topicId = client.publications.get(pubuid);

    if (topicId !== undefined) {
      const topic = this.topicsById.get(topicId);

      if (topic) {
        // Remove topic
        this.topics.delete(topic.name);
        this.topicsById.delete(topicId);

        // Remove publication from client
        client.publications.delete(pubuid);

        // Announce topic removal to all clients
        this.broadcastUnannounce(topic);

        this.emit(NetworkTablesServerEvent.TopicUnpublished, topic);
      }
    }
  }

  /**
   * Handles a set properties message
   * @param client The client
   * @param message The set properties message
   */
  private handleSetProperties(client: Client, message: any): void {
    const { name, update } = message.params;

    const topic = this.topics.get(name);

    if (topic) {
      // Update properties
      for (const [key, value] of Object.entries(update)) {
        if (value === null) {
          delete topic.properties[key];
        } else {
          topic.properties[key] = value;
        }
      }

      // Broadcast property changes to all clients
      this.broadcastProperties(topic);

      this.emit(NetworkTablesServerEvent.TopicPropertiesChanged, topic);
    }
  }

  /**
   * Handles a subscribe message
   * @param client The client
   * @param message The subscribe message
   */
  private handleSubscribe(client: Client, message: any): void {
    const { subuid, topics, options = {} } = message.params;

    // Store subscription
    client.subscriptions.set(subuid, {
      id: subuid,
      topics,
      options: options as PubSubOptions
    });

    // Send current values for matching topics
    for (const topic of this.topics.values()) {
      if (this.topicMatchesSubscription(topic.name, topics, options)) {
        // Send value if available and cached
        if (topic.value && (topic.properties.cached !== false)) {
          const binary = encodeValue(topic.id, topic.value);
          client.ws.send(binary);
        }
      }
    }
  }

  /**
   * Handles an unsubscribe message
   * @param client The client
   * @param message The unsubscribe message
   */
  private handleUnsubscribe(client: Client, message: any): void {
    const { subuid } = message.params;

    // Remove subscription
    client.subscriptions.delete(subuid);
  }

  /**
   * Handles a client disconnect
   * @param client The client
   */
  private handleDisconnect(client: Client): void {
    // Clean up client resources
    if (client.pingTimeoutTimer) {
      clearTimeout(client.pingTimeoutTimer);
    }

    // Remove client's publications
    for (const [pubuid, topicId] of client.publications.entries()) {
      const topic = this.topicsById.get(topicId);

      if (topic) {
        // Remove topic
        this.topics.delete(topic.name);
        this.topicsById.delete(topicId);

        // Announce topic removal to all clients
        this.broadcastUnannounce(topic);

        this.emit(NetworkTablesServerEvent.TopicUnpublished, topic);
      }
    }

    // Remove client
    this.clients.delete(client.id);

    this.emit(NetworkTablesServerEvent.ClientDisconnected, client.id);
  }

  /**
   * Broadcasts a topic announcement to all clients
   * @param topic The topic
   * @param pubuid The publication ID
   * @param excludeClientId The client ID to exclude
   */
  private broadcastAnnounce(topic: Topic, pubuid?: number, excludeClientId?: string): void {
    for (const client of this.clients.values()) {
      if (client.id !== excludeClientId) {
        this.sendAnnounce(client, topic, pubuid);
      }
    }
  }

  /**
   * Sends a topic announcement to a client
   * @param client The client
   * @param topic The topic
   * @param pubuid The publication ID
   */
  private sendAnnounce(client: Client, topic: Topic, pubuid?: number): void {
    const message: AnnounceMessage = {
      method: ServerMessageType.Announce,
      params: {
        name: topic.name,
        id: topic.id,
        type: topic.type,
        pubuid,
        properties: topic.properties
      }
    };

    const encoded = encodeServerMessage(message);
    client.ws.send(encoded);
  }

  /**
   * Broadcasts a topic unannouncement to all clients
   * @param topic The topic
   */
  private broadcastUnannounce(topic: Topic): void {
    for (const client of this.clients.values()) {
      this.sendUnannounce(client, topic);
    }
  }

  /**
   * Sends a topic unannouncement to a client
   * @param client The client
   * @param topic The topic
   */
  private sendUnannounce(client: Client, topic: Topic): void {
    const message: UnannounceMessage = {
      method: ServerMessageType.Unannounce,
      params: {
        name: topic.name,
        id: topic.id
      }
    };

    const encoded = encodeServerMessage(message);
    client.ws.send(encoded);
  }

  /**
   * Broadcasts property changes to all clients
   * @param topic The topic
   */
  private broadcastProperties(topic: Topic): void {
    for (const client of this.clients.values()) {
      this.sendProperties(client, topic);
    }
  }

  /**
   * Sends property changes to a client
   * @param client The client
   * @param topic The topic
   */
  private sendProperties(client: Client, topic: Topic): void {
    const message: PropertiesMessage = {
      method: ServerMessageType.Properties,
      params: {
        name: topic.name,
        properties: topic.properties
      }
    };

    const encoded = encodeServerMessage(message);
    client.ws.send(encoded);
  }

  /**
   * Broadcasts a value to all subscribed clients
   * @param topic The topic
   * @param value The value
   * @param excludeClientId The client ID to exclude
   */
  private broadcastValue(topic: Topic, value: Value, excludeClientId?: string): void {
    const binary = encodeValue(topic.id, value);

    for (const client of this.clients.values()) {
      if (client.id === excludeClientId) {
        continue;
      }

      // Check if client is subscribed to this topic
      let subscribed = false;

      for (const subscription of client.subscriptions.values()) {
        if (this.topicMatchesSubscription(topic.name, subscription.topics, subscription.options)) {
          subscribed = true;
          break;
        }
      }

      if (subscribed) {
        client.ws.send(binary);
      }
    }
  }

  /**
   * Checks if a topic matches a subscription
   * @param topicName The topic name
   * @param subscriptionTopics The subscription topics
   * @param options The subscription options
   * @returns Whether the topic matches the subscription
   */
  private topicMatchesSubscription(
    topicName: string,
    subscriptionTopics: string[],
    options: PubSubOptions = {}
  ): boolean {
    const prefixMatch = options.prefixMatch || false;

    for (const pattern of subscriptionTopics) {
      if (topicMatches(topicName, pattern, prefixMatch)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Starts the ping timer
   */
  private startPingTimer(): void {
    this.stopPingTimer();

    this.pingTimer = setInterval(() => {
      this.pingClients();
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
  }

  /**
   * Pings all clients
   */
  private pingClients(): void {
    for (const client of this.clients.values()) {
      // Skip ping for NT 4.0 clients
      if (client.version === 0x0400) {
        continue;
      }

      // Send WebSocket ping
      client.ws.ping();

      // Set ping timeout
      if (client.pingTimeoutTimer) {
        clearTimeout(client.pingTimeoutTimer);
      }

      client.pingTimeoutTimer = setTimeout(() => {
        console.warn(`Ping timeout for client ${client.id}`);
        client.ws.terminate();
        this.handleDisconnect(client);
      }, PING_TIMEOUT);
    }
  }

  /**
   * Loads persistent values from a file
   */
  private loadPersistentValues(): void {
    // This would load persistent values from a file
    // Not implemented in this example
  }

  /**
   * Saves persistent values to a file
   */
  private savePersistentValues(): void {
    // This would save persistent values to a file
    // Not implemented in this example
  }
}
