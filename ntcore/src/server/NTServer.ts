import { EventEmitter } from 'events';
import { Server, Socket } from 'net';

// Debug logging function
function debug(...args: any[]) {
  if (process.env.NT_DEBUG === 'true') {
    console.log('[NTServer]', ...args);
  }
}
import { NTInstance } from '../instance/NTInstance';
import { NTConnectionStatus, NTEntryFlags, NTValue, NTValueType } from '../types/NTTypes';
import { Timestamp } from '@wpilib/wpiutil/src/timestamp/Timestamp';
import { NTDeserializer } from '../protocol/NTDeserializer';
import { NTSerializer } from '../protocol/NTSerializer';
import { getValueType } from '../util/NTUtils';
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
 * NetworkTables server options
 */
export interface NTServerOptions {
  /** Server port */
  port: number;
  /** Server host (default: 0.0.0.0) */
  host?: string;
  /** Connection timeout (in milliseconds) */
  timeout?: number;
}

/**
 * NetworkTables server client
 */
interface NTServerClient {
  /** Client socket */
  socket: Socket;
  /** Client address */
  address: string;
  /** Client port */
  port: number;
  /** Client protocol version */
  protocolVersion: number;
  /** Client name */
  clientName: string;
  /** Client buffer */
  buffer: Buffer;
  /** Client entry ID map (name -> ID) */
  entryIdMap: Map<string, number>;
  /** Client reverse entry ID map (ID -> name) */
  reverseEntryIdMap: Map<number, string>;
  /** Client sequence numbers (ID -> sequence) */
  sequenceNumbers: Map<number, number>;
  /** Client handshake complete */
  handshakeComplete: boolean;
  /** Client keep-alive timer */
  keepAliveTimer: NodeJS.Timeout | null;
}

/**
 * NetworkTables server
 *
 * Server for hosting a NetworkTables instance
 */
export class NTServer extends EventEmitter {
  private _instance: NTInstance;
  private _options: NTServerOptions;
  private _server: Server | null;
  private _clients: Map<string, NTServerClient>;
  private _running: boolean;
  private _nextEntryId: number;
  private _entryListeners: Map<string, number[]>;
  private _instanceEntryListenerId: number | null;

  /**
   * Create a new NetworkTables server
   *
   * @param instance NetworkTables instance
   * @param options Server options
   */
  constructor(instance: NTInstance, options: NTServerOptions) {
    super();
    this._instance = instance;
    this._options = {
      ...options,
      host: options.host || '0.0.0.0',
      timeout: options.timeout || 5000
    };
    this._server = null;
    this._clients = new Map();
    this._running = false;
    this._nextEntryId = 0;
    this._entryListeners = new Map();
    this._instanceEntryListenerId = null;
  }

  /**
   * Get the NetworkTables instance
   */
  get instance(): NTInstance {
    return this._instance;
  }

  /**
   * Get the server options
   */
  get options(): NTServerOptions {
    return this._options;
  }

  /**
   * Check if the server is running
   */
  get running(): boolean {
    return this._running;
  }

  /**
   * Get the number of connected clients
   */
  get clientCount(): number {
    return this._clients.size;
  }

  /**
   * Start the server
   *
   * @returns Promise that resolves when the server is started
   */
  start(): Promise<void> {
    debug('Starting server on port', this._options.port);
    return new Promise((resolve, reject) => {
      // If already running, resolve immediately
      if (this._running) {
        debug('Server already running');
        resolve();
        return;
      }

      // Create a new server
      this._server = new Server();

      // Set up event handlers
      this._server.on('listening', () => {
        this._handleListening();
        debug('Server started successfully');
        // Update the status
        this._running = true;
        this._instance.setConnectionStatus(NTConnectionStatus.Connected, {
          remoteId: `${this._options.host}:${this._options.port}`,
          protocolVersion: 3
        });
        this.emit('start');
        resolve();
      });
      this._server.on('connection', this._handleConnection.bind(this));
      this._server.on('error', (err) => {
        debug('Server error', err.message);
        this._handleError(err);
        reject(err);
      });
      this._server.on('close', this._handleClose.bind(this));

      // Set up entry listener
      this._instanceEntryListenerId = this._instance.addEntryListener(
        (notification) => {
          debug('Entry change notification', notification.name, notification.value);
          // Broadcast the entry update to all clients
          this._broadcastEntryUpdate(notification.name, notification.value, notification.flags);
        },
        {
          notifyOnUpdate: true,
          notifyOnNew: true,
          notifyOnDelete: true,
          notifyOnFlagsChange: true,
          notifyImmediately: false
        }
      );

      // Start listening
      this._server.listen(this._options.port, this._options.host);
    });
  }

  /**
   * Stop the server
   */
  stop(): void {
    // If not running, do nothing
    if (!this._running) {
      return;
    }

    // Remove entry listener
    if (this._instanceEntryListenerId !== null) {
      this._instance.removeEntryListener(this._instanceEntryListenerId);
      this._instanceEntryListenerId = null;
    }

    // Close all client connections
    this._clients.forEach(client => {
      // Stop the keep-alive timer
      if (client.keepAliveTimer) {
        clearInterval(client.keepAliveTimer);
        client.keepAliveTimer = null;
      }

      // Destroy the socket
      client.socket.destroy();
    });
    this._clients.clear();

    // Close the server
    if (this._server) {
      this._server.close();
      this._server = null;
    }

    // Update the status
    this._running = false;

    this.emit('stop');
  }

  /**
   * Handle server listening event
   */
  private _handleListening(): void {
    // Update the status
    this._running = true;

    this.emit('start');
  }

  /**
   * Handle server connection event
   *
   * @param socket Client socket
   */
  private _handleConnection(socket: Socket): void {
    debug('Client connected', socket.remoteAddress, socket.remotePort);

    // Get client info
    const address = socket.remoteAddress || 'unknown';
    const port = socket.remotePort || 0;
    const clientId = `${address}:${port}`;

    // Set up client
    const client: NTServerClient = {
      socket,
      address,
      port,
      protocolVersion: NT_PROTOCOL_VERSION,
      clientName: '',
      buffer: Buffer.alloc(0),
      entryIdMap: new Map(),
      reverseEntryIdMap: new Map(),
      sequenceNumbers: new Map(),
      handshakeComplete: false,
      keepAliveTimer: null
    };

    // Set socket timeout
    socket.setTimeout(this._options.timeout!);

    // Set up event handlers
    socket.on('data', (data) => this._handleClientData(clientId, data));
    socket.on('close', (hadError) => this._handleClientClose(clientId, hadError));
    socket.on('error', (error) => this._handleClientError(clientId, error));
    socket.on('timeout', () => this._handleClientTimeout(clientId));

    // Add client to the list
    this._clients.set(clientId, client);

    this.emit('connection', clientId);

    // Send the server hello message
    this._sendServerHello(clientId);
  }

  /**
   * Handle server error event
   *
   * @param error Error
   */
  private _handleError(error: Error): void {
    this.emit('error', error);
  }

  /**
   * Handle server close event
   */
  private _handleClose(): void {
    // Update the status
    this._running = false;
    this._server = null;

    this.emit('close');
  }

  /**
   * Handle client data event
   *
   * @param clientId Client ID
   * @param data Data received
   */
  private _handleClientData(clientId: string, data: Buffer): void {
    // Process the data
    this._processClientData(clientId, data);
  }

  /**
   * Handle client close event
   *
   * @param clientId Client ID
   * @param hadError True if the socket closed due to an error
   */
  private _handleClientClose(clientId: string, hadError: boolean): void {
    // Get client
    const client = this._clients.get(clientId);
    if (client) {
      // Stop the keep-alive timer
      if (client.keepAliveTimer) {
        clearInterval(client.keepAliveTimer);
        client.keepAliveTimer = null;
      }
    }

    // Remove client from the list
    this._clients.delete(clientId);

    this.emit('disconnect', clientId, hadError);
  }

  /**
   * Handle client error event
   *
   * @param clientId Client ID
   * @param error Error
   */
  private _handleClientError(clientId: string, error: Error): void {
    this.emit('clientError', clientId, error);
  }

  /**
   * Handle client timeout event
   *
   * @param clientId Client ID
   */
  private _handleClientTimeout(clientId: string): void {
    // Get client
    const client = this._clients.get(clientId);
    if (!client) {
      return;
    }

    // Close the socket
    client.socket.destroy();

    this.emit('clientTimeout', clientId);
  }

  /**
   * Send the server hello message
   *
   * @param clientId Client ID
   */
  private _sendServerHello(clientId: string): void {
    const client = this._clients.get(clientId);
    if (client) {
      // Create the server hello message
      const message: NTServerHelloMessage = {
        type: NTMessageType.ServerHello,
        serverIdentity: 'TypeScript NT Server',
        clientIdentity: client.clientName || clientId
      };

      // Serialize and send the message
      const buffer = NTSerializer.serializeMessage(message);
      client.socket.write(buffer);

      // Start the keep-alive timer
      this._startKeepAliveTimer(clientId);
    }
  }

  /**
   * Process client data
   *
   * @param clientId Client ID
   * @param data Data received
   */
  private _processClientData(clientId: string, data: Buffer): void {
    // Get client
    const client = this._clients.get(clientId);
    if (!client) {
      return;
    }

    // Append the new data to the buffer
    client.buffer = Buffer.concat([client.buffer, data]);

    // Process messages in the buffer
    let bytesProcessed = 0;
    try {
      while (client.buffer.length >= 3) { // Minimum message size is 3 bytes (header)
        // Check if we have enough data for the message
        const messageLength = client.buffer.readUInt16BE(1);
        if (client.buffer.length < 3 + messageLength) {
          break; // Not enough data for the complete message
        }

        // Deserialize the message
        const { message, bytesConsumed } = NTDeserializer.deserializeMessage(client.buffer);
        bytesProcessed += bytesConsumed;

        // Process the message
        this._processClientMessage(clientId, message);

        // Remove the processed message from the buffer
        client.buffer = client.buffer.slice(bytesConsumed);
      }
    } catch (error) {
      // Log the error and discard the buffer
      console.error(`Error processing NetworkTables message from ${clientId}:`, error);
      client.buffer = Buffer.alloc(0);
    }
  }

  /**
   * Process a client message
   *
   * @param clientId Client ID
   * @param message Message to process
   */
  private _processClientMessage(clientId: string, message: any): void {
    // Get client
    const client = this._clients.get(clientId);
    if (!client) {
      return;
    }

    switch (message.type) {
      case NTMessageType.KeepAlive:
        // Nothing to do for keep-alive messages
        break;

      case NTMessageType.ClientHello:
        // Client hello message
        this._handleClientHello(clientId, message);
        break;

      case NTMessageType.ClientHelloComplete:
        // Client hello complete message
        debug('Received client hello complete from', clientId);
        client.handshakeComplete = true;
        this._sendServerHelloComplete(clientId);
        debug('Sending all entries to client', clientId);
        this._sendAllEntries(clientId);
        break;

      case NTMessageType.EntryAssignment:
        // Entry assignment message
        this._handleClientEntryAssignment(clientId, message);
        break;

      case NTMessageType.EntryUpdate:
        // Entry update message
        this._handleClientEntryUpdate(clientId, message);
        break;

      case NTMessageType.FlagsUpdate:
        // Flags update message
        this._handleClientFlagsUpdate(clientId, message);
        break;

      case NTMessageType.EntryDelete:
        // Entry delete message
        this._handleClientEntryDelete(clientId, message);
        break;

      case NTMessageType.ClearEntries:
        // Clear all entries message
        this._handleClientClearEntries();
        break;

      default:
        console.warn(`Unknown message type from ${clientId}: ${message.type}`);
        break;
    }
  }

  /**
   * Handle a client hello message
   *
   * @param clientId Client ID
   * @param message Client hello message
   */
  private _handleClientHello(clientId: string, message: NTClientHelloMessage): void {
    // Get client
    const client = this._clients.get(clientId);
    if (!client) {
      return;
    }

    // Check protocol version
    if (message.protocolVersion !== NT_PROTOCOL_VERSION) {
      // Send protocol unsupported message
      const response: NTProtoUnsupportedMessage = {
        type: NTMessageType.ProtoUnsupported,
        serverVersion: NT_PROTOCOL_VERSION
      };
      const buffer = NTSerializer.serializeMessage(response);
      client.socket.write(buffer);
      return;
    }

    // Update client info
    client.clientName = message.clientName;
    client.protocolVersion = message.protocolVersion;

    // Send server hello message
    this._sendServerHello(clientId);
  }

  /**
   * Handle a client entry assignment message
   *
   * @param clientId Client ID
   * @param message Entry assignment message
   */
  private _handleClientEntryAssignment(clientId: string, message: NTEntryAssignmentMessage): void {
    // Get client
    const client = this._clients.get(clientId);
    if (!client) {
      return;
    }

    // Map the entry ID to the name
    client.entryIdMap.set(message.name, message.entryId);
    client.reverseEntryIdMap.set(message.entryId, message.name);

    // Update the sequence number
    client.sequenceNumbers.set(message.entryId, message.sequenceNumber);

    // Create or update the entry in the instance
    this._instance.createEntry(message.name, message.entryType, message.value, message.flags);

    // Broadcast the entry assignment to all other clients
    this._broadcastEntryUpdate(message.name, message.value, message.flags, clientId);
  }

  /**
   * Handle a client entry update message
   *
   * @param clientId Client ID
   * @param message Entry update message
   */
  private _handleClientEntryUpdate(clientId: string, message: NTEntryUpdateMessage): void {
    debug('Handling client entry update from', clientId, 'entryId:', message.entryId, 'value:', message.value);
    // Get client
    const client = this._clients.get(clientId);
    if (!client) {
      return;
    }

    // Get the entry name
    const name = client.reverseEntryIdMap.get(message.entryId);
    if (!name) {
      debug(`Entry update for unknown entry ID from ${clientId}: ${message.entryId}`);
      console.warn(`Entry update for unknown entry ID from ${clientId}: ${message.entryId}`);
      return;
    }

    debug('Found entry name:', name);

    // Check the sequence number
    const currentSequence = client.sequenceNumbers.get(message.entryId) || 0;
    debug('Current sequence:', currentSequence, 'New sequence:', message.sequenceNumber);
    if (message.sequenceNumber <= currentSequence) {
      // Ignore out-of-order updates
      debug('Ignoring out-of-order update');
      return;
    }

    // Update the sequence number
    client.sequenceNumbers.set(message.entryId, message.sequenceNumber);

    // Update the entry in the instance
    debug('Updating instance value for', name, 'to', message.value);

    // Check if the entry exists
    let entry = this._instance.getEntry(name);
    if (!entry) {
      // Create the entry with the appropriate type
      debug('Entry does not exist, creating it');
      const type = this._getValueType(message.value);
      this._instance.createEntry(name, type, message.value);
    } else {
      // Update the existing entry
      const result = this._instance.setValue(name, message.value);
      debug('Instance update result:', result);
    }

    // Broadcast the entry update to all other clients
    debug('Broadcasting entry update to all other clients');
    this._broadcastEntryUpdate(name, message.value, this._instance.getFlags(name) || NTEntryFlags.None, clientId);
  }

  /**
   * Handle a client flags update message
   *
   * @param clientId Client ID
   * @param message Flags update message
   */
  private _handleClientFlagsUpdate(clientId: string, message: NTFlagsUpdateMessage): void {
    // Get client
    const client = this._clients.get(clientId);
    if (!client) {
      return;
    }

    // Get the entry name
    const name = client.reverseEntryIdMap.get(message.entryId);
    if (!name) {
      console.warn(`Flags update for unknown entry ID from ${clientId}: ${message.entryId}`);
      return;
    }

    // Update the entry flags in the instance
    this._instance.setFlags(name, message.flags);

    // Broadcast the flags update to all other clients
    this._broadcastFlagsUpdate(name, message.flags, clientId);
  }

  /**
   * Handle a client entry delete message
   *
   * @param clientId Client ID
   * @param message Entry delete message
   */
  private _handleClientEntryDelete(clientId: string, message: any): void {
    // Get client
    const client = this._clients.get(clientId);
    if (!client) {
      return;
    }

    // Get the entry name
    const name = client.reverseEntryIdMap.get(message.entryId);
    if (!name) {
      console.warn(`Entry delete for unknown entry ID from ${clientId}: ${message.entryId}`);
      return;
    }

    // Delete the entry from the instance
    this._instance.deleteEntry(name);

    // Remove the entry ID mapping
    client.entryIdMap.delete(name);
    client.reverseEntryIdMap.delete(message.entryId);
    client.sequenceNumbers.delete(message.entryId);

    // Broadcast the entry delete to all other clients
    this._broadcastEntryDelete(name, clientId);
  }

  /**
   * Handle a client clear entries message
   */
  private _handleClientClearEntries(): void {
    // Get all entries
    const entries = this._instance.getEntries();

    // Delete all entries
    for (const entry of entries) {
      this._instance.deleteEntry(entry.name);
    }

    // Clear the entry ID mappings for all clients
    this._clients.forEach(client => {
      client.entryIdMap.clear();
      client.reverseEntryIdMap.clear();
      client.sequenceNumbers.clear();
    });

    // Broadcast the clear entries message to all clients
    this._broadcastClearEntries();
  }

  /**
   * Send a server hello complete message
   *
   * @param clientId Client ID
   */
  private _sendServerHelloComplete(clientId: string): void {
    const client = this._clients.get(clientId);
    if (client) {
      // Create the server hello complete message
      const message: NTServerHelloCompleteMessage = {
        type: NTMessageType.ServerHelloComplete
      };

      // Serialize and send the message
      const buffer = NTSerializer.serializeMessage(message);
      client.socket.write(buffer);
    }
  }

  /**
   * Send all entries to a client
   *
   * @param clientId Client ID
   */
  private _sendAllEntries(clientId: string): void {
    const client = this._clients.get(clientId);
    if (!client) {
      return;
    }

    // Get all entries
    const entries = this._instance.getEntries();

    // Send each entry
    for (const entry of entries) {
      // Get or create an entry ID
      let entryId = client.entryIdMap.get(entry.name);
      if (entryId === undefined) {
        entryId = this._nextEntryId++;
        client.entryIdMap.set(entry.name, entryId);
        client.reverseEntryIdMap.set(entryId, entry.name);
        client.sequenceNumbers.set(entryId, 0);
      }

      // Create the entry assignment message
      const message: NTEntryAssignmentMessage = {
        type: NTMessageType.EntryAssignment,
        name: entry.name,
        entryType: entry.type,
        entryId,
        sequenceNumber: 0,
        flags: entry.flags,
        value: entry.value
      };

      // Serialize and send the message
      const buffer = NTSerializer.serializeMessage(message);
      client.socket.write(buffer);
    }
  }

  /**
   * Send a keep-alive message to a client
   *
   * @param clientId Client ID
   */
  private _sendKeepAlive(clientId: string): void {
    const client = this._clients.get(clientId);
    if (client) {
      // Create the keep-alive message
      const message: NTKeepAliveMessage = {
        type: NTMessageType.KeepAlive
      };

      // Serialize and send the message
      const buffer = NTSerializer.serializeMessage(message);
      client.socket.write(buffer);
    }
  }

  /**
   * Get the type of a value
   *
   * @param value Value to get the type of
   * @returns Value type
   */
  private _getValueType(value: NTValue): NTValueType {
    if (typeof value === 'boolean') {
      return NTValueType.Boolean;
    } else if (typeof value === 'number') {
      return NTValueType.Double;
    } else if (typeof value === 'string') {
      return NTValueType.String;
    } else if (value instanceof Uint8Array || value instanceof Buffer) {
      return NTValueType.Raw;
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        return NTValueType.BooleanArray; // Default to boolean array for empty arrays
      }
      const firstItem = value[0];
      if (typeof firstItem === 'boolean') {
        return NTValueType.BooleanArray;
      } else if (typeof firstItem === 'number') {
        return NTValueType.DoubleArray;
      } else if (typeof firstItem === 'string') {
        return NTValueType.StringArray;
      }
    }
    throw new Error('Unsupported value type');
  }

  /**
   * Start the keep-alive timer for a client
   *
   * @param clientId Client ID
   */
  private _startKeepAliveTimer(clientId: string): void {
    const client = this._clients.get(clientId);
    if (!client) {
      return;
    }

    // Clear any existing timer
    if (client.keepAliveTimer) {
      clearInterval(client.keepAliveTimer);
      client.keepAliveTimer = null;
    }

    // Start a new timer
    client.keepAliveTimer = setInterval(() => {
      this._sendKeepAlive(clientId);
    }, 1000); // Send keep-alive every 1 second
  }

  /**
   * Broadcast an entry update to all clients
   *
   * @param name Entry name
   * @param value Entry value
   * @param flags Entry flags
   * @param excludeClientId Client ID to exclude (optional)
   */
  private _broadcastEntryUpdate(name: string, value: NTValue, flags: NTEntryFlags, excludeClientId?: string): void {
    debug('Broadcasting entry update', name, value);

    this._clients.forEach((client, clientId) => {
      // Skip the excluded client
      if (excludeClientId && clientId === excludeClientId) {
        return;
      }

      // Skip clients that haven't completed the handshake
      if (!client.handshakeComplete) {
        return;
      }

      // Get or create an entry ID
      let entryId = client.entryIdMap.get(name);
      if (entryId === undefined) {
        entryId = this._nextEntryId++;
        client.entryIdMap.set(name, entryId);
        client.reverseEntryIdMap.set(entryId, name);
        client.sequenceNumbers.set(entryId, 0);

        // Send an entry assignment message
        const sequenceNumber = 0;
        const message: NTEntryAssignmentMessage = {
          type: NTMessageType.EntryAssignment,
          name,
          entryType: getValueType(value),
          entryId,
          sequenceNumber,
          flags,
          value
        };

        // Serialize and send the message
        const buffer = NTSerializer.serializeMessage(message);
        client.socket.write(buffer);
      } else {
        // Get the current sequence number
        const sequenceNumber = (client.sequenceNumbers.get(entryId) || 0) + 1;
        client.sequenceNumbers.set(entryId, sequenceNumber);

        // Send an entry update message
        const message: NTEntryUpdateMessage = {
          type: NTMessageType.EntryUpdate,
          entryId,
          sequenceNumber,
          value
        };

        // Serialize and send the message
        const buffer = NTSerializer.serializeMessage(message);
        client.socket.write(buffer);
      }
    });
  }

  /**
   * Broadcast a flags update to all clients
   *
   * @param name Entry name
   * @param flags Entry flags
   * @param excludeClientId Client ID to exclude (optional)
   */
  private _broadcastFlagsUpdate(name: string, flags: NTEntryFlags, excludeClientId?: string): void {
    this._clients.forEach((client, clientId) => {
      // Skip the excluded client
      if (excludeClientId && clientId === excludeClientId) {
        return;
      }

      // Skip clients that haven't completed the handshake
      if (!client.handshakeComplete) {
        return;
      }

      // Get the entry ID
      const entryId = client.entryIdMap.get(name);
      if (entryId === undefined) {
        return;
      }

      // Send a flags update message
      const message: NTFlagsUpdateMessage = {
        type: NTMessageType.FlagsUpdate,
        entryId,
        flags
      };

      // Serialize and send the message
      const buffer = NTSerializer.serializeMessage(message);
      client.socket.write(buffer);
    });
  }

  /**
   * Broadcast an entry delete to all clients
   *
   * @param name Entry name
   * @param excludeClientId Client ID to exclude (optional)
   */
  private _broadcastEntryDelete(name: string, excludeClientId?: string): void {
    this._clients.forEach((client, clientId) => {
      // Skip the excluded client
      if (excludeClientId && clientId === excludeClientId) {
        return;
      }

      // Skip clients that haven't completed the handshake
      if (!client.handshakeComplete) {
        return;
      }

      // Get the entry ID
      const entryId = client.entryIdMap.get(name);
      if (entryId === undefined) {
        return;
      }

      // Send an entry delete message
      const message: any = {
        type: NTMessageType.EntryDelete,
        entryId
      };

      // Serialize and send the message
      const buffer = NTSerializer.serializeMessage(message);
      client.socket.write(buffer);

      // Remove the entry ID mapping
      client.entryIdMap.delete(name);
      client.reverseEntryIdMap.delete(entryId);
      client.sequenceNumbers.delete(entryId);
    });
  }

  /**
   * Broadcast a clear entries message to all clients
   *
   * @param excludeClientId Client ID to exclude (optional)
   */
  private _broadcastClearEntries(excludeClientId?: string): void {
    this._clients.forEach((client, clientId) => {
      // Skip the excluded client
      if (excludeClientId && clientId === excludeClientId) {
        return;
      }

      // Skip clients that haven't completed the handshake
      if (!client.handshakeComplete) {
        return;
      }

      // Send a clear entries message
      const message: any = {
        type: NTMessageType.ClearEntries
      };

      // Serialize and send the message
      const buffer = NTSerializer.serializeMessage(message);
      client.socket.write(buffer);

      // Clear the entry ID mappings
      client.entryIdMap.clear();
      client.reverseEntryIdMap.clear();
      client.sequenceNumbers.clear();
    });
  }

  /**
   * Broadcast a value update to all connected clients
   *
   * @param name Entry name
   * @param value Entry value
   * @param type Entry type
   * @param flags Entry flags
   */
  public broadcastValueUpdate(name: string, value: NTValue, type: NTValueType, flags: NTEntryFlags): void {
    debug(`Broadcasting value update for ${name}: ${value}`);

    // Update the instance value directly without triggering listeners
    let entry = this._instance.getEntry(name);
    if (!entry) {
      // Create the entry with the appropriate type
      debug('Entry does not exist, creating it');
      this._instance.createEntry(name, type, value, NTEntryFlags.None, false); // Don't notify listeners
    } else {
      // Update the existing entry through the instance
      this._instance.setValue(name, value, false); // Don't notify listeners
    }

    // Broadcast the update to all clients
    this._broadcastEntryUpdate(name, value, flags);
  }
}