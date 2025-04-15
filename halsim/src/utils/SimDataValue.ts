/**
 * Simulation data value implementation
 */

import { HAL_Value, HAL_NotifyCallback } from '../HALTypes';
import { NotifyCallbackRegistry } from './Callbacks';

/**
 * Simulation data value
 */
export class SimDataValue<T> {
  private value: T;
  private readonly callbacks: NotifyCallbackRegistry;
  private readonly name: string;
  private readonly makeValue: (value: T) => HAL_Value;

  /**
   * Create a new simulation data value
   * @param name Name of the value
   * @param initialValue Initial value
   * @param makeValue Function to convert value to HAL_Value
   */
  constructor(name: string, initialValue: T, makeValue: (value: T) => HAL_Value) {
    this.name = name;
    this.value = initialValue;
    this.makeValue = makeValue;
    this.callbacks = new NotifyCallbackRegistry();
  }

  /**
   * Get the current value
   * @returns Current value
   */
  get(): T {
    return this.value;
  }

  /**
   * Set the value
   * @param value New value
   */
  set(value: T): void {
    if (this.value !== value) {
      this.value = value;
      this.callbacks.notify(this.name, this.makeValue(value));
    }
  }

  /**
   * Register a callback for value changes
   * @param callback Callback function
   * @param param Parameter to pass to callback
   * @param initialNotify Whether to call the callback immediately with the current value
   * @returns UID for the callback
   */
  registerCallback(callback: HAL_NotifyCallback, param: any, initialNotify: boolean): number {
    const uid = this.callbacks.register(callback, param);
    
    if (initialNotify && uid !== -1) {
      callback(this.name, param, this.makeValue(this.value));
    }
    
    return uid;
  }

  /**
   * Cancel a callback
   * @param uid UID of the callback to cancel
   */
  cancelCallback(uid: number): void {
    this.callbacks.cancel(uid);
  }

  /**
   * Reset the value to its initial state
   * @param value New value
   */
  reset(value: T): void {
    this.value = value;
    this.callbacks.reset();
  }
}
