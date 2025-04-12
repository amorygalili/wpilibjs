import { HALValue, HALValueType } from '../HALTypes';

/**
 * Callback interface for simulation value changes
 */
export interface NotifyCallback {
  /**
   * Called when a simulation value changes
   * 
   * @param name The name of the value that changed
   * @param value The new value
   */
  callback(name: string, value: HALValue): void;
  
  /**
   * Called from native code (in our case, this is a helper method)
   * 
   * @param name The name of the value that changed
   * @param type The type of the value
   * @param value1 The first part of the value (for boolean, int, enum, long)
   * @param value2 The second part of the value (for double)
   */
  callbackNative(name: string, type: HALValueType, value1: number | bigint, value2: number): void;
}

/**
 * Implementation of NotifyCallback that wraps a simple function
 */
export class NotifyCallbackFunc implements NotifyCallback {
  /**
   * Create a NotifyCallback from a function
   * 
   * @param func The function to call
   * @returns A NotifyCallback that calls the function
   */
  static create(func: (name: string, value: HALValue) => void): NotifyCallback {
    return new NotifyCallbackFunc(func);
  }
  
  /**
   * Constructor
   * 
   * @param func The function to call
   */
  constructor(private func: (name: string, value: HALValue) => void) {}
  
  /**
   * Called when a simulation value changes
   * 
   * @param name The name of the value that changed
   * @param value The new value
   */
  callback(name: string, value: HALValue): void {
    this.func(name, value);
  }
  
  /**
   * Called from native code (in our case, this is a helper method)
   * 
   * @param name The name of the value that changed
   * @param type The type of the value
   * @param value1 The first part of the value (for boolean, int, enum, long)
   * @param value2 The second part of the value (for double)
   */
  callbackNative(name: string, type: HALValueType, value1: number | bigint, value2: number): void {
    // Convert the native values to a HALValue
    const value: HALValue = {
      type,
      data: type === HALValueType.Double ? value2 : value1
    };
    
    this.callback(name, value);
  }
}
