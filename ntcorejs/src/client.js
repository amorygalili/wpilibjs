/**
 * NetworkTables 4.1 Client
 *
 * This is a client implementation of the NetworkTables 4.1 protocol.
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

class NetworkTablesClient extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      host: 'localhost',
      port: 5810,
      protocol: 'v4.1.networktables.first.wpi.edu',
      ...options
    };

    this.topics = new Map();
    this.subscriptions = new Map();
    this.publications = new Map();
    this.nextSubUid = 1;
    this.nextPubUid = 1;
    this.connected = false;
    this.ws = null;
  }

  /**
   * Connect to the NetworkTables server
   */
  connect() {
    const url = `ws://${this.options.host}:${this.options.port}`;
    this.emit('debug', `Connecting to ${url}...`);

    this.ws = new WebSocket(url, [this.options.protocol, 'networktables.first.wpi.edu']);

    // Handle open
    this.ws.on('open', () => {
      this.connected = true;
      this.emit('debug', `Connected to ${url}`);
      this.emit('debug', `Protocol: ${this.ws.protocol}`);
      this.emit('connected');

      // Subscribe to all topics
      this.subscribeAll();
    });

    // Handle messages
    this.ws.on('message', (data) => {
      try {
        if (data instanceof Buffer) {
          this.emit('debug', `Binary message received, length: ${data.length}`);
          this.emit('debug', `First 32 bytes: ${Array.from(data.slice(0, Math.min(32, data.length))).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);

          try {
            // Try to decode as MessagePack
            const decoded = msgpack.decode(data);
            this.emit('debug', `Decoded MessagePack: ${JSON.stringify(decoded)}`);

            // Handle binary message
            this.handleBinaryMessage(decoded);
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
                this.handleJsonMessage(jsonData);
              } catch (jsonError) {
                this.emit('debug', `Failed to parse JSON: ${jsonError}`);
              }
            } catch (error) {
              this.emit('debug', `Not valid UTF-8: ${error}`);
            }
          }
        } else if (typeof data === 'string') {
          this.emit('debug', `Text message received: ${data}`);

          try {
            const jsonData = JSON.parse(data);
            this.emit('debug', `Parsed JSON: ${JSON.stringify(jsonData)}`);

            // Handle JSON message
            this.handleJsonMessage(jsonData);
          } catch (jsonError) {
            this.emit('debug', `Failed to parse JSON: ${jsonError}`);
          }
        }
      } catch (error) {
        this.emit('debug', `Error processing message: ${error}`);
      }
    });

    // Handle close
    this.ws.on('close', () => {
      this.connected = false;
      this.emit('debug', 'Disconnected from server');
      this.emit('disconnected');

      // Clear topics
      this.topics.clear();

      // Try to reconnect after a delay
      setTimeout(() => {
        this.connect();
      }, 5000);
    });

    // Handle errors
    this.ws.on('error', (error) => {
      this.emit('debug', `WebSocket error: ${error}`);
      this.emit('error', error);
    });
  }

  /**
   * Disconnect from the NetworkTables server
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Handle binary message
   * @param {Array} message - The decoded MessagePack message
   */
  handleBinaryMessage(message) {
    // Check if it's a value update
    if (Array.isArray(message) && message.length === 4) {
      const [id, timestamp, type, value] = message;
      this.emit('debug', `Value update: id=${id}, type=${type}, value=${JSON.stringify(value)}`);

      // Find topic by ID
      for (const [name, topic] of this.topics.entries()) {
        if (topic.id === id) {
          // Update topic value
          topic.value = value;
          topic.timestamp = timestamp;
          topic.type = type;

          // Emit value update event
          this.emit('valueChanged', name, value, timestamp, type);
          break;
        }
      }
    }
  }

  /**
   * Handle JSON message
   * @param {Object} message - The parsed JSON message
   */
  handleJsonMessage(message) {
    // Check if it's an array (control message)
    if (Array.isArray(message)) {
      for (const msg of message) {
        this.handleControlMessage(msg);
      }
    }
  }

  /**
   * Handle control message
   * @param {Object} message - The control message
   */
  handleControlMessage(message) {
    if (!message.method) {
      this.emit('debug', `Invalid control message, missing method: ${JSON.stringify(message)}`);
      return;
    }

    this.emit('debug', `Control message: ${message.method}`);

    switch (message.method) {
      case 'announce':
        this.handleAnnounce(message);
        break;
      case 'unannounce':
        this.handleUnannounce(message);
        break;
      case 'properties':
        this.handleProperties(message);
        break;
      default:
        this.emit('debug', `Unknown method: ${message.method}`);
    }
  }

  /**
   * Handle announce message
   * @param {Object} message - The announce message
   */
  handleAnnounce(message) {
    const { name, id, type, properties } = message.params;
    this.emit('debug', `Topic announced: ${name} (${type}) with ID ${id}`);
    this.emit('debug', `Properties: ${JSON.stringify(properties)}`);

    // Store the topic
    this.topics.set(name, {
      id,
      type,
      properties,
      value: null,
      timestamp: 0
    });

    // Emit topic announced event
    this.emit('topicAnnounced', name, type, id, properties);
  }

  /**
   * Handle unannounce message
   * @param {Object} message - The unannounce message
   */
  handleUnannounce(message) {
    const { name } = message.params;
    this.emit('debug', `Topic unannounced: ${name}`);

    // Remove the topic
    this.topics.delete(name);

    // Emit topic unannounced event
    this.emit('topicUnannounced', name);
  }

  /**
   * Handle properties message
   * @param {Object} message - The properties message
   */
  handleProperties(message) {
    const { name, properties } = message.params;
    this.emit('debug', `Properties updated for topic ${name}: ${JSON.stringify(properties)}`);

    // Update topic properties
    if (this.topics.has(name)) {
      const topic = this.topics.get(name);
      topic.properties = { ...topic.properties, ...properties };

      // Emit properties updated event
      this.emit('propertiesChanged', name, topic.properties);
    }
  }

  /**
   * Subscribe to all topics
   */
  subscribeAll() {
    return this.subscribe([''], { prefixMatch: true });
  }

  /**
   * Subscribe to topics
   * @param {Array} topicPatterns - The topic patterns to subscribe to
   * @param {Object} options - The subscription options
   * @returns {number} - The subscription ID
   */
  subscribe(topicPatterns, options = {}) {
    if (!this.connected) {
      throw new Error('Not connected to server');
    }

    const subuid = this.nextSubUid++;

    // Store subscription
    this.subscriptions.set(subuid, {
      patterns: topicPatterns,
      options
    });

    // Create subscribe message
    const subscribeMessage = [{
      method: 'subscribe',
      params: {
        subuid,
        topics: topicPatterns,
        options
      }
    }];

    // Send as JSON
    const jsonMessage = JSON.stringify(subscribeMessage);
    this.emit('debug', `Sending subscribe message: ${jsonMessage}`);
    this.ws.send(jsonMessage);

    return subuid;
  }

  /**
   * Unsubscribe from a subscription
   * @param {number} subuid - The subscription ID
   */
  unsubscribe(subuid) {
    if (!this.connected) {
      throw new Error('Not connected to server');
    }

    if (!this.subscriptions.has(subuid)) {
      throw new Error(`Subscription ${subuid} not found`);
    }

    // Remove subscription
    this.subscriptions.delete(subuid);

    // Create unsubscribe message
    const unsubscribeMessage = [{
      method: 'unsubscribe',
      params: {
        subuid
      }
    }];

    // Send as JSON
    const jsonMessage = JSON.stringify(unsubscribeMessage);
    this.emit('debug', `Sending unsubscribe message: ${jsonMessage}`);
    this.ws.send(jsonMessage);
  }

  /**
   * Publish a topic
   * @param {string} name - The topic name
   * @param {string} type - The topic type
   * @param {Object} properties - The topic properties
   * @returns {number} - The publication ID
   */
  publish(name, type, properties = {}) {
    if (!this.connected) {
      throw new Error('Not connected to server');
    }

    const pubuid = this.nextPubUid++;

    // Store publication
    this.publications.set(pubuid, {
      name,
      type,
      properties
    });

    // Create publish message
    const publishMessage = [{
      method: 'publish',
      params: {
        name,
        type,
        pubuid,
        properties
      }
    }];

    // Send as JSON
    const jsonMessage = JSON.stringify(publishMessage);
    this.emit('debug', `Sending publish message: ${jsonMessage}`);
    this.ws.send(jsonMessage);

    return pubuid;
  }

  /**
   * Unpublish a topic
   * @param {number} pubuid - The publication ID
   */
  unpublish(pubuid) {
    if (!this.connected) {
      throw new Error('Not connected to server');
    }

    if (!this.publications.has(pubuid)) {
      throw new Error(`Publication ${pubuid} not found`);
    }

    // Remove publication
    this.publications.delete(pubuid);

    // Create unpublish message
    const unpublishMessage = [{
      method: 'unpublish',
      params: {
        pubuid
      }
    }];

    // Send as JSON
    const jsonMessage = JSON.stringify(unpublishMessage);
    this.emit('debug', `Sending unpublish message: ${jsonMessage}`);
    this.ws.send(jsonMessage);
  }

  /**
   * Set a topic value
   * @param {number} pubuid - The publication ID
   * @param {*} value - The value to set
   * @param {number} type - The value type
   */
  setValue(pubuid, value, type) {
    if (!this.connected) {
      throw new Error('Not connected to server');
    }

    if (!this.publications.has(pubuid)) {
      throw new Error(`Publication ${pubuid} not found`);
    }

    // Create value message - NetworkTables 4.1 expects an array with 4 elements: [id, timestamp, type, value]
    const valueMessage = [pubuid, Date.now() * 1000, type, value];

    // Send as binary MessagePack
    const encoded = msgpack.encode(valueMessage);
    this.emit('debug', `Sending value message: ${JSON.stringify(valueMessage)}`);
    this.ws.send(encoded);
  }

  /**
   * Set topic properties
   * @param {string} name - The topic name
   * @param {Object} properties - The properties to set
   */
  setProperties(name, properties) {
    if (!this.connected) {
      throw new Error('Not connected to server');
    }

    // Create set properties message
    const setPropertiesMessage = [{
      method: 'setproperties',
      params: {
        name,
        update: properties
      }
    }];

    // Send as JSON
    const jsonMessage = JSON.stringify(setPropertiesMessage);
    this.emit('debug', `Sending set properties message: ${jsonMessage}`);
    this.ws.send(jsonMessage);
  }

  /**
   * Get a topic value
   * @param {string} name - The topic name
   * @returns {*} - The topic value
   */
  getValue(name) {
    if (!this.topics.has(name)) {
      throw new Error(`Topic ${name} not found`);
    }

    return this.topics.get(name).value;
  }

  /**
   * Get all topics
   * @returns {Map} - The topics map
   */
  getTopics() {
    return this.topics;
  }

  /**
   * Get a topic
   * @param {string} name - The topic name
   * @returns {Object} - The topic
   */
  getTopic(name) {
    if (!this.topics.has(name)) {
      throw new Error(`Topic ${name} not found`);
    }

    return this.topics.get(name);
  }

  /**
   * Check if a topic exists
   * @param {string} name - The topic name
   * @returns {boolean} - Whether the topic exists
   */
  hasTopic(name) {
    return this.topics.has(name);
  }
}

module.exports = {
  NetworkTablesClient,
  DataType
};
