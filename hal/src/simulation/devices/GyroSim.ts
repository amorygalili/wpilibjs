import { NotifyCallback } from '../NotifyCallback';
import { CallbackStore } from './CallbackStore';

/**
 * Class to control a simulated analog gyro
 */
export class GyroSim {
  // Simulation data storage
  private static initialized: boolean[] = [];
  private static angle: number[] = [];
  private static rate: number[] = [];
  
  // Callback storage
  private static initCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static angleCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static rateCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  
  // Next callback ID
  private static nextCallbackId = 0;
  
  /**
   * Constructor
   * 
   * @param index The gyro index
   */
  constructor(private index: number) {
    // Initialize data if not already initialized
    if (GyroSim.angle[index] === undefined) {
      GyroSim.initialized[index] = false;
      GyroSim.angle[index] = 0;
      GyroSim.rate[index] = 0;
    }
  }
  
  /**
   * Register a callback to be run when the gyro angle changes
   * 
   * @param callback The callback that will be called whenever the gyro angle changes
   * @param initialNotify If true, the callback will be run with the initial value
   * @returns The CallbackStore object associated with this callback
   */
  registerAngleCallback(callback: NotifyCallback, initialNotify: boolean): CallbackStore {
    const callbackId = GyroSim.nextCallbackId++;
    
    // Create the callback map if it doesn't exist
    if (!GyroSim.angleCallbacks.has(this.index)) {
      GyroSim.angleCallbacks.set(this.index, new Map());
    }
    
    // Add the callback
    GyroSim.angleCallbacks.get(this.index)!.set(callbackId, callback);
    
    // Run the callback with the initial value if requested
    if (initialNotify) {
      callback.callbackNative('Angle', 2, 0, GyroSim.angle[this.index]);
    }
    
    // Return a CallbackStore that can be used to cancel the callback
    return new CallbackStore(
      this.index,
      callbackId,
      (index, uid) => {
        const callbacks = GyroSim.angleCallbacks.get(index);
        if (callbacks) {
          callbacks.delete(uid);
        }
      }
    );
  }
  
  /**
   * Get the angle of this gyro
   * 
   * @returns The angle
   */
  getAngle(): number {
    return GyroSim.angle[this.index];
  }
  
  /**
   * Set the angle of this gyro
   * 
   * @param angle The angle
   */
  setAngle(angle: number): void {
    GyroSim.angle[this.index] = angle;
    
    // Notify callbacks
    const callbacks = GyroSim.angleCallbacks.get(this.index);
    if (callbacks) {
      for (const callback of callbacks.values()) {
        callback.callbackNative('Angle', 2, 0, angle);
      }
    }
  }
  
  /**
   * Register a callback to be run when the gyro rate changes
   * 
   * @param callback The callback that will be called whenever the gyro rate changes
   * @param initialNotify If true, the callback will be run with the initial value
   * @returns The CallbackStore object associated with this callback
   */
  registerRateCallback(callback: NotifyCallback, initialNotify: boolean): CallbackStore {
    const callbackId = GyroSim.nextCallbackId++;
    
    // Create the callback map if it doesn't exist
    if (!GyroSim.rateCallbacks.has(this.index)) {
      GyroSim.rateCallbacks.set(this.index, new Map());
    }
    
    // Add the callback
    GyroSim.rateCallbacks.get(this.index)!.set(callbackId, callback);
    
    // Run the callback with the initial value if requested
    if (initialNotify) {
      callback.callbackNative('Rate', 2, 0, GyroSim.rate[this.index]);
    }
    
    // Return a CallbackStore that can be used to cancel the callback
    return new CallbackStore(
      this.index,
      callbackId,
      (index, uid) => {
        const callbacks = GyroSim.rateCallbacks.get(index);
        if (callbacks) {
          callbacks.delete(uid);
        }
      }
    );
  }
  
  /**
   * Get the rate of this gyro
   * 
   * @returns The rate
   */
  getRate(): number {
    return GyroSim.rate[this.index];
  }
  
  /**
   * Set the rate of this gyro
   * 
   * @param rate The rate
   */
  setRate(rate: number): void {
    GyroSim.rate[this.index] = rate;
    
    // Notify callbacks
    const callbacks = GyroSim.rateCallbacks.get(this.index);
    if (callbacks) {
      for (const callback of callbacks.values()) {
        callback.callbackNative('Rate', 2, 0, rate);
      }
    }
  }
  
  /**
   * Register a callback to be run when the gyro is initialized
   * 
   * @param callback The callback that will be called whenever the gyro is initialized
   * @param initialNotify If true, the callback will be run with the initial value
   * @returns The CallbackStore object associated with this callback
   */
  registerInitializedCallback(callback: NotifyCallback, initialNotify: boolean): CallbackStore {
    const callbackId = GyroSim.nextCallbackId++;
    
    // Create the callback map if it doesn't exist
    if (!GyroSim.initCallbacks.has(this.index)) {
      GyroSim.initCallbacks.set(this.index, new Map());
    }
    
    // Add the callback
    GyroSim.initCallbacks.get(this.index)!.set(callbackId, callback);
    
    // Run the callback with the initial value if requested
    if (initialNotify) {
      callback.callbackNative('Initialized', 1, GyroSim.initialized[this.index] ? 1 : 0, 0);
    }
    
    // Return a CallbackStore that can be used to cancel the callback
    return new CallbackStore(
      this.index,
      callbackId,
      (index, uid) => {
        const callbacks = GyroSim.initCallbacks.get(index);
        if (callbacks) {
          callbacks.delete(uid);
        }
      }
    );
  }
  
  /**
   * Check if this gyro has been initialized
   * 
   * @returns True if initialized
   */
  getInitialized(): boolean {
    return GyroSim.initialized[this.index];
  }
  
  /**
   * Set whether this gyro has been initialized
   * 
   * @param initialized True if initialized
   */
  setInitialized(initialized: boolean): void {
    GyroSim.initialized[this.index] = initialized;
    
    // Notify callbacks
    const callbacks = GyroSim.initCallbacks.get(this.index);
    if (callbacks) {
      for (const callback of callbacks.values()) {
        callback.callbackNative('Initialized', 1, initialized ? 1 : 0, 0);
      }
    }
  }
  
  /**
   * Reset all simulation data for this object
   */
  resetData(): void {
    GyroSim.initialized[this.index] = false;
    GyroSim.angle[this.index] = 0;
    GyroSim.rate[this.index] = 0;
    
    // Notify callbacks
    const initCallbacks = GyroSim.initCallbacks.get(this.index);
    if (initCallbacks) {
      for (const callback of initCallbacks.values()) {
        callback.callbackNative('Initialized', 1, 0, 0);
      }
    }
    
    const angleCallbacks = GyroSim.angleCallbacks.get(this.index);
    if (angleCallbacks) {
      for (const callback of angleCallbacks.values()) {
        callback.callbackNative('Angle', 2, 0, 0);
      }
    }
    
    const rateCallbacks = GyroSim.rateCallbacks.get(this.index);
    if (rateCallbacks) {
      for (const callback of rateCallbacks.values()) {
        callback.callbackNative('Rate', 2, 0, 0);
      }
    }
  }
}
