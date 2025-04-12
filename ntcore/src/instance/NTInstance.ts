import { EventEmitter } from 'events';
import { NTEntry } from '../entry/NTEntry';
import {
  NTConnectionInfo,
  NTConnectionListener,
  NTConnectionNotification,
  NTConnectionStatus,
  NTEntryFlags,
  NTEntryInfo,
  NTEntryListener,
  NTEntryListenerOptions,
  NTEntryNotification,
  NTRpcCallback,
  NTRpcCallInfo,
  NTRpcDefinition,
  NTRpcResponseInfo,
  NTValue,
  NTValueType
} from '../types/NTTypes';
import { Timestamp } from '@wpilib/wpiutil/src/timestamp/Timestamp';

/**
 * NetworkTables instance
 *
 * Represents a single NetworkTables instance
 */
export class NTInstance extends EventEmitter {
  private _entries: Map<string, NTEntry>;
  private _entryListeners: Map<number, { entry: string | null; listener: NTEntryListener; options: NTEntryListenerOptions }>;
  private _connectionListeners: Map<number, NTConnectionListener>;
  private _rpcHandlers: Map<string, NTRpcCallback>;
  private _connectionStatus: NTConnectionStatus;
  private _connectionInfo: NTConnectionInfo | null;
  private _nextListenerId: number;

  /**
   * Create a new NetworkTables instance
   */
  constructor() {
    super();
    this._entries = new Map();
    this._entryListeners = new Map();
    this._connectionListeners = new Map();
    this._rpcHandlers = new Map();
    this._connectionStatus = NTConnectionStatus.Disconnected;
    this._connectionInfo = null;
    this._nextListenerId = 0;
  }

  /**
   * Get the connection status
   */
  get connectionStatus(): NTConnectionStatus {
    return this._connectionStatus;
  }

  /**
   * Get the connection info
   */
  get connectionInfo(): NTConnectionInfo | null {
    return this._connectionInfo;
  }

  /**
   * Set the connection status
   *
   * @param status New status
   * @param info Connection info (if connected)
   */
  setConnectionStatus(status: NTConnectionStatus, info: NTConnectionInfo | null = null): void {
    // Check if the status has changed
    if (this._connectionStatus === status &&
        (status !== NTConnectionStatus.Connected ||
         (this._connectionInfo !== null && info !== null &&
          this._connectionInfo.remoteId === info.remoteId &&
          this._connectionInfo.protocolVersion === info.protocolVersion))) {
      return;
    }

    // Update the status
    this._connectionStatus = status;
    this._connectionInfo = info;

    // Notify listeners
    const notification: NTConnectionNotification = {
      connected: status === NTConnectionStatus.Connected,
      conn: info || { remoteId: '', protocolVersion: 0 }
    };

    this._connectionListeners.forEach(listener => {
      listener(notification);
    });

    this.emit('connection', notification);
  }

  /**
   * Get an entry
   *
   * @param name Entry name
   * @returns Entry or undefined if not found
   */
  getEntry(name: string): NTEntry | undefined {
    return this._entries.get(name);
  }

  /**
   * Get all entries
   *
   * @returns Array of entries
   */
  getEntries(): NTEntry[] {
    return Array.from(this._entries.values());
  }

  /**
   * Get entry info
   *
   * @param name Entry name
   * @returns Entry info or null if not found
   */
  getEntryInfo(name: string): NTEntryInfo | null {
    const entry = this._entries.get(name);
    return entry ? entry.getInfo() : null;
  }

  /**
   * Get all entry info
   *
   * @returns Array of entry info
   */
  getAllEntryInfo(): NTEntryInfo[] {
    return Array.from(this._entries.values()).map(entry => entry.getInfo());
  }

  /**
   * Create or update an entry
   *
   * @param name Entry name
   * @param type Entry type
   * @param value Entry value
   * @param flags Entry flags
   * @param notifyListeners Whether to notify listeners (default: true)
   * @returns Entry
   * @throws Error if the entry exists with a different type
   */
  createEntry(name: string, type: NTValueType, value: NTValue, flags: NTEntryFlags = NTEntryFlags.None, notifyListeners: boolean = true): NTEntry {
    // Check if the entry already exists
    let entry = this._entries.get(name);
    const timestamp = Timestamp.getMicroseconds();

    if (entry) {
      // Check if the type matches
      if (entry.type !== type) {
        throw new Error('Entry type mismatch');
      }
      // Update the entry
      entry.setValue(value, timestamp);
      entry.setFlags(flags, timestamp);
    } else {
      // Create a new entry
      entry = new NTEntry(name, type, value, flags, timestamp);
      this._entries.set(name, entry);

      // Notify listeners if requested
      if (notifyListeners) {
        const notification: NTEntryNotification = {
          name,
          value,
          flags,
          timestamp,
          isNew: true,
          isDelete: false
        };

        this._entryListeners.forEach((info, id) => {
          if (info.entry === null || info.entry === name) {
            if (info.options.notifyOnNew) {
              info.listener(notification);
            }
          }
        });

        this.emit('entry', notification);
      }
    }

    return entry;
  }

  /**
   * Delete an entry
   *
   * @param name Entry name
   * @returns True if the entry was deleted
   */
  deleteEntry(name: string): boolean {
    // Check if the entry exists
    const entry = this._entries.get(name);
    if (!entry) {
      return false;
    }

    // Delete the entry
    this._entries.delete(name);

    // Notify listeners
    const timestamp = Timestamp.getMicroseconds();
    const notification: NTEntryNotification = {
      name,
      value: entry.value,
      flags: entry.flags,
      timestamp,
      isNew: false,
      isDelete: true
    };

    this._entryListeners.forEach((info, id) => {
      if (info.entry === null || info.entry === name) {
        if (info.options.notifyOnDelete) {
          info.listener(notification);
        }
      }
    });

    this.emit('delete', notification);

    return true;
  }

  /**
   * Get the value of an entry
   *
   * @param name Entry name
   * @returns Entry value or undefined if not found
   */
  getValue(name: string): NTValue | undefined {
    const entry = this._entries.get(name);
    return entry ? entry.value : undefined;
  }

  /**
   * Set the value of an entry
   *
   * @param name Entry name
   * @param value New value
   * @param notifyListeners Whether to notify listeners (default: true)
   * @returns True if the value was set
   * @throws Error if the value type doesn't match the entry type
   */
  setValue(name: string, value: NTValue, notifyListeners: boolean = true): boolean {
    // Check if the entry exists
    const entry = this._entries.get(name);
    if (!entry) {
      // Create a new entry with the appropriate type
      const type = this._getValueType(value);
      this.createEntry(name, type, value, NTEntryFlags.None, notifyListeners);
      return true;
    }

    // Check if the value type matches the entry type
    const valueType = this._getValueType(value);
    if (valueType !== entry.type) {
      throw new Error('Value type mismatch');
    }

    // Set the value
    const timestamp = Timestamp.getMicroseconds();
    entry.setValue(value, timestamp);

    // Notify listeners if requested
    if (notifyListeners) {
      const notification: NTEntryNotification = {
        name,
        value,
        flags: entry.flags,
        timestamp,
        isNew: false,
        isDelete: false
      };

      this._entryListeners.forEach((info, id) => {
        if (info.entry === null || info.entry === name) {
          if (info.options.notifyOnUpdate) {
            info.listener(notification);
          }
        }
      });

      this.emit('update', notification);
    }

    return true;
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
   * Get the flags of an entry
   *
   * @param name Entry name
   * @returns Entry flags or undefined if not found
   */
  getFlags(name: string): NTEntryFlags | undefined {
    const entry = this._entries.get(name);
    return entry ? entry.flags : undefined;
  }

  /**
   * Set the flags of an entry
   *
   * @param name Entry name
   * @param flags New flags
   * @returns True if the flags were set
   */
  setFlags(name: string, flags: NTEntryFlags): boolean {
    // Check if the entry exists
    const entry = this._entries.get(name);
    if (!entry) {
      return false;
    }

    // Set the flags
    const timestamp = Timestamp.getMicroseconds();
    entry.setFlags(flags, timestamp);

    // Notify listeners
    const notification: NTEntryNotification = {
      name,
      value: entry.value,
      flags,
      timestamp,
      isNew: false,
      isDelete: false
    };

    this._entryListeners.forEach((info, id) => {
      if (info.entry === null || info.entry === name) {
        if (info.options.notifyOnFlagsChange) {
          info.listener(notification);
        }
      }
    });

    this.emit('flags', notification);

    return true;
  }

  /**
   * Add an entry listener
   *
   * @param listener Listener function
   * @param options Listener options
   * @param entryName Entry name (null for all entries)
   * @returns Listener ID
   */
  addEntryListener(
    listener: NTEntryListener,
    options: NTEntryListenerOptions = {
      notifyOnUpdate: true,
      notifyOnNew: true,
      notifyOnDelete: true,
      notifyOnFlagsChange: true,
      notifyImmediately: false
    },
    entryName: string | null = null
  ): number {
    const id = this._nextListenerId++;
    this._entryListeners.set(id, { entry: entryName, listener, options });

    // If notifyImmediately is true, notify the listener of all existing entries
    if (options.notifyImmediately) {
      this._entries.forEach(entry => {
        if (entryName === null || entry.name === entryName) {
          listener({
            name: entry.name,
            value: entry.value,
            flags: entry.flags,
            timestamp: entry.lastChange,
            isNew: true,
            isDelete: false
          });
        }
      });
    }

    return id;
  }

  /**
   * Remove an entry listener
   *
   * @param id Listener ID
   */
  removeEntryListener(id: number): void {
    this._entryListeners.delete(id);
  }

  /**
   * Add a connection listener
   *
   * @param listener Listener function
   * @returns Listener ID
   */
  addConnectionListener(listener: NTConnectionListener): number {
    const id = this._nextListenerId++;
    this._connectionListeners.set(id, listener);

    // Notify the listener of the current connection status
    if (this._connectionStatus === NTConnectionStatus.Connected && this._connectionInfo !== null) {
      listener({
        connected: true,
        conn: this._connectionInfo
      });
    } else {
      listener({
        connected: false,
        conn: { remoteId: '', protocolVersion: 0 }
      });
    }

    return id;
  }

  /**
   * Remove a connection listener
   *
   * @param id Listener ID
   */
  removeConnectionListener(id: number): void {
    this._connectionListeners.delete(id);
  }

  /**
   * Add an RPC handler
   *
   * @param name RPC name
   * @param callback RPC callback
   */
  addRpcHandler(name: string, callback: NTRpcCallback): void {
    this._rpcHandlers.set(name, callback);
  }

  /**
   * Remove an RPC handler
   *
   * @param name RPC name
   */
  removeRpcHandler(name: string): void {
    this._rpcHandlers.delete(name);
  }

  /**
   * Call an RPC
   *
   * @param rpc RPC definition
   * @param params Parameters
   * @returns Promise that resolves with the result
   */
  async callRpc(rpc: NTRpcDefinition, params: Buffer): Promise<Buffer> {
    // Check if the RPC handler exists
    const handler = this._rpcHandlers.get(rpc.name);
    if (!handler) {
      throw new Error(`RPC handler not found: ${rpc.name}`);
    }

    // Call the handler
    const callUid = Math.floor(Math.random() * 1000000);
    const callInfo: NTRpcCallInfo = {
      rpc,
      callUid,
      params
    };

    return await handler(callInfo);
  }
}
