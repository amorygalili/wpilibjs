import { EventEmitter } from 'events';
import { NTEntryFlags, NTEntryInfo, NTEntryListener, NTEntryNotification, NTValue, NTValueType } from '../types/NTTypes';

/**
 * NetworkTables entry
 *
 * Represents a single entry in the NetworkTables
 */
export class NTEntry extends EventEmitter {
  private _name: string;
  private _type: NTValueType;
  private _value: NTValue;
  private _flags: NTEntryFlags;
  private _lastChange: bigint;
  private _listeners: Map<number, NTEntryListener>;
  private _nextListenerId: number;

  /**
   * Create a new NetworkTables entry
   *
   * @param name Entry name
   * @param type Entry type
   * @param value Entry value
   * @param flags Entry flags
   * @param lastChange Last change time
   */
  constructor(name: string, type: NTValueType, value: NTValue, flags: NTEntryFlags = NTEntryFlags.None, lastChange: bigint = 0n) {
    super();
    this._name = name;
    this._type = type;
    this._value = value;
    this._flags = flags;
    this._lastChange = lastChange;
    this._listeners = new Map();
    this._nextListenerId = 0;
  }

  /**
   * Get the entry name
   */
  get name(): string {
    return this._name;
  }

  /**
   * Get the entry type
   */
  get type(): NTValueType {
    return this._type;
  }

  /**
   * Get the entry value
   */
  get value(): NTValue {
    return this._value;
  }

  /**
   * Set the entry value
   *
   * @param value New value
   * @param timestamp Timestamp (in microseconds since NT epoch)
   */
  setValue(value: NTValue, timestamp: bigint): void {
    // Check if the value has changed
    if (this._valueEquals(value)) {
      return;
    }

    // Update the value
    this._value = value;
    this._lastChange = timestamp;

    // Notify listeners
    const notification: NTEntryNotification = {
      name: this._name,
      value,
      flags: this._flags,
      timestamp,
      isNew: false,
      isDelete: false
    };

    this._listeners.forEach(listener => {
      listener(notification);
    });

    this.emit('update', notification);
  }

  /**
   * Get the entry flags
   */
  get flags(): NTEntryFlags {
    return this._flags;
  }

  /**
   * Set the entry flags
   *
   * @param flags New flags
   * @param timestamp Timestamp (in microseconds since NT epoch)
   */
  setFlags(flags: NTEntryFlags, timestamp: bigint): void {
    // Check if the flags have changed
    if (this._flags === flags) {
      return;
    }

    // Update the flags
    this._flags = flags;
    this._lastChange = timestamp;

    // Notify listeners
    const notification: NTEntryNotification = {
      name: this._name,
      value: this._value,
      flags,
      timestamp,
      isNew: false,
      isDelete: false
    };

    this._listeners.forEach(listener => {
      listener(notification);
    });

    this.emit('flags', notification);
  }

  /**
   * Get the last change time
   */
  get lastChange(): bigint {
    return this._lastChange;
  }

  /**
   * Get the entry info
   */
  getInfo(): NTEntryInfo {
    return {
      name: this._name,
      type: this._type,
      flags: this._flags,
      lastChange: this._lastChange
    };
  }

  /**
   * Add an entry listener
   *
   * @param listener Listener function
   * @returns Listener ID
   */
  addEntryListener(listener: NTEntryListener): number {
    const id = this._nextListenerId++;
    this._listeners.set(id, listener);
    return id;
  }

  /**
   * Remove an entry listener
   *
   * @param id Listener ID
   */
  removeEntryListener(id: number): void {
    this._listeners.delete(id);
  }

  /**
   * Check if the value equals another value
   *
   * @param value Value to compare
   * @returns True if the values are equal
   */
  private _valueEquals(value: NTValue): boolean {
    // If the types are different, the values are not equal
    if (typeof this._value !== typeof value) {
      return false;
    }

    // Handle arrays
    if (Array.isArray(this._value) && Array.isArray(value)) {
      // If the lengths are different, the arrays are not equal
      if (this._value.length !== value.length) {
        return false;
      }

      // Check each element
      for (let i = 0; i < this._value.length; i++) {
        if (this._value[i] !== value[i]) {
          return false;
        }
      }

      return true;
    }

    // Handle Buffer
    if (Buffer.isBuffer(this._value) && Buffer.isBuffer(value)) {
      return this._value.equals(value);
    }

    // Handle primitive values
    return this._value === value;
  }
}
