import { SendableBuilder } from './SendableBuilder';

/**
 * The base interface for objects that can be sent over the network through network tables
 */
export interface Sendable {
  /**
   * Initialize this Sendable object
   * 
   * @param builder The builder used to construct this sendable
   */
  initSendable(builder: SendableBuilder): void;
}

/**
 * A helper class for implementing Sendable objects
 */
export abstract class SendableBase implements Sendable {
  /**
   * Initialize this Sendable object
   * 
   * @param builder The builder used to construct this sendable
   */
  abstract initSendable(builder: SendableBuilder): void;
}

/**
 * A helper class for implementing Sendable objects that store their name internally
 */
export abstract class SendableWithName extends SendableBase {
  private name: string = '';
  
  /**
   * Set the name of this Sendable object
   * 
   * @param name The name
   */
  setName(name: string): void {
    this.name = name;
  }
  
  /**
   * Get the name of this Sendable object
   * 
   * @returns The name
   */
  getName(): string {
    return this.name;
  }
}

/**
 * A helper class for implementing Sendable objects that represent a single value
 */
export abstract class SendableValue<T> extends SendableWithName {
  private value: T;
  private readonly valueGetter: () => T;
  private valueSetter?: (value: T) => void;
  
  /**
   * Create a new SendableValue
   * 
   * @param defaultValue The default value
   * @param valueGetter A function that returns the current value
   * @param valueSetter A function that sets the value (optional)
   */
  constructor(defaultValue: T, valueGetter: () => T, valueSetter?: (value: T) => void) {
    super();
    this.value = defaultValue;
    this.valueGetter = valueGetter;
    this.valueSetter = valueSetter;
  }
  
  /**
   * Get the current value
   * 
   * @returns The current value
   */
  getValue(): T {
    return this.valueGetter();
  }
  
  /**
   * Set the value
   * 
   * @param value The new value
   */
  setValue(value: T): void {
    if (this.valueSetter) {
      this.valueSetter(value);
    }
  }
  
  /**
   * Check if this value is writable
   * 
   * @returns True if this value is writable
   */
  isWritable(): boolean {
    return this.valueSetter !== undefined;
  }
  
  /**
   * Initialize this Sendable object
   * 
   * @param builder The builder used to construct this sendable
   */
  abstract initSendable(builder: SendableBuilder): void;
}
