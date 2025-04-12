import { NotifyCallback } from '../NotifyCallback';
import { CallbackStore } from './CallbackStore';

/**
 * Class to control a simulated solenoid
 */
export class SolenoidSim {
  // Simulation data storage
  private static initialized: boolean[][] = [];
  private static output: boolean[][] = [];
  
  // Callback storage
  private static initCallbacks: Map<number, Map<number, Map<number, NotifyCallback>>> = new Map();
  private static outputCallbacks: Map<number, Map<number, Map<number, NotifyCallback>>> = new Map();
  
  // Next callback ID
  private static nextCallbackId = 0;
  
  /**
   * Constructor
   * 
   * @param module The PCM module index
   * @param channel The solenoid channel index
   */
  constructor(private module: number, private channel: number) {
    // Initialize data if not already initialized
    if (!SolenoidSim.initialized[module]) {
      SolenoidSim.initialized[module] = [];
      SolenoidSim.output[module] = [];
    }
    
    if (SolenoidSim.output[module][channel] === undefined) {
      SolenoidSim.initialized[module][channel] = false;
      SolenoidSim.output[module][channel] = false;
    }
  }
  
  /**
   * Register a callback to be run when the solenoid is initialized
   * 
   * @param callback The callback that will be called whenever the solenoid is initialized
   * @param initialNotify If true, the callback will be run with the initial value
   * @returns The CallbackStore object associated with this callback
   */
  registerInitializedCallback(callback: NotifyCallback, initialNotify: boolean): CallbackStore {
    const callbackId = SolenoidSim.nextCallbackId++;
    
    // Create the callback maps if they don't exist
    if (!SolenoidSim.initCallbacks.has(this.module)) {
      SolenoidSim.initCallbacks.set(this.module, new Map());
    }
    
    if (!SolenoidSim.initCallbacks.get(this.module)!.has(this.channel)) {
      SolenoidSim.initCallbacks.get(this.module)!.set(this.channel, new Map());
    }
    
    // Add the callback
    SolenoidSim.initCallbacks.get(this.module)!.get(this.channel)!.set(callbackId, callback);
    
    // Run the callback with the initial value if requested
    if (initialNotify) {
      callback.callbackNative('Initialized', 1, SolenoidSim.initialized[this.module][this.channel] ? 1 : 0, 0);
    }
    
    // Return a CallbackStore that can be used to cancel the callback
    return new CallbackStore(
      this.module * 100 + this.channel, // Use a unique index for the callback store
      callbackId,
      (index, uid) => {
        const module = Math.floor(index / 100);
        const channel = index % 100;
        const callbacks = SolenoidSim.initCallbacks.get(module)?.get(channel);
        if (callbacks) {
          callbacks.delete(uid);
        }
      }
    );
  }
  
  /**
   * Check if this solenoid has been initialized
   * 
   * @returns True if initialized
   */
  getInitialized(): boolean {
    return SolenoidSim.initialized[this.module][this.channel];
  }
  
  /**
   * Set whether this solenoid has been initialized
   * 
   * @param initialized True if initialized
   */
  setInitialized(initialized: boolean): void {
    SolenoidSim.initialized[this.module][this.channel] = initialized;
    
    // Notify callbacks
    const callbacks = SolenoidSim.initCallbacks.get(this.module)?.get(this.channel);
    if (callbacks) {
      for (const callback of callbacks.values()) {
        callback.callbackNative('Initialized', 1, initialized ? 1 : 0, 0);
      }
    }
  }
  
  /**
   * Register a callback to be run when the solenoid output changes
   * 
   * @param callback The callback that will be called whenever the solenoid output changes
   * @param initialNotify If true, the callback will be run with the initial value
   * @returns The CallbackStore object associated with this callback
   */
  registerOutputCallback(callback: NotifyCallback, initialNotify: boolean): CallbackStore {
    const callbackId = SolenoidSim.nextCallbackId++;
    
    // Create the callback maps if they don't exist
    if (!SolenoidSim.outputCallbacks.has(this.module)) {
      SolenoidSim.outputCallbacks.set(this.module, new Map());
    }
    
    if (!SolenoidSim.outputCallbacks.get(this.module)!.has(this.channel)) {
      SolenoidSim.outputCallbacks.get(this.module)!.set(this.channel, new Map());
    }
    
    // Add the callback
    SolenoidSim.outputCallbacks.get(this.module)!.get(this.channel)!.set(callbackId, callback);
    
    // Run the callback with the initial value if requested
    if (initialNotify) {
      callback.callbackNative('Output', 1, SolenoidSim.output[this.module][this.channel] ? 1 : 0, 0);
    }
    
    // Return a CallbackStore that can be used to cancel the callback
    return new CallbackStore(
      this.module * 100 + this.channel, // Use a unique index for the callback store
      callbackId,
      (index, uid) => {
        const module = Math.floor(index / 100);
        const channel = index % 100;
        const callbacks = SolenoidSim.outputCallbacks.get(module)?.get(channel);
        if (callbacks) {
          callbacks.delete(uid);
        }
      }
    );
  }
  
  /**
   * Get the output of this solenoid
   * 
   * @returns True if the solenoid is on
   */
  getOutput(): boolean {
    return SolenoidSim.output[this.module][this.channel];
  }
  
  /**
   * Set the output of this solenoid
   * 
   * @param output True to turn the solenoid on
   */
  setOutput(output: boolean): void {
    SolenoidSim.output[this.module][this.channel] = output;
    
    // Notify callbacks
    const callbacks = SolenoidSim.outputCallbacks.get(this.module)?.get(this.channel);
    if (callbacks) {
      for (const callback of callbacks.values()) {
        callback.callbackNative('Output', 1, output ? 1 : 0, 0);
      }
    }
  }
  
  /**
   * Reset all simulation data for this object
   */
  resetData(): void {
    SolenoidSim.initialized[this.module][this.channel] = false;
    SolenoidSim.output[this.module][this.channel] = false;
    
    // Notify callbacks
    const initCallbacks = SolenoidSim.initCallbacks.get(this.module)?.get(this.channel);
    if (initCallbacks) {
      for (const callback of initCallbacks.values()) {
        callback.callbackNative('Initialized', 1, 0, 0);
      }
    }
    
    const outputCallbacks = SolenoidSim.outputCallbacks.get(this.module)?.get(this.channel);
    if (outputCallbacks) {
      for (const callback of outputCallbacks.values()) {
        callback.callbackNative('Output', 1, 0, 0);
      }
    }
  }
}
