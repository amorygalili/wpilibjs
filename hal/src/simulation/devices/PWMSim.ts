import { NotifyCallback } from '../NotifyCallback';
import { CallbackStore } from './CallbackStore';

/**
 * Class to control a simulated PWM output
 */
export class PWMSim {
  // Simulation data storage
  private static initialized: boolean[] = [];
  private static speed: number[] = [];
  private static position: number[] = [];
  private static rawValue: number[] = [];
  private static periodScale: number[] = [];
  private static zeroLatch: boolean[] = [];
  
  // Callback storage
  private static initCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static speedCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static positionCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static rawValueCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static periodScaleCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static zeroLatchCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  
  // Next callback ID
  private static nextCallbackId = 0;
  
  /**
   * Constructor
   * 
   * @param index The PWM channel index
   */
  constructor(private index: number) {
    // Initialize data if not already initialized
    if (PWMSim.speed[index] === undefined) {
      PWMSim.initialized[index] = false;
      PWMSim.speed[index] = 0;
      PWMSim.position[index] = 0;
      PWMSim.rawValue[index] = 0;
      PWMSim.periodScale[index] = 0;
      PWMSim.zeroLatch[index] = false;
    }
  }
  
  /**
   * Register a callback to be run when the PWM is initialized
   * 
   * @param callback The callback that will be called whenever the PWM is initialized
   * @param initialNotify If true, the callback will be run with the initial value
   * @returns The CallbackStore object associated with this callback
   */
  registerInitializedCallback(callback: NotifyCallback, initialNotify: boolean): CallbackStore {
    const callbackId = PWMSim.nextCallbackId++;
    
    // Create the callback map if it doesn't exist
    if (!PWMSim.initCallbacks.has(this.index)) {
      PWMSim.initCallbacks.set(this.index, new Map());
    }
    
    // Add the callback
    PWMSim.initCallbacks.get(this.index)!.set(callbackId, callback);
    
    // Run the callback with the initial value if requested
    if (initialNotify) {
      callback.callbackNative('Initialized', 1, PWMSim.initialized[this.index] ? 1 : 0, 0);
    }
    
    // Return a CallbackStore that can be used to cancel the callback
    return new CallbackStore(
      this.index,
      callbackId,
      (index, uid) => {
        const callbacks = PWMSim.initCallbacks.get(index);
        if (callbacks) {
          callbacks.delete(uid);
        }
      }
    );
  }
  
  /**
   * Check if this PWM has been initialized
   * 
   * @returns True if initialized
   */
  getInitialized(): boolean {
    return PWMSim.initialized[this.index];
  }
  
  /**
   * Set whether this PWM has been initialized
   * 
   * @param initialized True if initialized
   */
  setInitialized(initialized: boolean): void {
    PWMSim.initialized[this.index] = initialized;
    
    // Notify callbacks
    const callbacks = PWMSim.initCallbacks.get(this.index);
    if (callbacks) {
      for (const callback of callbacks.values()) {
        callback.callbackNative('Initialized', 1, initialized ? 1 : 0, 0);
      }
    }
  }
  
  /**
   * Register a callback to be run when the PWM speed changes
   * 
   * @param callback The callback that will be called whenever the PWM speed changes
   * @param initialNotify If true, the callback will be run with the initial value
   * @returns The CallbackStore object associated with this callback
   */
  registerSpeedCallback(callback: NotifyCallback, initialNotify: boolean): CallbackStore {
    const callbackId = PWMSim.nextCallbackId++;
    
    // Create the callback map if it doesn't exist
    if (!PWMSim.speedCallbacks.has(this.index)) {
      PWMSim.speedCallbacks.set(this.index, new Map());
    }
    
    // Add the callback
    PWMSim.speedCallbacks.get(this.index)!.set(callbackId, callback);
    
    // Run the callback with the initial value if requested
    if (initialNotify) {
      callback.callbackNative('Speed', 2, 0, PWMSim.speed[this.index]);
    }
    
    // Return a CallbackStore that can be used to cancel the callback
    return new CallbackStore(
      this.index,
      callbackId,
      (index, uid) => {
        const callbacks = PWMSim.speedCallbacks.get(index);
        if (callbacks) {
          callbacks.delete(uid);
        }
      }
    );
  }
  
  /**
   * Get the speed of this PWM
   * 
   * @returns The speed (-1.0 to 1.0)
   */
  getSpeed(): number {
    return PWMSim.speed[this.index];
  }
  
  /**
   * Set the speed of this PWM
   * 
   * @param speed The speed (-1.0 to 1.0)
   */
  setSpeed(speed: number): void {
    PWMSim.speed[this.index] = speed;
    
    // Notify callbacks
    const callbacks = PWMSim.speedCallbacks.get(this.index);
    if (callbacks) {
      for (const callback of callbacks.values()) {
        callback.callbackNative('Speed', 2, 0, speed);
      }
    }
  }
  
  /**
   * Register a callback to be run when the PWM position changes
   * 
   * @param callback The callback that will be called whenever the PWM position changes
   * @param initialNotify If true, the callback will be run with the initial value
   * @returns The CallbackStore object associated with this callback
   */
  registerPositionCallback(callback: NotifyCallback, initialNotify: boolean): CallbackStore {
    const callbackId = PWMSim.nextCallbackId++;
    
    // Create the callback map if it doesn't exist
    if (!PWMSim.positionCallbacks.has(this.index)) {
      PWMSim.positionCallbacks.set(this.index, new Map());
    }
    
    // Add the callback
    PWMSim.positionCallbacks.get(this.index)!.set(callbackId, callback);
    
    // Run the callback with the initial value if requested
    if (initialNotify) {
      callback.callbackNative('Position', 2, 0, PWMSim.position[this.index]);
    }
    
    // Return a CallbackStore that can be used to cancel the callback
    return new CallbackStore(
      this.index,
      callbackId,
      (index, uid) => {
        const callbacks = PWMSim.positionCallbacks.get(index);
        if (callbacks) {
          callbacks.delete(uid);
        }
      }
    );
  }
  
  /**
   * Get the position of this PWM
   * 
   * @returns The position (0.0 to 1.0)
   */
  getPosition(): number {
    return PWMSim.position[this.index];
  }
  
  /**
   * Set the position of this PWM
   * 
   * @param position The position (0.0 to 1.0)
   */
  setPosition(position: number): void {
    PWMSim.position[this.index] = position;
    
    // Notify callbacks
    const callbacks = PWMSim.positionCallbacks.get(this.index);
    if (callbacks) {
      for (const callback of callbacks.values()) {
        callback.callbackNative('Position', 2, 0, position);
      }
    }
  }
  
  /**
   * Register a callback to be run when the PWM raw value changes
   * 
   * @param callback The callback that will be called whenever the PWM raw value changes
   * @param initialNotify If true, the callback will be run with the initial value
   * @returns The CallbackStore object associated with this callback
   */
  registerRawValueCallback(callback: NotifyCallback, initialNotify: boolean): CallbackStore {
    const callbackId = PWMSim.nextCallbackId++;
    
    // Create the callback map if it doesn't exist
    if (!PWMSim.rawValueCallbacks.has(this.index)) {
      PWMSim.rawValueCallbacks.set(this.index, new Map());
    }
    
    // Add the callback
    PWMSim.rawValueCallbacks.get(this.index)!.set(callbackId, callback);
    
    // Run the callback with the initial value if requested
    if (initialNotify) {
      callback.callbackNative('RawValue', 8, PWMSim.rawValue[this.index], 0);
    }
    
    // Return a CallbackStore that can be used to cancel the callback
    return new CallbackStore(
      this.index,
      callbackId,
      (index, uid) => {
        const callbacks = PWMSim.rawValueCallbacks.get(index);
        if (callbacks) {
          callbacks.delete(uid);
        }
      }
    );
  }
  
  /**
   * Get the raw value of this PWM
   * 
   * @returns The raw value (0 to 4095)
   */
  getRawValue(): number {
    return PWMSim.rawValue[this.index];
  }
  
  /**
   * Set the raw value of this PWM
   * 
   * @param rawValue The raw value (0 to 4095)
   */
  setRawValue(rawValue: number): void {
    PWMSim.rawValue[this.index] = rawValue;
    
    // Notify callbacks
    const callbacks = PWMSim.rawValueCallbacks.get(this.index);
    if (callbacks) {
      for (const callback of callbacks.values()) {
        callback.callbackNative('RawValue', 8, rawValue, 0);
      }
    }
  }
  
  /**
   * Reset all simulation data for this object
   */
  resetData(): void {
    PWMSim.initialized[this.index] = false;
    PWMSim.speed[this.index] = 0;
    PWMSim.position[this.index] = 0;
    PWMSim.rawValue[this.index] = 0;
    PWMSim.periodScale[this.index] = 0;
    PWMSim.zeroLatch[this.index] = false;
    
    // Notify callbacks
    const initCallbacks = PWMSim.initCallbacks.get(this.index);
    if (initCallbacks) {
      for (const callback of initCallbacks.values()) {
        callback.callbackNative('Initialized', 1, 0, 0);
      }
    }
    
    const speedCallbacks = PWMSim.speedCallbacks.get(this.index);
    if (speedCallbacks) {
      for (const callback of speedCallbacks.values()) {
        callback.callbackNative('Speed', 2, 0, 0);
      }
    }
    
    const positionCallbacks = PWMSim.positionCallbacks.get(this.index);
    if (positionCallbacks) {
      for (const callback of positionCallbacks.values()) {
        callback.callbackNative('Position', 2, 0, 0);
      }
    }
    
    const rawValueCallbacks = PWMSim.rawValueCallbacks.get(this.index);
    if (rawValueCallbacks) {
      for (const callback of rawValueCallbacks.values()) {
        callback.callbackNative('RawValue', 8, 0, 0);
      }
    }
    
    // Reset other callbacks as needed
  }
}
