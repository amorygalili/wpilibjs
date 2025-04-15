import { NetworkTableInstance } from './NetworkTableInstance';
import { Topic } from './Topic';

/**
 * NetworkTables Entry.
 */
export class NetworkTableEntry {
  private instance: NetworkTableInstance;
  private name: string;
  private topic: Topic;
  private lastValue: any = null;
  private lastTimestamp: number = 0;
  private subscriptionId: number = -1;

  /**
   * Constructor. Use NetworkTable.getEntry() instead.
   */
  constructor(instance: NetworkTableInstance, name: string) {
    this.instance = instance;
    this.name = name;
    this.topic = instance.getTopic(name);
  }

  /**
   * Gets the instance for the entry.
   *
   * @returns Instance
   */
  public getInstance(): NetworkTableInstance {
    return this.instance;
  }

  /**
   * Gets the topic for the entry.
   *
   * @returns Topic
   */
  public getTopic(): Topic {
    return this.topic;
  }

  /**
   * Gets the name of the entry.
   *
   * @returns Entry name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Determines if the entry exists.
   *
   * @returns True if the entry exists
   */
  public exists(): boolean {
    // In NT4, a topic exists if it has been announced
    return this.topic.exists();
  }

  /**
   * Gets the last time the entry's value was changed.
   *
   * @returns Time in microseconds
   */
  public getLastChange(): number {
    return this.lastTimestamp;
  }

  /**
   * Gets the entry's value.
   *
   * @returns The value or null if the entry does not exist
   */
  public getValue(): any {
    return this.lastValue;
  }

  /**
   * Gets the entry's value as a boolean.
   *
   * @param defaultValue the default value to return if the entry does not exist
   * @returns The value or the default value if the entry does not exist
   */
  public getBoolean(defaultValue: boolean): boolean {
    if (this.lastValue === null) {
      return defaultValue;
    }
    return Boolean(this.lastValue);
  }

  /**
   * Gets the entry's value as a double.
   *
   * @param defaultValue the default value to return if the entry does not exist
   * @returns The value or the default value if the entry does not exist
   */
  public getDouble(defaultValue: number): number {
    if (this.lastValue === null || typeof this.lastValue !== 'number') {
      return defaultValue;
    }
    return this.lastValue;
  }

  /**
   * Gets the entry's value as an integer.
   *
   * @param defaultValue the default value to return if the entry does not exist
   * @returns The value or the default value if the entry does not exist
   */
  public getInteger(defaultValue: number): number {
    if (this.lastValue === null || typeof this.lastValue !== 'number') {
      return defaultValue;
    }
    return Math.floor(this.lastValue);
  }

  /**
   * Gets the entry's value as a float.
   *
   * @param defaultValue the default value to return if the entry does not exist
   * @returns The value or the default value if the entry does not exist
   */
  public getFloat(defaultValue: number): number {
    if (this.lastValue === null || typeof this.lastValue !== 'number') {
      return defaultValue;
    }
    return this.lastValue;
  }

  /**
   * Gets the entry's value as a string.
   *
   * @param defaultValue the default value to return if the entry does not exist
   * @returns The value or the default value if the entry does not exist
   */
  public getString(defaultValue: string): string {
    if (this.lastValue === null) {
      return defaultValue;
    }
    return String(this.lastValue);
  }

  /**
   * Gets the entry's value as a raw value (byte array).
   *
   * @param defaultValue the default value to return if the entry does not exist
   * @returns The value or the default value if the entry does not exist
   */
  public getRaw(defaultValue: Uint8Array): Uint8Array {
    if (this.lastValue === null || !(this.lastValue instanceof Uint8Array)) {
      return defaultValue;
    }
    return this.lastValue;
  }

  /**
   * Gets the entry's value as a boolean array.
   *
   * @param defaultValue the default value to return if the entry does not exist
   * @returns The value or the default value if the entry does not exist
   */
  public getBooleanArray(defaultValue: boolean[]): boolean[] {
    if (this.lastValue === null || !Array.isArray(this.lastValue)) {
      return defaultValue;
    }
    return this.lastValue.map(Boolean);
  }

  /**
   * Gets the entry's value as a double array.
   *
   * @param defaultValue the default value to return if the entry does not exist
   * @returns The value or the default value if the entry does not exist
   */
  public getDoubleArray(defaultValue: number[]): number[] {
    if (this.lastValue === null || !Array.isArray(this.lastValue)) {
      return defaultValue;
    }
    return this.lastValue;
  }

  /**
   * Gets the entry's value as an integer array.
   *
   * @param defaultValue the default value to return if the entry does not exist
   * @returns The value or the default value if the entry does not exist
   */
  public getIntegerArray(defaultValue: number[]): number[] {
    if (this.lastValue === null || !Array.isArray(this.lastValue)) {
      return defaultValue;
    }
    return this.lastValue.map(Math.floor);
  }

  /**
   * Gets the entry's value as a float array.
   *
   * @param defaultValue the default value to return if the entry does not exist
   * @returns The value or the default value if the entry does not exist
   */
  public getFloatArray(defaultValue: number[]): number[] {
    if (this.lastValue === null || !Array.isArray(this.lastValue)) {
      return defaultValue;
    }
    return this.lastValue;
  }

  /**
   * Gets the entry's value as a string array.
   *
   * @param defaultValue the default value to return if the entry does not exist
   * @returns The value or the default value if the entry does not exist
   */
  public getStringArray(defaultValue: string[]): string[] {
    if (this.lastValue === null || !Array.isArray(this.lastValue)) {
      return defaultValue;
    }
    return this.lastValue.map(String);
  }

  /**
   * Sets the entry's value.
   *
   * @param value the value to set
   * @returns False if the entry exists with a different type
   */
  public setValue(value: any): boolean {
    const client = this.instance.getClient();

    // Determine the type based on the value
    let type: string;
    if (typeof value === 'boolean') {
      type = 'boolean';
    } else if (typeof value === 'number') {
      type = 'double';
    } else if (typeof value === 'string') {
      type = 'string';
    } else if (value instanceof Uint8Array) {
      type = 'raw';
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        type = 'double[]'; // Default to double array for empty arrays
      } else if (typeof value[0] === 'boolean') {
        type = 'boolean[]';
      } else if (typeof value[0] === 'number') {
        type = 'double[]';
      } else if (typeof value[0] === 'string') {
        type = 'string[]';
      } else {
        return false; // Unsupported array type
      }
    } else {
      return false; // Unsupported type
    }

    try {
      // Publish the topic if it doesn't exist
      if (!this.topic.exists()) {
        // Use the topic's publish method to set type and existence
        this.topic.publish(type);
      }

      // Set the value
      client.addSample(this.name, value);

      // Update local state
      this.lastValue = value;
      this.lastTimestamp = Date.now() * 1000; // Convert to microseconds

      return true;
    } catch (error) {
      console.error(`Error setting value for ${this.name}:`, error);
      return false;
    }
  }

  /**
   * Sets the entry's value as a boolean.
   *
   * @param value the value to set
   * @returns False if the entry exists with a different type
   */
  public setBoolean(value: boolean): boolean {
    return this.setValue(value);
  }

  /**
   * Sets the entry's value as a double.
   *
   * @param value the value to set
   * @returns False if the entry exists with a different type
   */
  public setDouble(value: number): boolean {
    return this.setValue(value);
  }

  /**
   * Sets the entry's value as an integer.
   *
   * @param value the value to set
   * @returns False if the entry exists with a different type
   */
  public setInteger(value: number): boolean {
    return this.setValue(Math.floor(value));
  }

  /**
   * Sets the entry's value as a float.
   *
   * @param value the value to set
   * @returns False if the entry exists with a different type
   */
  public setFloat(value: number): boolean {
    return this.setValue(value);
  }

  /**
   * Sets the entry's value as a string.
   *
   * @param value the value to set
   * @returns False if the entry exists with a different type
   */
  public setString(value: string): boolean {
    return this.setValue(value);
  }

  /**
   * Sets the entry's value as a raw value (byte array).
   *
   * @param value the value to set
   * @returns False if the entry exists with a different type
   */
  public setRaw(value: Uint8Array): boolean {
    return this.setValue(value);
  }

  /**
   * Sets the entry's value as a boolean array.
   *
   * @param value the value to set
   * @returns False if the entry exists with a different type
   */
  public setBooleanArray(value: boolean[]): boolean {
    return this.setValue(value);
  }

  /**
   * Sets the entry's value as a double array.
   *
   * @param value the value to set
   * @returns False if the entry exists with a different type
   */
  public setDoubleArray(value: number[]): boolean {
    return this.setValue(value);
  }

  /**
   * Sets the entry's value as an integer array.
   *
   * @param value the value to set
   * @returns False if the entry exists with a different type
   */
  public setIntegerArray(value: number[]): boolean {
    return this.setValue(value.map(Math.floor));
  }

  /**
   * Sets the entry's value as a float array.
   *
   * @param value the value to set
   * @returns False if the entry exists with a different type
   */
  public setFloatArray(value: number[]): boolean {
    return this.setValue(value);
  }

  /**
   * Sets the entry's value as a string array.
   *
   * @param value the value to set
   * @returns False if the entry exists with a different type
   */
  public setStringArray(value: string[]): boolean {
    return this.setValue(value);
  }
}
