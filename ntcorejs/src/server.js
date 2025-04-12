/**
 * NetworkTables 4.1 Server
 * 
 * This is a server implementation of the NetworkTables 4.1 protocol.
 */

const WebSocket = require('ws');
const msgpack = require('@msgpack/msgpack');
const EventEmitter = require('events');

// Define data types
const DataType = {
  Boolean: 0,
  Double: 1,
  Int: 2,
  Float: 3,
  String: 4,
  Raw: 5,
  BooleanArray: 16,
  DoubleArray: 17,
  IntArray: 18,
  FloatArray: 19,
  StringArray: 20
};

class NetworkTablesServer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      port: 5810,
      protocol: 'v4.1.networktables.first.wpi.edu',
      ...options
    };
    
    this.topics = new Map();
    this.clients = new Map();
    this.nextTopicId = 1;
    this.nextClientId = 1;
    this.wss = null;
  }
  
  /**
   * Start the server
   */
  start() {
    this.emit('debug', `Starting server on port ${this.options.port}...`);
    
    this.wss = new WebSocket.Server({
      port: this.options.port,
      // Support both NT 4.0 and 4.1 protocols
      handleProtocols: (protocols, request) => {
        this.emit('debug', 'Client requested protocols: ' + JSON.stringify(Array.from(protocols)));
        
        // Convert Set to Array if needed
        const protocolArray = Array.isArray(protocols) ? protocols : Array.from(protocols);
        
        // Check if client supports NT 4.1
        if (protocolArray.indexOf(this.options.protocol) !== -1) {
          this.emit('debug', `Using ${this.options.protocol} protocol`);
          return this.options.protocol;
        }
        
        // Fall back to NT 4.0
        if (protocolArray.indexOf('networktables.first.wpi.edu') !== -1) {
          this.emit('debug', 'Using NT 4.0 protocol');
          return 'networktables.first.wpi.edu';
        }
        
        // No supported protocol
        this.emit('debug', 'No supported protocol found');
        return false;
      }
    });
    
    // Handle connections
    this.wss.on('connection', (ws, request) => {
      const clientId = this.nextClientId++;
      const clientInfo = {
        id: clientId,
        address: request.socket.remoteAddress,
        protocol: ws.protocol,
        subscriptions: new Map(),
        publications: new Map()
      };
      
      this.clients.set(clientId, clientInfo);
      
      this.emit('debug', `Client ${clientId} connected from ${clientInfo.address}`);
      this.emit('debug', `Protocol: ${clientInfo.protocol}`);
      this.emit('clientConnected', clientId, clientInfo);
      
      // Handle messages
      ws.on('message', (data) => {
        try {
          if (data instanceof Buffer) {
            this.emit('debug', `Binary message from client ${clientId}, length: ${data.length}`);
            this.emit('debug', `First 32 bytes: ${Array.from(data.slice(0, Math.min(32, data.length))).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
            
            try {
              // Try to decode as MessagePack
              const decoded = msgpack.decode(data);
              this.emit('debug', `Decoded MessagePack: ${JSON.stringify(decoded)}`);
              
              // Handle binary message
              this.handleBinaryMessage(ws, clientInfo, decoded);
            } catch (mpError) {
              this.emit('debug', `Failed to decode MessagePack: ${mpError}`);
              
              // Try to parse as JSON
              try {
                const jsonString = data.toString('utf8');
                this.emit('debug', `As UTF-8: ${jsonString}`);
                
                try {
                  const jsonData = JSON.parse(jsonString);
                  this.emit('debug', `Parsed JSON: ${JSON.stringify(jsonData)}`);
                  
                  // Handle JSON message
                  this.handleJsonMessage(ws, clientInfo, jsonData);
                } catch (jsonError) {
                  this.emit('debug', `Failed to parse JSON: ${jsonError}`);
                }
              } catch (error) {
                this.emit('debug', `Not valid UTF-8: ${error}`);
              }
            }
          } else if (typeof data === 'string') {
            this.emit('debug', `Text message from client ${clientId}: ${data}`);
            
            try {
              const jsonData = JSON.parse(data);
              this.emit('debug', `Parsed JSON: ${JSON.stringify(jsonData)}`);
              
              // Handle JSON message
              this.handleJsonMessage(ws, clientInfo, jsonData);
            } catch (jsonError) {
              this.emit('debug', `Failed to parse JSON: ${jsonError}`);
            }
          }
        } catch (error) {
          this.emit('debug', `Error processing message from client ${clientId}: ${error}`);
        }
      });
      
      // Handle close
      ws.on('close', () => {
        this.emit('debug', `Client ${clientId} disconnected`);
        this.emit('clientDisconnected', clientId);
        
        // Remove client
        this.clients.delete(clientId);
        
        // Remove client's publications
        for (const [pubuid, publication] of clientInfo.publications.entries()) {
          const { name } = publication;
          
          // Remove topic
          if (this.topics.has(name)) {
            const topic = this.topics.get(name);
            
            if (topic.publisher === clientId) {
              this.topics.delete(name);
              
              // Broadcast unannounce to all clients
              this.broadcastUnannounce(name);
            }
          }
        }
      });
      
      // Handle errors
      ws.on('error', (error) => {
        this.emit('debug', `WebSocket error for client ${clientId}: ${error}`);
      });
      
      // Store WebSocket on client info
      clientInfo.ws = ws;
      
      // Send all topics to the client
      for (const topic of this.topics.values()) {
        this.sendAnnounce(ws, topic);
      }
    });
    
    this.emit('debug', `Server started on port ${this.options.port}`);
    this.emit('started');
  }
  
  /**
   * Stop the server
   */
  stop() {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
      
      // Clear topics and clients
      this.topics.clear();
      this.clients.clear();
      
      this.emit('debug', 'Server stopped');
      this.emit('stopped');
    }
  }
  
  /**
   * Handle binary message
   * @param {WebSocket} ws - The WebSocket connection
   * @param {Object} clientInfo - The client info
   * @param {Array} message - The decoded MessagePack message
   */
  handleBinaryMessage(ws, clientInfo, message) {
    // Check if it's a value update
    if (Array.isArray(message) && message.length === 4) {
      const [id, timestamp, type, value] = message;
      this.emit('debug', `Value update from client ${clientInfo.id}: id=${id}, type=${type}, value=${JSON.stringify(value)}`);
      
      // Find topic by ID
      for (const [name, topic] of this.topics.entries()) {
        if (topic.id === id) {
          // Check if client is the publisher
          if (topic.publisher === clientInfo.id) {
            // Update topic value
            topic.value = {
              timestamp,
              type,
              value
            };
            
            // Broadcast value to all clients
            this.broadcastValue(id, type, value, timestamp);
            
            // Emit value update event
            this.emit('valueChanged', name, value, timestamp, type, clientInfo.id);
          } else {
            this.emit('debug', `Client ${clientInfo.id} is not the publisher of topic ${name}`);
          }
          
          break;
        }
      }
    }
  }
  
  /**
   * Handle JSON message
   * @param {WebSocket} ws - The WebSocket connection
   * @param {Object} clientInfo - The client info
   * @param {Object} message - The parsed JSON message
   */
  handleJsonMessage(ws, clientInfo, message) {
    // Check if it's an array (control message)
    if (Array.isArray(message)) {
      for (const msg of message) {
        this.handleControlMessage(ws, clientInfo, msg);
      }
    }
  }
  
  /**
   * Handle control message
   * @param {WebSocket} ws - The WebSocket connection
   * @param {Object} clientInfo - The client info
   * @param {Object} message - The control message
   */
  handleControlMessage(ws, clientInfo, message) {
    if (!message.method) {
      this.emit('debug', `Invalid control message from client ${clientInfo.id}, missing method: ${JSON.stringify(message)}`);
      return;
    }
    
    this.emit('debug', `Control message from client ${clientInfo.id}: ${message.method}`);
    
    switch (message.method) {
      case 'publish':
        this.handlePublish(ws, clientInfo, message);
        break;
      case 'unpublish':
        this.handleUnpublish(ws, clientInfo, message);
        break;
      case 'subscribe':
        this.handleSubscribe(ws, clientInfo, message);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(ws, clientInfo, message);
        break;
      case 'setproperties':
        this.handleSetProperties(ws, clientInfo, message);
        break;
      default:
        this.emit('debug', `Unknown method from client ${clientInfo.id}: ${message.method}`);
    }
  }
  
  /**
   * Handle publish message
   * @param {WebSocket} ws - The WebSocket connection
   * @param {Object} clientInfo - The client info
   * @param {Object} message - The publish message
   */
  handlePublish(ws, clientInfo, message) {
    const { name, type, pubuid, properties } = message.params;
    
    this.emit('debug', `Client ${clientInfo.id} publishing topic: ${name} (${type})`);
    
    // Check if topic already exists
    if (this.topics.has(name)) {
      // Update existing topic
      const topic = this.topics.get(name);
      topic.type = type;
      
      // Update properties
      for (const [key, value] of Object.entries(properties)) {
        topic.properties[key] = value;
      }
      
      // Broadcast properties to all clients
      this.broadcastProperties(name, topic.properties);
    } else {
      // Create new topic
      const id = this.nextTopicId++;
      const topic = {
        id,
        name,
        type,
        properties: { ...properties },
        value: null,
        publisher: clientInfo.id,
        pubuid
      };
      
      this.topics.set(name, topic);
      
      // Store publication in client info
      clientInfo.publications.set(pubuid, {
        name,
        type,
        id
      });
      
      // Broadcast topic to all clients
      this.broadcastTopic(topic);
      
      // Emit topic published event
      this.emit('topicPublished', name, type, id, properties, clientInfo.id);
    }
  }
  
  /**
   * Handle unpublish message
   * @param {WebSocket} ws - The WebSocket connection
   * @param {Object} clientInfo - The client info
   * @param {Object} message - The unpublish message
   */
  handleUnpublish(ws, clientInfo, message) {
    const { pubuid } = message.params;
    
    // Find topic by pubuid
    if (clientInfo.publications.has(pubuid)) {
      const publication = clientInfo.publications.get(pubuid);
      const { name } = publication;
      
      this.emit('debug', `Client ${clientInfo.id} unpublishing topic: ${name}`);
      
      // Remove topic
      if (this.topics.has(name)) {
        const topic = this.topics.get(name);
        
        if (topic.publisher === clientInfo.id) {
          this.topics.delete(name);
          
          // Remove publication from client info
          clientInfo.publications.delete(pubuid);
          
          // Broadcast unannounce to all clients
          this.broadcastUnannounce(name);
          
          // Emit topic unpublished event
          this.emit('topicUnpublished', name, clientInfo.id);
        } else {
          this.emit('debug', `Client ${clientInfo.id} is not the publisher of topic ${name}`);
        }
      }
    } else {
      this.emit('debug', `Publication ${pubuid} not found for client ${clientInfo.id}`);
    }
  }
  
  /**
   * Handle subscribe message
   * @param {WebSocket} ws - The WebSocket connection
   * @param {Object} clientInfo - The client info
   * @param {Object} message - The subscribe message
   */
  handleSubscribe(ws, clientInfo, message) {
    const { subuid, topics: topicPatterns, options = {} } = message.params;
    
    this.emit('debug', `Client ${clientInfo.id} subscribing to topics: ${topicPatterns.join(', ')}`);
    
    // Store subscription in client info
    clientInfo.subscriptions.set(subuid, {
      patterns: topicPatterns,
      options
    });
    
    // Send current values for matching topics
    for (const topic of this.topics.values()) {
      if (this.topicMatchesPatterns(topic.name, topicPatterns, options)) {
        // Send value if available
        if (topic.value !== null) {
          this.sendValue(ws, topic.id, topic.value.type, topic.value.value, topic.value.timestamp);
        }
      }
    }
    
    // Emit topic subscribed event
    this.emit('topicSubscribed', topicPatterns, options, clientInfo.id);
  }
  
  /**
   * Handle unsubscribe message
   * @param {WebSocket} ws - The WebSocket connection
   * @param {Object} clientInfo - The client info
   * @param {Object} message - The unsubscribe message
   */
  handleUnsubscribe(ws, clientInfo, message) {
    const { subuid } = message.params;
    
    this.emit('debug', `Client ${clientInfo.id} unsubscribing: ${subuid}`);
    
    // Remove subscription from client info
    if (clientInfo.subscriptions.has(subuid)) {
      clientInfo.subscriptions.delete(subuid);
      
      // Emit topic unsubscribed event
      this.emit('topicUnsubscribed', subuid, clientInfo.id);
    } else {
      this.emit('debug', `Subscription ${subuid} not found for client ${clientInfo.id}`);
    }
  }
  
  /**
   * Handle set properties message
   * @param {WebSocket} ws - The WebSocket connection
   * @param {Object} clientInfo - The client info
   * @param {Object} message - The set properties message
   */
  handleSetProperties(ws, clientInfo, message) {
    const { name, update } = message.params;
    
    this.emit('debug', `Client ${clientInfo.id} setting properties for topic: ${name}`);
    
    // Check if topic exists
    if (this.topics.has(name)) {
      const topic = this.topics.get(name);
      
      // Check if client is the publisher
      if (topic.publisher === clientInfo.id) {
        // Update properties
        for (const [key, value] of Object.entries(update)) {
          if (value === null) {
            delete topic.properties[key];
          } else {
            topic.properties[key] = value;
          }
        }
        
        // Broadcast properties to all clients
        this.broadcastProperties(name, topic.properties);
        
        // Emit properties changed event
        this.emit('propertiesChanged', name, topic.properties, clientInfo.id);
      } else {
        this.emit('debug', `Client ${clientInfo.id} is not the publisher of topic ${name}`);
      }
    } else {
      this.emit('debug', `Topic ${name} not found`);
    }
  }
  
  /**
   * Check if topic matches patterns
   * @param {string} topicName - The topic name
   * @param {Array} patterns - The topic patterns
   * @param {Object} options - The subscription options
   * @returns {boolean} - Whether the topic matches the patterns
   */
  topicMatchesPatterns(topicName, patterns, options) {
    const prefixMatch = options.prefixMatch === true;
    
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
  
  /**
   * Send announce message to a client
   * @param {WebSocket} ws - The WebSocket connection
   * @param {Object} topic - The topic
   */
  sendAnnounce(ws, topic) {
    // Create announce message
    const announceMessage = [{
      method: 'announce',
      params: {
        name: topic.name,
        id: topic.id,
        type: topic.type,
        properties: topic.properties,
        pubuid: topic.pubuid
      }
    }];
    
    // Send as JSON
    const jsonMessage = JSON.stringify(announceMessage);
    ws.send(jsonMessage);
    
    // Send value if available
    if (topic.value !== null) {
      this.sendValue(ws, topic.id, topic.value.type, topic.value.value, topic.value.timestamp);
    }
  }
  
  /**
   * Send value message to a client
   * @param {WebSocket} ws - The WebSocket connection
   * @param {number} id - The topic ID
   * @param {number} type - The value type
   * @param {*} value - The value
   * @param {number} timestamp - The timestamp
   */
  sendValue(ws, id, type, value, timestamp) {
    // Create value message - NetworkTables 4.1 expects an array with 4 elements: [id, timestamp, type, value]
    const valueMessage = [id, timestamp, type, value];
    
    // Send as binary MessagePack
    const encoded = msgpack.encode(valueMessage);
    ws.send(encoded);
  }
  
  /**
   * Broadcast topic to all clients
   * @param {Object} topic - The topic
   */
  broadcastTopic(topic) {
    // Create announce message
    const announceMessage = [{
      method: 'announce',
      params: {
        name: topic.name,
        id: topic.id,
        type: topic.type,
        properties: topic.properties,
        pubuid: topic.pubuid
      }
    }];
    
    // Send to all clients
    const jsonMessage = JSON.stringify(announceMessage);
    
    for (const clientInfo of this.clients.values()) {
      if (clientInfo.ws && clientInfo.ws.readyState === WebSocket.OPEN) {
        clientInfo.ws.send(jsonMessage);
      }
    }
  }
  
  /**
   * Broadcast unannounce to all clients
   * @param {string} name - The topic name
   */
  broadcastUnannounce(name) {
    // Create unannounce message
    const unannounceMessage = [{
      method: 'unannounce',
      params: {
        name
      }
    }];
    
    // Send to all clients
    const jsonMessage = JSON.stringify(unannounceMessage);
    
    for (const clientInfo of this.clients.values()) {
      if (clientInfo.ws && clientInfo.ws.readyState === WebSocket.OPEN) {
        clientInfo.ws.send(jsonMessage);
      }
    }
  }
  
  /**
   * Broadcast properties to all clients
   * @param {string} name - The topic name
   * @param {Object} properties - The properties
   */
  broadcastProperties(name, properties) {
    // Create properties message
    const propertiesMessage = [{
      method: 'properties',
      params: {
        name,
        properties
      }
    }];
    
    // Send to all clients
    const jsonMessage = JSON.stringify(propertiesMessage);
    
    for (const clientInfo of this.clients.values()) {
      if (clientInfo.ws && clientInfo.ws.readyState === WebSocket.OPEN) {
        clientInfo.ws.send(jsonMessage);
      }
    }
  }
  
  /**
   * Broadcast value to all clients
   * @param {number} id - The topic ID
   * @param {number} type - The value type
   * @param {*} value - The value
   * @param {number} timestamp - The timestamp
   */
  broadcastValue(id, type, value, timestamp) {
    // Create value message - NetworkTables 4.1 expects an array with 4 elements: [id, timestamp, type, value]
    const valueMessage = [id, timestamp, type, value];
    
    // Send as binary MessagePack
    const encoded = msgpack.encode(valueMessage);
    
    for (const clientInfo of this.clients.values()) {
      if (clientInfo.ws && clientInfo.ws.readyState === WebSocket.OPEN) {
        clientInfo.ws.send(encoded);
      }
    }
  }
  
  /**
   * Create a topic
   * @param {string} name - The topic name
   * @param {string} type - The topic type
   * @param {*} value - The initial value
   * @param {number} valueType - The value type
   * @param {Object} properties - The topic properties
   * @returns {Object} - The created topic
   */
  createTopic(name, type, value, valueType, properties = {}) {
    // Check if topic already exists
    if (this.topics.has(name)) {
      throw new Error(`Topic ${name} already exists`);
    }
    
    // Create topic
    const id = this.nextTopicId++;
    const topic = {
      id,
      name,
      type,
      properties: { ...properties },
      value: {
        type: valueType,
        value,
        timestamp: Date.now() * 1000
      },
      publisher: 0, // Server is publisher
      pubuid: id
    };
    
    this.topics.set(name, topic);
    
    // Broadcast topic to all clients
    this.broadcastTopic(topic);
    
    // Broadcast value to all clients
    this.broadcastValue(id, valueType, value, topic.value.timestamp);
    
    // Emit topic created event
    this.emit('topicCreated', name, type, id, properties);
    
    return topic;
  }
  
  /**
   * Update a topic value
   * @param {string} name - The topic name
   * @param {*} value - The value
   * @param {number} type - The value type
   */
  updateTopicValue(name, value, type) {
    // Check if topic exists
    if (!this.topics.has(name)) {
      throw new Error(`Topic ${name} not found`);
    }
    
    // Get topic
    const topic = this.topics.get(name);
    
    // Check if server is publisher
    if (topic.publisher !== 0) {
      throw new Error(`Server is not the publisher of topic ${name}`);
    }
    
    // Update topic value
    topic.value = {
      type,
      value,
      timestamp: Date.now() * 1000
    };
    
    // Broadcast value to all clients
    this.broadcastValue(topic.id, type, value, topic.value.timestamp);
    
    // Emit value updated event
    this.emit('valueChanged', name, value, topic.value.timestamp, type, 0);
  }
  
  /**
   * Delete a topic
   * @param {string} name - The topic name
   */
  deleteTopic(name) {
    // Check if topic exists
    if (!this.topics.has(name)) {
      throw new Error(`Topic ${name} not found`);
    }
    
    // Get topic
    const topic = this.topics.get(name);
    
    // Check if server is publisher
    if (topic.publisher !== 0) {
      throw new Error(`Server is not the publisher of topic ${name}`);
    }
    
    // Remove topic
    this.topics.delete(name);
    
    // Broadcast unannounce to all clients
    this.broadcastUnannounce(name);
    
    // Emit topic deleted event
    this.emit('topicDeleted', name);
  }
  
  /**
   * Set topic properties
   * @param {string} name - The topic name
   * @param {Object} properties - The properties
   */
  setTopicProperties(name, properties) {
    // Check if topic exists
    if (!this.topics.has(name)) {
      throw new Error(`Topic ${name} not found`);
    }
    
    // Get topic
    const topic = this.topics.get(name);
    
    // Check if server is publisher
    if (topic.publisher !== 0) {
      throw new Error(`Server is not the publisher of topic ${name}`);
    }
    
    // Update properties
    for (const [key, value] of Object.entries(properties)) {
      if (value === null) {
        delete topic.properties[key];
      } else {
        topic.properties[key] = value;
      }
    }
    
    // Broadcast properties to all clients
    this.broadcastProperties(name, topic.properties);
    
    // Emit properties changed event
    this.emit('propertiesChanged', name, topic.properties, 0);
  }
  
  /**
   * Get a topic
   * @param {string} name - The topic name
   * @returns {Object} - The topic
   */
  getTopic(name) {
    // Check if topic exists
    if (!this.topics.has(name)) {
      throw new Error(`Topic ${name} not found`);
    }
    
    return this.topics.get(name);
  }
  
  /**
   * Get all topics
   * @returns {Map} - The topics map
   */
  getTopics() {
    return this.topics;
  }
  
  /**
   * Check if a topic exists
   * @param {string} name - The topic name
   * @returns {boolean} - Whether the topic exists
   */
  hasTopic(name) {
    return this.topics.has(name);
  }
  
  /**
   * Get a client
   * @param {number} id - The client ID
   * @returns {Object} - The client info
   */
  getClient(id) {
    // Check if client exists
    if (!this.clients.has(id)) {
      throw new Error(`Client ${id} not found`);
    }
    
    return this.clients.get(id);
  }
  
  /**
   * Get all clients
   * @returns {Map} - The clients map
   */
  getClients() {
    return this.clients;
  }
}

module.exports = {
  NetworkTablesServer,
  DataType
};
