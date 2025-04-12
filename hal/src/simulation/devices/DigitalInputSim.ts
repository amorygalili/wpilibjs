import { NotifyCallback } from '../NotifyCallback';
import { CallbackStore } from './CallbackStore';

/**
 * Class to control a simulated digital input
 */
export class DigitalInputSim {
  // Simulation data storage
  private static initialized: boolean[] = [];
  private static value: boolean[] = [];
  private static pulseLength: number[] = [];
  private static isInput: boolean[] = [];
  
  // Callback storage
  private static initCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static valueCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static pulseLengthCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static isInputCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  
  // Next callback ID
  private static nextCallbackId = 0;
  
  /**
   * Constructor
   * 
   * @param index The digital input channel index
   */
  constructor(private index: number) {
    // Initialize data if not already initialized
    if (DigitalInputSim.value[index] === undefined) {
      DigitalInputSim.initialized[index] = false;
      DigitalInputSim.value[index] = false;
      DigitalInputSim.pulseLength[index] = 0;
      DigitalInputSim.isInput[index] = true;
    }
  }
  
  /**
   * Register a callback to be run when the digital input is initialized
   * 
   * @param callback The callback that will be called whenever the digital input is initialized
   * @param initialNotify If true, the callback will be run with the initial value
   * @returns The CallbackStore object associated with this callback
   */
  registerInitializedCallback(callback: NotifyCallback, initialNotify: boolean): CallbackStore {
    const callbackId = DigitalInputSim.nextCallbackId++;
    
    // Create the callback map if it doesn't exist
    if (!DigitalInputSim.initCallbacks.has(this.index)) {
      DigitalInputSim.initCallbacks.set(this.index, new Map());
    }
    
    // Add the callback
    DigitalInputSim.initCallbacks.get(this.index)!.set(callbackId, callback);
    
    // Run the callback with the initial value if requested
    if (initialNotify) {
      callback.callbackNative('Initialized', 1, DigitalInputSim.initialized[this.index] ? 1 : 0, 0);
    }
    
    // Return a CallbackStore that can be used to cancel the callback
    return new CallbackStore(
      this.index,
      callbackId,
      (index, uid) => {
        const callbacks = DigitalInputSim.initCallbacks.get(index);
        if (callbacks) {
          callbacks.delete(uid);
        }
      }
    );
  }
  
  /**
   * Check if this digital input has been initialized
   * 
   * @returns True if initialized
   */
  getInitialized(): boolean {
    return DigitalInputSim.initialized[this.index];
  }
  
  /**
   * Set whether this digital input has been initialized
   * 
   * @param initialized True if initialized
   */
  setInitialized(initialized: boolean): void {
    DigitalInputSim.initialized[this.index] = initialized;
    
    // Notify callbacks
    const callbacks = DigitalInputSim.initCallbacks.get(this.index);
    if (callbacks) {
      for (const callback of callbacks.values()) {
        callback.callbackNative('Initialized', 1, initialized ? 1 : 0, 0);
      }
    }
  }
  
  /**
   * Register a callback to be run when the digital input value changes
   * 
   * @param callback The callback that will be called whenever the digital input value changes
   * @param initialNotify If true, the callback will be run with the initial value
   * @returns The CallbackStore object associated with this callback
   */
  registerValueCallback(callback: NotifyCallback, initialNotify: boolean): CallbackStore {
    const callbackId = DigitalInputSim.nextCallbackId++;
    
    // Create the callback map if it doesn't exist
    if (!DigitalInputSim.valueCallbacks.has(this.index)) {
      DigitalInputSim.valueCallbacks.set(this.index, new Map());
    }
    
    // Add the callback
    DigitalInputSim.valueCallbacks.get(this.index)!.set(callbackId, callback);
    
    // Run the callback with the initial value if requested
    if (initialNotify) {
      callback.callbackNative('Value', 1, DigitalInputSim.value[this.index] ? 1 : 0, 0);
    }
    
    // Return a CallbackStore that can be used to cancel the callback
    return new CallbackStore(
      this.index,
      callbackId,
      (index, uid) => {
        const callbacks = DigitalInputSim.valueCallbacks.get(index);
        if (callbacks) {
          callbacks.delete(uid);
        }
      }
    );
  }
  
  /**
   * Get the value of this digital input
   * 
   * @returns The value
   */
  getValue(): boolean {
    return DigitalInputSim.value[this.index];
  }
  
  /**
   * Set the value of this digital input
   * 
   * @param value The value
   */
  setValue(value: boolean): void {
    DigitalInputSim.value[this.index] = value;
    
    // Notify callbacks
    const callbacks = DigitalInputSim.valueCallbacks.get(this.index);
    if (callbacks) {
      for (const callback of callbacks.values()) {
        callback.callbackNative('Value', 1, value ? 1 : 0, 0);
      }
    }
  }
  
  /**
   * Reset all simulation data for this object
   */
  resetData(): void {
    DigitalInputSim.initialized[this.index] = false;
    DigitalInputSim.value[this.index] = false;
    DigitalInputSim.pulseLength[this.index] = 0;
    DigitalInputSim.isInput[this.index] = true;
    
    // Notify callbacks
    const initCallbacks = DigitalInputSim.initCallbacks.get(this.index);
    if (initCallbacks) {
      for (const callback of initCallbacks.values()) {
        callback.callbackNative('Initialized', 1, 0, 0);
      }
    }
    
    const valueCallbacks = DigitalInputSim.valueCallbacks.get(this.index);
    if (valueCallbacks) {
      for (const callback of valueCallbacks.values()) {
        callback.callbackNative('Value', 1, 0, 0);
      }
    }
    
    // Reset other callbacks as needed
  }
}
