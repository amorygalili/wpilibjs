import { Decoder, Encoder } from '@msgpack/msgpack';
import WebSocket from 'ws';

const typestrIdxLookup: { [id: string]: number } = {
  boolean: 0,
  double: 1,
  int: 2,
  float: 3,
  string: 4,
  json: 4,
  raw: 5,
  rpc: 5,
  msgpack: 5,
  protobuf: 5,
  'boolean[]': 16,
  'double[]': 17,
  'int[]': 18,
  'float[]': 19,
  'string[]': 20,
};

export class NT4_Topic {
  uid = -1; // "id" if server topic, "pubuid" if published
  name = '';
  type = '';
  properties: { [id: string]: any } = {};
  value: {
    type: number;
    value: any;
    timestamp: number;
  } | null = null;

  toAnnounceObj() {
    return {
      name: this.name,
      id: this.uid,
      type: this.type,
      properties: this.properties,
      pubuid: this.uid
    };
  }

  toUnannounceObj() {
    return {
      name: this.name
    };
  }

  getTypeIdx() {
    if (this.type in typestrIdxLookup) {
      return typestrIdxLookup[this.type];
    } else {
      return 5; // Default to binary
    }
  }
}

export class NT4_Server {
  private PORT = 5810;
  private serverName: string;
  private onClientConnect: (clientId: string) => void;
  private onClientDisconnect: (clientId: string) => void;
  private onTopicPublish: (topic: NT4_Topic, clientId: string) => void;
  private onTopicUnpublish: (topic: NT4_Topic, clientId: string) => void;
  private onTopicUpdate: (topic: NT4_Topic, value: any, timestamp: number, clientId: string) => void;
  private onSubscribe: (patterns: string[], options: any, clientId: string) => void;
  private onUnsubscribe: (subuid: number, clientId: string) => void;

  private wss: WebSocket.Server | null = null;
  private clients: Map<WebSocket, string> = new Map();
  private topics: Map<string, NT4_Topic> = new Map();
  private nextTopicId = 1;

  private msgpackDecoder = new Decoder();
  private msgpackEncoder = new Encoder();

  /**
   * Creates a new NT4 server.
   * @param serverName Identifier for this server.
   * @param onClientConnect Called when a client connects
   * @param onClientDisconnect Called when a client disconnects
   * @param onTopicPublish Called when a client publishes a topic
   * @param onTopicUnpublish Called when a client unpublishes a topic
   * @param onTopicUpdate Called when a client updates a topic value
   * @param onSubscribe Called when a client subscribes to topics
   * @param onUnsubscribe Called when a client unsubscribes from topics
   */
  constructor(
    serverName: string,
    onClientConnect: (clientId: string) => void,
    onClientDisconnect: (clientId: string) => void,
    onTopicPublish: (topic: NT4_Topic, clientId: string) => void,
    onTopicUnpublish: (topic: NT4_Topic, clientId: string) => void,
    onTopicUpdate: (topic: NT4_Topic, value: any, timestamp: number, clientId: string) => void,
    onSubscribe: (patterns: string[], options: any, clientId: string) => void,
    onUnsubscribe: (subuid: number, clientId: string) => void,
  ) {
    this.serverName = serverName;
    this.onClientConnect = onClientConnect;
    this.onClientDisconnect = onClientDisconnect;
    this.onTopicPublish = onTopicPublish;
    this.onTopicUnpublish = onTopicUnpublish;
    this.onTopicUpdate = onTopicUpdate;
    this.onSubscribe = onSubscribe;
    this.onUnsubscribe = onUnsubscribe;
  }

  /**
   * Start the NT4 server
   * @param port Port to listen on (default: 5810)
   */
  start(port?: number) {
    if (port) {
      this.PORT = port;
    }

    this.wss = new WebSocket.Server({
      port: this.PORT,
      handleProtocols: (protocols, request) => {
        console.log('Client requested protocols:', protocols);
        
        // Convert Set to Array if needed
        const protocolArray = Array.isArray(protocols) ? protocols : Array.from(protocols);
        
        // Check if client supports NT 4.1
        if (protocolArray.indexOf('v4.1.networktables.first.wpi.edu') !== -1) {
          console.log('Using NT 4.1 protocol');
          return 'v4.1.networktables.first.wpi.edu';
        }
        
        // Fall back to NT 4.0
        if (protocolArray.indexOf('networktables.first.wpi.edu') !== -1) {
          console.log('Using NT 4.0 protocol');
          return 'networktables.first.wpi.edu';
        }
        
        // No supported protocol
        console.log('No supported protocol found');
        return false;
      }
    });

    this.wss.on('connection', (ws, request) => {
      const clientId = request.socket.remoteAddress + ':' + request.socket.remotePort;
      console.log(`Client connected: ${clientId}`);
      console.log(`Protocol: ${ws.protocol}`);
      
      // Store client
      this.clients.set(ws, clientId);
      
      // Notify callback
      this.onClientConnect(clientId);
      
      // Send all existing topics to the new client
      for (const topic of this.topics.values()) {
        this.announceTopicToClient(ws, topic);
        
        // Send value if available
        if (topic.value) {
          this.sendValueToClient(ws, topic.uid, topic.value.type, topic.value.value, topic.value.timestamp);
        }
      }
      
      // Handle messages
      ws.on('message', (data) => {
        try {
          if (data instanceof Buffer) {
            console.log('Binary message received, length:', data.length);
            
            // Log the first 16 bytes as hex
            const hexData = Array.from(data.slice(0, Math.min(16, data.length))).map(b => b.toString(16).padStart(2, '0')).join(' ');
            console.log(`First 16 bytes: ${hexData}`);
            
            try {
              // Try to decode as MessagePack
              const decoded = this.msgpackDecoder.decode(data);
              console.log('Decoded MessagePack:', JSON.stringify(decoded));
              
              // Check if it's a time synchronization message
              if (Array.isArray(decoded) && decoded.length === 4 && decoded[0] === -1) {
                this.handleTimeSyncMessage(ws, decoded);
                return;
              }
              
              // Check if it's a value update
              if (Array.isArray(decoded) && decoded.length === 4 && typeof decoded[0] === 'number' && decoded[0] >= 0) {
                this.handleValueMessage(ws, decoded);
                return;
              }
              
              // Handle other binary messages
              this.handleBinaryMessage(ws, decoded);
            } catch (mpError) {
              console.error('Failed to decode MessagePack:', mpError);
              
              // Try to parse as JSON
              try {
                const jsonString = data.toString('utf8');
                console.log('As UTF-8 string:', jsonString);
                
                const jsonData = JSON.parse(jsonString);
                console.log('Parsed JSON:', jsonData);
                
                // Handle JSON message
                this.handleJsonMessage(ws, jsonData);
              } catch (jsonError) {
                console.error('Failed to parse as JSON:', jsonError);
              }
            }
          } else if (typeof data === 'string') {
            console.log('Text message received:', data);
            
            // Try to parse as JSON
            try {
              const jsonData = JSON.parse(data);
              console.log('Parsed JSON:', jsonData);
              
              // Handle JSON message
              this.handleJsonMessage(ws, jsonData);
            } catch (jsonError) {
              console.error('Failed to parse JSON:', jsonError);
            }
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });
      
      // Handle close
      ws.on('close', () => {
        const clientId = this.clients.get(ws);
        if (clientId) {
          console.log(`Client disconnected: ${clientId}`);
          this.clients.delete(ws);
          this.onClientDisconnect(clientId);
        }
      });
      
      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    console.log(`NT4 Server started on port ${this.PORT}`);
  }

  /**
   * Stop the NT4 server
   */
  stop() {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
      this.clients.clear();
      console.log('NT4 Server stopped');
    }
  }

  /**
   * Create a new topic on the server
   * @param name Topic name
   * @param type Topic type
   * @param properties Topic properties
   * @param value Initial value (optional)
   * @returns The created topic
   */
  createTopic(name: string, type: string, properties: { [id: string]: any } = {}, value?: any): NT4_Topic {
    // Check if topic already exists
    if (this.topics.has(name)) {
      return this.topics.get(name)!;
    }
    
    // Create new topic
    const topic = new NT4_Topic();
    topic.name = name;
    topic.type = type;
    topic.uid = this.nextTopicId++;
    topic.properties = { ...properties };
    
    // Set initial value if provided
    if (value !== undefined) {
      const timestamp = Date.now() * 1000; // Convert to microseconds
      topic.value = {
        type: topic.getTypeIdx(),
        value,
        timestamp
      };
    }
    
    // Store topic
    this.topics.set(name, topic);
    
    // Announce to all clients
    this.announceTopic(topic);
    
    // Send value if available
    if (topic.value) {
      this.broadcastValue(topic.uid, topic.value.type, topic.value.value, topic.value.timestamp);
    }
    
    return topic;
  }

  /**
   * Remove a topic from the server
   * @param name Topic name
   */
  removeTopic(name: string) {
    const topic = this.topics.get(name);
    if (topic) {
      this.topics.delete(name);
      this.unannounceTopic(topic);
    }
  }

  /**
   * Update a topic's value
   * @param name Topic name
   * @param value New value
   * @param timestamp Timestamp in microseconds (optional, defaults to current time)
   */
  updateTopic(name: string, value: any, timestamp?: number) {
    const topic = this.topics.get(name);
    if (!topic) {
      console.error(`Topic ${name} not found`);
      return;
    }
    
    // Set timestamp if not provided
    if (timestamp === undefined) {
      timestamp = Date.now() * 1000; // Convert to microseconds
    }
    
    // Update topic value
    topic.value = {
      type: topic.getTypeIdx(),
      value,
      timestamp
    };
    
    // Broadcast to all clients
    this.broadcastValue(topic.uid, topic.value.type, topic.value.value, topic.value.timestamp);
  }

  /**
   * Set properties for a topic
   * @param name Topic name
   * @param properties Properties to set
   */
  setTopicProperties(name: string, properties: { [id: string]: any }) {
    const topic = this.topics.get(name);
    if (!topic) {
      console.error(`Topic ${name} not found`);
      return;
    }
    
    // Update properties
    for (const [key, value] of Object.entries(properties)) {
      if (value === null) {
        delete topic.properties[key];
      } else {
        topic.properties[key] = value;
      }
    }
    
    // Broadcast to all clients
    this.broadcastProperties(name, topic.properties);
  }

  //////////////////////////////////////////////////////////////
  // Message Handlers

  private handleJsonMessage(ws: WebSocket, message: any) {
    // Check if it's an array (control message)
    if (Array.isArray(message)) {
      for (const msg of message) {
        this.handleControlMessage(ws, msg);
      }
    } else {
      console.warn('Received unknown JSON message format:', message);
    }
  }

  private handleBinaryMessage(ws: WebSocket, message: any) {
    console.warn('Received unknown binary message format:', message);
  }

  private handleControlMessage(ws: WebSocket, message: any) {
    if (!message.method) {
      console.warn('Invalid control message, missing method:', message);
      return;
    }

    const clientId = this.clients.get(ws) || 'unknown';
    console.log(`Processing method: ${message.method} from client ${clientId}`);

    switch (message.method) {
      case 'publish':
        this.handlePublish(ws, message.params);
        break;
      case 'unpublish':
        this.handleUnpublish(ws, message.params);
        break;
      case 'subscribe':
        this.handleSubscribe(ws, message.params);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(ws, message.params);
        break;
      case 'setproperties':
        this.handleSetProperties(ws, message.params);
        break;
      default:
        console.warn('Unknown method:', message.method);
    }
  }

  private handlePublish(ws: WebSocket, params: any) {
    const { name, type, pubuid, properties } = params;
    const clientId = this.clients.get(ws) || 'unknown';

    console.log(`Client ${clientId} publishing topic: ${name} (${type})`);
    
    // Create or update topic
    let topic: NT4_Topic;
    
    if (this.topics.has(name)) {
      // Update existing topic
      topic = this.topics.get(name)!;
      topic.type = type;
      
      // Update properties
      for (const [key, value] of Object.entries(properties)) {
        if (value === null) {
          delete topic.properties[key];
        } else {
          topic.properties[key] = value;
        }
      }
      
      // Broadcast properties update
      this.broadcastProperties(name, topic.properties);
    } else {
      // Create new topic
      topic = new NT4_Topic();
      topic.name = name;
      topic.type = type;
      topic.uid = this.nextTopicId++;
      topic.properties = { ...properties };
      
      this.topics.set(name, topic);
      
      // Announce to all clients
      this.announceTopic(topic);
    }
    
    // Notify callback
    this.onTopicPublish(topic, clientId);
  }

  private handleUnpublish(ws: WebSocket, params: any) {
    const { pubuid } = params;
    const clientId = this.clients.get(ws) || 'unknown';

    console.log(`Client ${clientId} unpublishing topic with pubuid: ${pubuid}`);
    
    // Find topic by pubuid
    for (const [name, topic] of this.topics.entries()) {
      if (topic.properties.pubuid === pubuid) {
        // Remove topic
        this.topics.delete(name);
        
        // Unannounce to all clients
        this.unannounceTopic(topic);
        
        // Notify callback
        this.onTopicUnpublish(topic, clientId);
        
        break;
      }
    }
  }

  private handleSubscribe(ws: WebSocket, params: any) {
    const { subuid, topics: topicPatterns, options = {} } = params;
    const clientId = this.clients.get(ws) || 'unknown';

    console.log(`Client ${clientId} subscribing with subuid: ${subuid}`);
    console.log('Topic patterns:', topicPatterns);
    console.log('Options:', options);
    
    // Send matching topics
    for (const topic of this.topics.values()) {
      if (this.topicMatchesPatterns(topic.name, topicPatterns, options)) {
        // Send value if available
        if (topic.value) {
          this.sendValueToClient(ws, topic.uid, topic.value.type, topic.value.value, topic.value.timestamp);
        }
      }
    }
    
    // Notify callback
    this.onSubscribe(topicPatterns, options, clientId);
  }

  private handleUnsubscribe(ws: WebSocket, params: any) {
    const { subuid } = params;
    const clientId = this.clients.get(ws) || 'unknown';

    console.log(`Client ${clientId} unsubscribing: ${subuid}`);
    
    // Notify callback
    this.onUnsubscribe(subuid, clientId);
  }

  private handleSetProperties(ws: WebSocket, params: any) {
    const { name, update } = params;
    const clientId = this.clients.get(ws) || 'unknown';

    console.log(`Client ${clientId} setting properties for topic: ${name}`);
    
    // Check if topic exists
    if (this.topics.has(name)) {
      const topic = this.topics.get(name)!;
      
      // Update properties
      for (const [key, value] of Object.entries(update)) {
        if (value === null) {
          delete topic.properties[key];
        } else {
          topic.properties[key] = value;
        }
      }
      
      // Broadcast to all clients
      this.broadcastProperties(name, topic.properties);
    }
  }

  private handleValueMessage(ws: WebSocket, message: any) {
    const [id, timestamp, type, value] = message;
    const clientId = this.clients.get(ws) || 'unknown';

    console.log(`Client ${clientId} updating value for ID ${id}`);
    
    // Find topic by ID
    let topic: NT4_Topic | null = null;
    for (const t of this.topics.values()) {
      if (t.uid === id) {
        topic = t;
        break;
      }
    }
    
    if (topic) {
      // Update topic value
      topic.value = {
        timestamp,
        type,
        value
      };
      
      // Broadcast to all clients
      this.broadcastValue(id, type, value, timestamp);
      
      // Notify callback
      this.onTopicUpdate(topic, value, timestamp, clientId);
    } else {
      console.warn(`No topic found with ID ${id}`);
    }
  }

  private handleTimeSyncMessage(ws: WebSocket, message: any) {
    // message format: [-1, clientIndex, sequenceNumber, clientTime]
    const [messageType, clientIndex, sequenceNumber, clientTime] = message;
    
    console.log(`Received time sync message: type=${messageType}, clientIndex=${clientIndex}, seq=${sequenceNumber}, clientTime=${clientTime}`);
    
    // Respond with a time sync response
    const serverTime = Date.now() * 1000; // Convert to microseconds
    const response = [-1, clientIndex, sequenceNumber, clientTime, serverTime];
    
    console.log(`Sending time sync response:`, response);
    
    // Send as binary MessagePack
    const encoded = this.msgpackEncoder.encode(response);
    ws.send(encoded);
  }

  //////////////////////////////////////////////////////////////
  // Helper Methods

  private topicMatchesPatterns(topicName: string, patterns: string[], options: any): boolean {
    const prefixMatch = options.prefix === true;
    
    for (const pattern of patterns) {
      if (prefixMatch) {
        if (topicName.startsWith(pattern)) {
          return true;
        }
      } else {
        if (topicName === pattern) {
          return true;
        }
      }
    }
    
    return false;
  }

  private announceTopicToClient(ws: WebSocket, topic: NT4_Topic) {
    const message = {
      method: 'announce',
      params: topic.toAnnounceObj()
    };
    
    const jsonMessage = JSON.stringify([message]);
    ws.send(jsonMessage);
    
    console.log(`Announced topic ${topic.name} to client`);
  }

  private sendValueToClient(ws: WebSocket, id: number, type: number, value: any, timestamp: number) {
    const message = [id, timestamp, type, value];
    
    // Send as binary MessagePack
    const encoded = this.msgpackEncoder.encode(message);
    ws.send(encoded);
    
    console.log(`Sent value for ID ${id} to client`);
  }

  private announceTopic(topic: NT4_Topic) {
    const message = {
      method: 'announce',
      params: topic.toAnnounceObj()
    };
    
    // Send as JSON array
    const jsonMessage = JSON.stringify([message]);
    this.broadcast(jsonMessage);
    
    console.log(`Topic announced: ${topic.name} (${topic.type})`);
  }

  private unannounceTopic(topic: NT4_Topic) {
    const message = {
      method: 'unannounce',
      params: topic.toUnannounceObj()
    };
    
    const jsonMessage = JSON.stringify([message]);
    this.broadcast(jsonMessage);
    
    console.log(`Topic unannounced: ${topic.name}`);
  }

  private broadcastProperties(name: string, properties: { [id: string]: any }) {
    const message = {
      method: 'properties',
      params: {
        name,
        properties
      }
    };
    
    const jsonMessage = JSON.stringify([message]);
    this.broadcast(jsonMessage);
    
    console.log(`Properties updated for topic: ${name}`);
  }

  private broadcastValue(id: number, type: number, value: any, timestamp: number) {
    // Create value message
    const message = [id, timestamp, type, value];
    
    // Send as binary MessagePack
    const encoded = this.msgpackEncoder.encode(message);
    this.broadcast(encoded);
    
    // Find topic name for this ID
    let topicName = 'unknown';
    for (const [name, topic] of this.topics.entries()) {
      if (topic.uid === id) {
        topicName = name;
        break;
      }
    }
    
    console.log(`Value updated for ${topicName}: id=${id}, type=${type}`);
  }

  private broadcast(message: string | Buffer) {
    if (!this.wss) return;
    
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}
