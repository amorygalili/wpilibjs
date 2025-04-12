import { EventEmitter } from 'events';
import { NTValue, NTValueType, NTEntryFlags, NTEntryNotification } from '../types/NTTypes';
import { NTInstance } from '../instance/NTInstance';

/**
 * Topic options
 */
export interface TopicOptions {
  /** Whether the topic is persistent (saved to disk) */
  persistent?: boolean;
}

/**
 * Topic events
 */
export interface TopicEvents<T> {
  /** Emitted when the value changes */
  valueChanged: (value: T) => void;
  /** Emitted when the flags change */
  flagsChanged: (flags: NTEntryFlags) => void;
  /** Emitted when the entry is deleted */
  deleted: () => void;
}

/**
 * NetworkTables topic
 *
 * Represents a single entry in NetworkTables with type safety
 */
export class Topic<T extends NTValue> extends EventEmitter {
  // Type declaration for events
  declare public on: <K extends keyof TopicEvents<T>>(event: K, listener: TopicEvents<T>[K]) => this;
  declare public emit: <K extends keyof TopicEvents<T>>(event: K, ...args: Parameters<TopicEvents<T>[K]>) => boolean;
  private _instance: NTInstance;
  private _name: string;
  private _defaultValue: T;
  private _listenerId: number | null = null;
  private _valueType: NTValueType;

  /**
   * Create a new topic
   *
   * @param instance NetworkTables instance
   * @param name Topic name
   * @param defaultValue Default value
   * @param options Topic options
   */
  constructor(instance: NTInstance, name: string, defaultValue: T, options: TopicOptions = {}) {
    super();
    this._instance = instance;
    this._name = name;
    this._defaultValue = defaultValue;
    this._valueType = this._getValueType(defaultValue);

    // Create entry if it doesn't exist
    const entry = this._instance.getEntry(name);
    if (!entry) {
      const flags = options.persistent ? NTEntryFlags.Persistent : NTEntryFlags.None;
      this._instance.createEntry(name, this._valueType, defaultValue, flags);
    }

    // Set up listener
    this._listenerId = this._instance.addEntryListener(
      this._handleNotification.bind(this),
      {
        notifyOnUpdate: true,
        notifyOnNew: true,
        notifyOnDelete: true,
        notifyOnFlagsChange: true,
        notifyImmediately: false
      },
      name
    );
  }

  /**
   * Get the topic name
   */
  get name(): string {
    return this._name;
  }

  /**
   * Get the current value
   */
  get value(): T {
    return (this._instance.getValue(this._name) ?? this._defaultValue) as T;
  }

  /**
   * Set the value
   */
  set value(value: T) {
    this.setValue(value);
  }

  /**
   * Set the value
   *
   * @param value New value
   */
  setValue(value: T): void {
    // Check if entry exists
    const entry = this._instance.getEntry(this._name);
    if (entry) {
      // Update the entry
      this._instance.setValue(this._name, value);

      // Emit the value change event directly
      // This helps with immediate feedback in the UI
      this.emit('valueChanged', value);
    } else {
      // Create entry if it doesn't exist
      this._instance.createEntry(this._name, this._valueType, value);

      // Emit the value change event directly
      this.emit('valueChanged', value);
    }
  }

  /**
   * Get whether the topic is persistent
   */
  get persistent(): boolean {
    const flags = this._instance.getFlags(this._name);
    return flags ? (flags & NTEntryFlags.Persistent) !== 0 : false;
  }

  /**
   * Set whether the topic is persistent
   */
  set persistent(value: boolean) {
    this.setPersistent(value);
  }

  /**
   * Set whether the topic is persistent
   *
   * @param value Whether the topic is persistent
   */
  setPersistent(value: boolean): void {
    const entry = this._instance.getEntry(this._name);
    if (entry) {
      const flags = value
        ? entry.flags | NTEntryFlags.Persistent
        : entry.flags & ~NTEntryFlags.Persistent;
      this._instance.setFlags(this._name, flags);
    }
  }

  /**
   * Handle entry notifications
   *
   * @param notification Entry notification
   */
  private _handleNotification(notification: NTEntryNotification): void {
    // Emit value change event
    this.emit('valueChanged', notification.value as T);

    // Emit flags change event
    this.emit('flagsChanged', notification.flags);

    // Emit delete event
    if (notification.isDelete) {
      this.emit('deleted');
    }
  }

  /**
   * Get the value type for a value
   *
   * @param value Value to get type for
   * @returns Value type
   */
  private _getValueType(value: NTValue): NTValueType {
    if (typeof value === 'boolean') {
      return NTValueType.Boolean;
    } else if (typeof value === 'number') {
      return NTValueType.Double;
    } else if (typeof value === 'string') {
      return NTValueType.String;
    } else if (value instanceof Uint8Array) {
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
   * Clean up resources
   */
  dispose(): void {
    // Remove listener
    if (this._listenerId !== null) {
      this._instance.removeEntryListener(this._listenerId);
      this._listenerId = null;
    }

    // Remove all listeners
    this.removeAllListeners();
  }
}
