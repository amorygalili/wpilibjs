import { NotifyCallback } from '../NotifyCallback';
import { CallbackStore } from './CallbackStore';

/**
 * Class to control a simulated analog input
 */
export class AnalogInputSim {
  // Simulation data storage
  private static initialized: boolean[] = [];
  private static voltage: number[] = [];
  private static accumulatorInitialized: boolean[] = [];
  private static accumulatorValue: bigint[] = [];
  private static accumulatorCount: bigint[] = [];
  private static accumulatorCenter: number[] = [];
  private static accumulatorDeadband: number[] = [];
  private static averageBits: number[] = [];
  private static oversampleBits: number[] = [];
  
  // Callback storage
  private static initCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static voltageCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static accumulatorInitializedCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static accumulatorValueCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static accumulatorCountCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static accumulatorCenterCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static accumulatorDeadbandCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static averageBitsCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static oversampleBitsCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  
  // Next callback ID
  private static nextCallbackId = 0;
  
  /**
   * Constructor
   * 
   * @param index The analog input channel index
   */
  constructor(private index: number) {
    // Initialize data if not already initialized
    if (AnalogInputSim.voltage[index] === undefined) {
      AnalogInputSim.initialized[index] = false;
      AnalogInputSim.voltage[index] = 0;
      AnalogInputSim.accumulatorInitialized[index] = false;
      AnalogInputSim.accumulatorValue[index] = 0n;
      AnalogInputSim.accumulatorCount[index] = 0n;
      AnalogInputSim.accumulatorCenter[index] = 0;
      AnalogInputSim.accumulatorDeadband[index] = 0;
      AnalogInputSim.averageBits[index] = 0;
      AnalogInputSim.oversampleBits[index] = 0;
    }
  }
  
  /**
   * Register a callback to be run when the analog input is initialized
   * 
   * @param callback The callback that will be called whenever the analog input is initialized
   * @param initialNotify If true, the callback will be run with the initial value
   * @returns The CallbackStore object associated with this callback
   */
  registerInitializedCallback(callback: NotifyCallback, initialNotify: boolean): CallbackStore {
    const callbackId = AnalogInputSim.nextCallbackId++;
    
    // Create the callback map if it doesn't exist
    if (!AnalogInputSim.initCallbacks.has(this.index)) {
      AnalogInputSim.initCallbacks.set(this.index, new Map());
    }
    
    // Add the callback
    AnalogInputSim.initCallbacks.get(this.index)!.set(callbackId, callback);
    
    // Run the callback with the initial value if requested
    if (initialNotify) {
      callback.callbackNative('Initialized', 1, AnalogInputSim.initialized[this.index] ? 1 : 0, 0);
    }
    
    // Return a CallbackStore that can be used to cancel the callback
    return new CallbackStore(
      this.index,
      callbackId,
      (index, uid) => {
        const callbacks = AnalogInputSim.initCallbacks.get(index);
        if (callbacks) {
          callbacks.delete(uid);
        }
      }
    );
  }
  
  /**
   * Check if this analog input has been initialized
   * 
   * @returns True if initialized
   */
  getInitialized(): boolean {
    return AnalogInputSim.initialized[this.index];
  }
  
  /**
   * Set whether this analog input has been initialized
   * 
   * @param initialized True if initialized
   */
  setInitialized(initialized: boolean): void {
    AnalogInputSim.initialized[this.index] = initialized;
    
    // Notify callbacks
    const callbacks = AnalogInputSim.initCallbacks.get(this.index);
    if (callbacks) {
      for (const callback of callbacks.values()) {
        callback.callbackNative('Initialized', 1, initialized ? 1 : 0, 0);
      }
    }
  }
  
  /**
   * Register a callback to be run when the analog input voltage changes
   * 
   * @param callback The callback that will be called whenever the analog input voltage changes
   * @param initialNotify If true, the callback will be run with the initial value
   * @returns The CallbackStore object associated with this callback
   */
  registerVoltageCallback(callback: NotifyCallback, initialNotify: boolean): CallbackStore {
    const callbackId = AnalogInputSim.nextCallbackId++;
    
    // Create the callback map if it doesn't exist
    if (!AnalogInputSim.voltageCallbacks.has(this.index)) {
      AnalogInputSim.voltageCallbacks.set(this.index, new Map());
    }
    
    // Add the callback
    AnalogInputSim.voltageCallbacks.get(this.index)!.set(callbackId, callback);
    
    // Run the callback with the initial value if requested
    if (initialNotify) {
      callback.callbackNative('Voltage', 2, 0, AnalogInputSim.voltage[this.index]);
    }
    
    // Return a CallbackStore that can be used to cancel the callback
    return new CallbackStore(
      this.index,
      callbackId,
      (index, uid) => {
        const callbacks = AnalogInputSim.voltageCallbacks.get(index);
        if (callbacks) {
          callbacks.delete(uid);
        }
      }
    );
  }
  
  /**
   * Get the voltage of this analog input
   * 
   * @returns The voltage
   */
  getVoltage(): number {
    return AnalogInputSim.voltage[this.index];
  }
  
  /**
   * Set the voltage of this analog input
   * 
   * @param voltage The voltage
   */
  setVoltage(voltage: number): void {
    AnalogInputSim.voltage[this.index] = voltage;
    
    // Notify callbacks
    const callbacks = AnalogInputSim.voltageCallbacks.get(this.index);
    if (callbacks) {
      for (const callback of callbacks.values()) {
        callback.callbackNative('Voltage', 2, 0, voltage);
      }
    }
  }
  
  /**
   * Reset all simulation data for this object
   */
  resetData(): void {
    AnalogInputSim.initialized[this.index] = false;
    AnalogInputSim.voltage[this.index] = 0;
    AnalogInputSim.accumulatorInitialized[this.index] = false;
    AnalogInputSim.accumulatorValue[this.index] = 0n;
    AnalogInputSim.accumulatorCount[this.index] = 0n;
    AnalogInputSim.accumulatorCenter[this.index] = 0;
    AnalogInputSim.accumulatorDeadband[this.index] = 0;
    AnalogInputSim.averageBits[this.index] = 0;
    AnalogInputSim.oversampleBits[this.index] = 0;
    
    // Notify callbacks
    const initCallbacks = AnalogInputSim.initCallbacks.get(this.index);
    if (initCallbacks) {
      for (const callback of initCallbacks.values()) {
        callback.callbackNative('Initialized', 1, 0, 0);
      }
    }
    
    const voltageCallbacks = AnalogInputSim.voltageCallbacks.get(this.index);
    if (voltageCallbacks) {
      for (const callback of voltageCallbacks.values()) {
        callback.callbackNative('Voltage', 2, 0, 0);
      }
    }
    
    // Reset other callbacks as needed
  }
}
