import { NotifyCallback } from '../NotifyCallback';
import { CallbackStore } from './CallbackStore';

/**
 * Class to control a simulated encoder
 */
export class EncoderSim {
  // Simulation data storage
  private static initialized: boolean[] = [];
  private static count: number[] = [];
  private static period: number[] = [];
  private static reset: boolean[] = [];
  private static maxPeriod: number[] = [];
  private static direction: boolean[] = [];
  private static reverseDirection: boolean[] = [];
  private static samplesToAverage: number[] = [];
  private static distancePerPulse: number[] = [];
  
  // Callback storage
  private static initCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static countCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static periodCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static resetCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static maxPeriodCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static directionCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static reverseDirectionCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static samplesToAverageCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  
  // Next callback ID
  private static nextCallbackId = 0;
  
  /**
   * Constructor
   * 
   * @param index The encoder index
   */
  constructor(private index: number) {
    // Initialize data if not already initialized
    if (EncoderSim.count[index] === undefined) {
      EncoderSim.initialized[index] = false;
      EncoderSim.count[index] = 0;
      EncoderSim.period[index] = 0;
      EncoderSim.reset[index] = false;
      EncoderSim.maxPeriod[index] = 0;
      EncoderSim.direction[index] = false;
      EncoderSim.reverseDirection[index] = false;
      EncoderSim.samplesToAverage[index] = 0;
      EncoderSim.distancePerPulse[index] = 1;
    }
  }
  
  /**
   * Register a callback to be run when the encoder count changes
   * 
   * @param callback The callback that will be called whenever the encoder count changes
   * @param initialNotify If true, the callback will be run with the initial value
   * @returns The CallbackStore object associated with this callback
   */
  registerCountCallback(callback: NotifyCallback, initialNotify: boolean): CallbackStore {
    const callbackId = EncoderSim.nextCallbackId++;
    
    // Create the callback map if it doesn't exist
    if (!EncoderSim.countCallbacks.has(this.index)) {
      EncoderSim.countCallbacks.set(this.index, new Map());
    }
    
    // Add the callback
    EncoderSim.countCallbacks.get(this.index)!.set(callbackId, callback);
    
    // Run the callback with the initial value if requested
    if (initialNotify) {
      callback.callbackNative('Count', 8, EncoderSim.count[this.index], 0);
    }
    
    // Return a CallbackStore that can be used to cancel the callback
    return new CallbackStore(
      this.index,
      callbackId,
      (index, uid) => {
        const callbacks = EncoderSim.countCallbacks.get(index);
        if (callbacks) {
          callbacks.delete(uid);
        }
      }
    );
  }
  
  /**
   * Get the count of this encoder
   * 
   * @returns The count
   */
  getCount(): number {
    return EncoderSim.count[this.index];
  }
  
  /**
   * Set the count of this encoder
   * 
   * @param count The count
   */
  setCount(count: number): void {
    EncoderSim.count[this.index] = count;
    
    // Notify callbacks
    const callbacks = EncoderSim.countCallbacks.get(this.index);
    if (callbacks) {
      for (const callback of callbacks.values()) {
        callback.callbackNative('Count', 8, count, 0);
      }
    }
  }
  
  /**
   * Register a callback to be run when the encoder period changes
   * 
   * @param callback The callback that will be called whenever the encoder period changes
   * @param initialNotify If true, the callback will be run with the initial value
   * @returns The CallbackStore object associated with this callback
   */
  registerPeriodCallback(callback: NotifyCallback, initialNotify: boolean): CallbackStore {
    const callbackId = EncoderSim.nextCallbackId++;
    
    // Create the callback map if it doesn't exist
    if (!EncoderSim.periodCallbacks.has(this.index)) {
      EncoderSim.periodCallbacks.set(this.index, new Map());
    }
    
    // Add the callback
    EncoderSim.periodCallbacks.get(this.index)!.set(callbackId, callback);
    
    // Run the callback with the initial value if requested
    if (initialNotify) {
      callback.callbackNative('Period', 2, 0, EncoderSim.period[this.index]);
    }
    
    // Return a CallbackStore that can be used to cancel the callback
    return new CallbackStore(
      this.index,
      callbackId,
      (index, uid) => {
        const callbacks = EncoderSim.periodCallbacks.get(index);
        if (callbacks) {
          callbacks.delete(uid);
        }
      }
    );
  }
  
  /**
   * Get the period of this encoder
   * 
   * @returns The period
   */
  getPeriod(): number {
    return EncoderSim.period[this.index];
  }
  
  /**
   * Set the period of this encoder
   * 
   * @param period The period
   */
  setPeriod(period: number): void {
    EncoderSim.period[this.index] = period;
    
    // Notify callbacks
    const callbacks = EncoderSim.periodCallbacks.get(this.index);
    if (callbacks) {
      for (const callback of callbacks.values()) {
        callback.callbackNative('Period', 2, 0, period);
      }
    }
  }
  
  /**
   * Get the rate of this encoder
   * 
   * @returns The rate (distance per second)
   */
  getRate(): number {
    if (EncoderSim.period[this.index] === 0) {
      return 0;
    }
    return EncoderSim.distancePerPulse[this.index] / EncoderSim.period[this.index];
  }
  
  /**
   * Set the rate of this encoder
   * 
   * @param rate The rate (distance per second)
   */
  setRate(rate: number): void {
    if (rate === 0) {
      EncoderSim.period[this.index] = 0;
    } else {
      EncoderSim.period[this.index] = EncoderSim.distancePerPulse[this.index] / rate;
    }
    
    // Notify callbacks
    const callbacks = EncoderSim.periodCallbacks.get(this.index);
    if (callbacks) {
      for (const callback of callbacks.values()) {
        callback.callbackNative('Period', 2, 0, EncoderSim.period[this.index]);
      }
    }
  }
  
  /**
   * Set the distance per pulse of this encoder
   * 
   * @param distancePerPulse The distance per pulse
   */
  setDistancePerPulse(distancePerPulse: number): void {
    EncoderSim.distancePerPulse[this.index] = distancePerPulse;
  }
  
  /**
   * Reset all simulation data for this object
   */
  resetData(): void {
    EncoderSim.initialized[this.index] = false;
    EncoderSim.count[this.index] = 0;
    EncoderSim.period[this.index] = 0;
    EncoderSim.reset[this.index] = false;
    EncoderSim.maxPeriod[this.index] = 0;
    EncoderSim.direction[this.index] = false;
    EncoderSim.reverseDirection[this.index] = false;
    EncoderSim.samplesToAverage[this.index] = 0;
    
    // Notify callbacks
    const countCallbacks = EncoderSim.countCallbacks.get(this.index);
    if (countCallbacks) {
      for (const callback of countCallbacks.values()) {
        callback.callbackNative('Count', 8, 0, 0);
      }
    }
    
    const periodCallbacks = EncoderSim.periodCallbacks.get(this.index);
    if (periodCallbacks) {
      for (const callback of periodCallbacks.values()) {
        callback.callbackNative('Period', 2, 0, 0);
      }
    }
    
    // Reset other callbacks as needed
  }
}
