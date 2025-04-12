import { EventEmitter } from 'events';
import { Socket } from 'net';

// Debug logging function
function debug(...args: any[]) {
  if (process.env.NT_DEBUG === 'true') {
    console.log('[NTClient]', ...args);
  }
}
import { NTInstance } from '../instance/NTInstance';
import { NTConnectionStatus, NTEntryFlags, NTValue, NTValueType } from '../types/NTTypes';
import { Timestamp } from '@wpilib/wpiutil/src/timestamp/Timestamp';
import { NTDeserializer } from '../protocol/NTDeserializer';
import { NTSerializer } from '../protocol/NTSerializer';
import {
  NTClientHelloMessage,
  NTClientHelloCompleteMessage,
  NTEntryAssignmentMessage,
  NTEntryUpdateMessage,
  NTFlagsUpdateMessage,
  NTKeepAliveMessage,
  NTMessageType,
  NTProtoUnsupportedMessage,
  NTServerHelloCompleteMessage,
  NTServerHelloMessage,
  NT_PROTOCOL_VERSION
} from '../protocol/NTProtocol';

/**
 * NetworkTables client options
 */
export interface NTClientOptions {
  /** Server host */
  host: string;
  /** Server port */
  port: number;
  /** Connection timeout (in milliseconds) */
  timeout?: number;
  /** Reconnect interval (in milliseconds) */
  reconnectInterval?: number;
  /** Maximum reconnect attempts (0 for unlimited) */
  maxReconnectAttempts?: number;
}

/**
 * NetworkTables client
 *
 * Client for connecting to a NetworkTables server
 */
export class NTClient extends EventEmitter {
  private _instance: NTInstance;
  private _options: NTClientOptions;
  private _socket: Socket | null;
  private _connected: boolean;
  private _reconnectAttempts: number;
  private _reconnectTimer: NodeJS.Timeout | null;
  private _buffer: Buffer;
  private _entryIdMap: Map<string, number>;
  private _reverseEntryIdMap: Map<number, string>;
  private _nextEntryId: number;
  private _sequenceNumbers: Map<number, number>;
  private _handshakeComplete: boolean;
  private _keepAliveTimer: NodeJS.Timeout | null;

  /**
   * Create a new NetworkTables client
   *
   * @param instance NetworkTables instance
   * @param options Client options
   */
  constructor(instance: NTInstance, options: NTClientOptions) {
    super();
    this._instance = instance;
    this._options = {
      ...options,
      timeout: options.timeout || 5000,
      reconnectInterval: options.reconnectInterval || 1000,
      maxReconnectAttempts: options.maxReconnectAttempts || 0
    };
    this._socket = null;
    this._connected = false;
    this._reconnectAttempts = 0;
    this._reconnectTimer = null;
    this._buffer = Buffer.alloc(0);
    this._entryIdMap = new Map();
    this._reverseEntryIdMap = new Map();
    this._nextEntryId = 0;
    this._sequenceNumbers = new Map();
    this._handshakeComplete = false;
    this._keepAliveTimer = null;
  }

  /**
   * Get the NetworkTables instance
   */
  get instance(): NTInstance {
    return this._instance;
  }

  /**
   * Get the client options
   */
  get options(): NTClientOptions {
    return this._options;
  }

  /**
   * Check if the client is connected
   */
  get connected(): boolean {
    return this._connected;
  }

  /**
   * Connect to the server
   */
  connect(): Promise<void> {
    debug('Connecting to server', this._options.host, this._options.port);
    return new Promise((resolve, reject) => {
      // If already connected, resolve immediately
      if (this._connected) {
        debug('Already connected');
        resolve();
        return;
      }

      // If reconnect timer is active, clear it
      if (this._reconnectTimer) {
        clearTimeout(this._reconnectTimer);
        this._reconnectTimer = null;
      }

      // Create a new socket
      this._socket = new Socket();
      this._socket.setTimeout(this._options.timeout!);

      // Set up event handlers
      this._socket.on('connect', () => {
        this._handleConnect();
        resolve();
      });
      this._socket.on('data', this._handleData.bind(this));
      this._socket.on('close', this._handleClose.bind(this));
      this._socket.on('error', (err) => {
        debug('Connection error', err.message);
        this._handleError(err);
        reject(err);
      });
      this._socket.on('timeout', () => {
        debug('Connection timeout');
        this._handleTimeout();
        reject(new Error('Connection timeout'));
      });

      // Update the connection status
      this._instance.setConnectionStatus(NTConnectionStatus.Connecting);

      // Connect to the server
      this._socket.connect(this._options.port, this._options.host);
    });
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    // If not connected, do nothing
    if (!this._connected) {
      return;
    }

    // If reconnect timer is active, clear it
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }

    // Stop the keep-alive timer
    this._stopKeepAliveTimer();

    // Reset the handshake state
    this._handshakeComplete = false;
    this._buffer = Buffer.alloc(0);

    // Close the socket
    if (this._socket) {
      this._socket.destroy();
      this._socket = null;
    }

    // Update the connection status
    this._connected = false;
    this._instance.setConnectionStatus(NTConnectionStatus.Disconnected);

    this.emit('disconnect');
  }

  /**
   * Handle socket connect event
   */
  private _handleConnect(): void {
    debug('Connected to server');

    // Update the connection status
    this._connected = true;
    this._reconnectAttempts = 0;
    this._instance.setConnectionStatus(NTConnectionStatus.Connected, {
      remoteId: `${this._options.host}:${this._options.port}`,
      protocolVersion: 3
    });

    this.emit('connect');

    // Send the client hello message
    this._sendClientHello();
  }

  /**
   * Handle socket data event
   *
   * @param data Data received
   */
  private _handleData(data: Buffer): void {
    // Process the data
    this._processData(data);
  }

  /**
   * Handle socket close event
   *
   * @param hadError True if the socket closed due to an error
   */
  private _handleClose(hadError: boolean): void {
    // Update the connection status
    this._connected = false;
    this._socket = null;
    this._instance.setConnectionStatus(NTConnectionStatus.Disconnected);

    this.emit('disconnect', hadError);

    // Try to reconnect
    this._reconnect();
  }

  /**
   * Handle socket error event
   *
   * @param error Error
   */
  private _handleError(error: Error): void {
    this.emit('error', error);
  }

  /**
   * Handle socket timeout event
   */
  private _handleTimeout(): void {
    // Close the socket
    if (this._socket) {
      this._socket.destroy();
      this._socket = null;
    }

    this.emit('timeout');
  }

  /**
   * Try to reconnect to the server
   */
  private _reconnect(): void {
    // If max reconnect attempts is reached, do nothing
    if (this._options.maxReconnectAttempts! > 0 && this._reconnectAttempts >= this._options.maxReconnectAttempts!) {
      this.emit('reconnectFailed');
      return;
    }

    // Increment reconnect attempts
    this._reconnectAttempts++;

    // Set up reconnect timer
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      this.connect();
    }, this._options.reconnectInterval!);

    this.emit('reconnect', this._reconnectAttempts);
  }

  /**
   * Send the client hello message
   */
  private _sendClientHello(): void {
    debug('Sending client hello message');
    if (this._socket) {
      // Create the client hello message
      const message: NTClientHelloMessage = {
        type: NTMessageType.ClientHello,
        protocolVersion: NT_PROTOCOL_VERSION,
        clientName: 'TypeScript NT Client'
      };

      // Serialize and send the message
      const buffer = NTSerializer.serializeMessage(message);
      this._socket.write(buffer);

      // Start the keep-alive timer
      this._startKeepAliveTimer();
    }
  }

  /**
   * Process received data
   *
   * @param data Data received
   */
  private _processData(data: Buffer): void {
    // Append the new data to the buffer
    this._buffer = Buffer.concat([this._buffer, data]);

    // Process messages in the buffer
    let bytesProcessed = 0;
    try {
      while (this._buffer.length >= 3) { // Minimum message size is 3 bytes (header)
        // Check if we have enough data for the message
        const messageLength = this._buffer.readUInt16BE(1);
        if (this._buffer.length < 3 + messageLength) {
          break; // Not enough data for the complete message
        }

        // Deserialize the message
        const { message, bytesConsumed } = NTDeserializer.deserializeMessage(this._buffer);
        bytesProcessed += bytesConsumed;

        // Process the message
        this._processMessage(message);

        // Remove the processed message from the buffer
        this._buffer = this._buffer.slice(bytesConsumed);
      }
    } catch (error) {
      // Log the error and discard the buffer
      console.error('Error processing NetworkTables message:', error);
      this._buffer = Buffer.alloc(0);
    }
  }

  /**
   * Process a NetworkTables message
   *
   * @param message Message to process
   */
  private _processMessage(message: any): void {
    debug('Processing message', message.type);

    switch (message.type) {
      case NTMessageType.KeepAlive:
        // Nothing to do for keep-alive messages
        break;

      case NTMessageType.ProtoUnsupported:
        // Protocol version unsupported
        console.error(`Protocol version unsupported: server supports ${message.serverVersion}`);
        this.disconnect();
        break;

      case NTMessageType.ServerHello:
        // Server hello message
        console.log(`Server hello: ${message.serverIdentity}`);
        // Send client hello complete message
        this._sendClientHelloComplete();
        break;

      case NTMessageType.ServerHelloComplete:
        // Server hello complete message
        debug('Received server hello complete, handshake complete');
        this._handshakeComplete = true;
        this.emit('ready');
        break;

      case NTMessageType.EntryAssignment:
        // Entry assignment message
        this._handleEntryAssignment(message);
        break;

      case NTMessageType.EntryUpdate:
        // Entry update message
        this._handleEntryUpdate(message);
        break;

      case NTMessageType.FlagsUpdate:
        // Flags update message
        this._handleFlagsUpdate(message);
        break;

      case NTMessageType.EntryDelete:
        // Entry delete message
        this._handleEntryDelete(message);
        break;

      case NTMessageType.ClearEntries:
        // Clear all entries message
        this._handleClearEntries();
        break;

      default:
        console.warn(`Unknown message type: ${message.type}`);
        break;
    }
  }

  /**
   * Handle an entry assignment message
   *
   * @param message Entry assignment message
   */
  private _handleEntryAssignment(message: NTEntryAssignmentMessage): void {
    debug('Handling entry assignment', message.name, message.value);

    // Map the entry ID to the name
    this._entryIdMap.set(message.name, message.entryId);
    this._reverseEntryIdMap.set(message.entryId, message.name);

    // Update the sequence number
    this._sequenceNumbers.set(message.entryId, message.sequenceNumber);

    // Create or update the entry in the instance
    this._instance.createEntry(message.name, message.entryType, message.value, message.flags);
  }

  /**
   * Handle an entry update message
   *
   * @param message Entry update message
   */
  private _handleEntryUpdate(message: NTEntryUpdateMessage): void {
    debug('Handling entry update', message.entryId, message.value);

    // Get the entry name
    const name = this._reverseEntryIdMap.get(message.entryId);
    if (!name) {
      console.warn(`Entry update for unknown entry ID: ${message.entryId}`);
      return;
    }

    // Check the sequence number
    const currentSequence = this._sequenceNumbers.get(message.entryId) || 0;
    if (message.sequenceNumber <= currentSequence) {
      // Ignore out-of-order updates
      return;
    }

    // Update the sequence number
    this._sequenceNumbers.set(message.entryId, message.sequenceNumber);

    // Update the entry in the instance
    this._instance.setValue(name, message.value);
  }

  /**
   * Handle a flags update message
   *
   * @param message Flags update message
   */
  private _handleFlagsUpdate(message: NTFlagsUpdateMessage): void {
    // Get the entry name
    const name = this._reverseEntryIdMap.get(message.entryId);
    if (!name) {
      console.warn(`Flags update for unknown entry ID: ${message.entryId}`);
      return;
    }

    // Update the entry flags in the instance
    this._instance.setFlags(name, message.flags);
  }

  /**
   * Handle an entry delete message
   *
   * @param message Entry delete message
   */
  private _handleEntryDelete(message: any): void {
    // Get the entry name
    const name = this._reverseEntryIdMap.get(message.entryId);
    if (!name) {
      console.warn(`Entry delete for unknown entry ID: ${message.entryId}`);
      return;
    }

    // Delete the entry from the instance
    this._instance.deleteEntry(name);

    // Remove the entry ID mapping
    this._entryIdMap.delete(name);
    this._reverseEntryIdMap.delete(message.entryId);
    this._sequenceNumbers.delete(message.entryId);
  }

  /**
   * Handle a clear entries message
   */
  private _handleClearEntries(): void {
    // Get all entries
    const entries = this._instance.getEntries();

    // Delete all entries
    for (const entry of entries) {
      this._instance.deleteEntry(entry.name);
    }

    // Clear the entry ID mappings
    this._entryIdMap.clear();
    this._reverseEntryIdMap.clear();
    this._sequenceNumbers.clear();
  }

  /**
   * Send a client hello complete message
   */
  private _sendClientHelloComplete(): void {
    if (this._socket) {
      // Create the client hello complete message
      const message: NTClientHelloCompleteMessage = {
        type: NTMessageType.ClientHelloComplete
      };

      // Serialize and send the message
      const buffer = NTSerializer.serializeMessage(message);
      this._socket.write(buffer);
    }
  }

  /**
   * Send a keep-alive message
   */
  private _sendKeepAlive(): void {
    if (this._socket && this._connected) {
      // Create the keep-alive message
      const message: NTKeepAliveMessage = {
        type: NTMessageType.KeepAlive
      };

      // Serialize and send the message
      const buffer = NTSerializer.serializeMessage(message);
      this._socket.write(buffer);
    }
  }

  /**
   * Start the keep-alive timer
   */
  private _startKeepAliveTimer(): void {
    // Clear any existing timer
    if (this._keepAliveTimer) {
      clearInterval(this._keepAliveTimer);
      this._keepAliveTimer = null;
    }

    // Start a new timer
    this._keepAliveTimer = setInterval(() => {
      this._sendKeepAlive();
    }, 1000); // Send keep-alive every 1 second
  }

  /**
   * Stop the keep-alive timer
   */
  private _stopKeepAliveTimer(): void {
    if (this._keepAliveTimer) {
      clearInterval(this._keepAliveTimer);
      this._keepAliveTimer = null;
    }
  }

  /**
   * Send a value update
   *
   * @param name Entry name
   * @param value Entry value
   * @param type Entry type
   * @param flags Entry flags
   */
  sendValueUpdate(name: string, value: NTValue, type: NTValueType, flags: NTEntryFlags = NTEntryFlags.None): void {
    debug('Sending value update', name, value);

    // Check if we can send the update
    if (!this._socket) {
      debug('Cannot send update: no socket');
      return;
    }
    if (!this._connected) {
      debug('Cannot send update: not connected');
      return;
    }
    if (!this._handshakeComplete) {
      debug('Cannot send update: handshake not complete');
      return;
    }

    // Get the entry ID
    let entryId = this._entryIdMap.get(name);
    if (entryId === undefined) {
      // Create a new entry ID
      entryId = this._nextEntryId++;
      this._entryIdMap.set(name, entryId);
      this._reverseEntryIdMap.set(entryId, name);
      this._sequenceNumbers.set(entryId, 0);

      // Send an entry assignment message
      const sequenceNumber = 0;
      const message: NTEntryAssignmentMessage = {
        type: NTMessageType.EntryAssignment,
        name,
        entryType: type,
        entryId,
        sequenceNumber,
        flags,
        value
      };

      // Serialize and send the message
      const buffer = NTSerializer.serializeMessage(message);
      this._socket.write(buffer);
    } else {
      // Get the current sequence number
      const sequenceNumber = (this._sequenceNumbers.get(entryId) || 0) + 1;
      this._sequenceNumbers.set(entryId, sequenceNumber);

      // Send an entry update message
      const message: NTEntryUpdateMessage = {
        type: NTMessageType.EntryUpdate,
        entryId,
        sequenceNumber,
        value
      };

      // Serialize and send the message
      const buffer = NTSerializer.serializeMessage(message);
      this._socket.write(buffer);
    }
  }
}
