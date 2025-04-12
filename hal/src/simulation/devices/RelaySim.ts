import { NotifyCallback } from '../NotifyCallback';
import { CallbackStore } from './CallbackStore';

/**
 * Class to control a simulated relay
 */
export class RelaySim {
  // Simulation data storage
  private static initialized: boolean[] = [];
  private static forward: boolean[] = [];
  private static reverse: boolean[] = [];
  
  // Callback storage
  private static initCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static forwardCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  private static reverseCallbacks: Map<number, Map<number, NotifyCallback>> = new Map();
  
  // Next callback ID
  private static nextCallbackId = 0;
  
  /**
   * Constructor
   * 
   * @param index The relay channel index
   */
  constructor(private index: number) {
    // Initialize data if not already initialized
    if (RelaySim.forward[index] === undefined) {
      RelaySim.initialized[index] = false;
      RelaySim.forward[index] = false;
      RelaySim.reverse[index] = false;
    }
  }
  
  /**
   * Register a callback to be run when the relay is initialized
   * 
   * @param callback The callback that will be called whenever the relay is initialized
   * @param initialNotify If true, the callback will be run with the initial value
   * @returns The CallbackStore object associated with this callback
   */
  registerInitializedCallback(callback: NotifyCallback, initialNotify: boolean): CallbackStore {
    const callbackId = RelaySim.nextCallbackId++;
    
    // Create the callback map if it doesn't exist
    if (!RelaySim.initCallbacks.has(this.index)) {
      RelaySim.initCallbacks.set(this.index, new Map());
    }
    
    // Add the callback
    RelaySim.initCallbacks.get(this.index)!.set(callbackId, callback);
    
    // Run the callback with the initial value if requested
    if (initialNotify) {
      callback.callbackNative('Initialized', 1, RelaySim.initialized[this.index] ? 1 : 0, 0);
    }
    
    // Return a CallbackStore that can be used to cancel the callback
    return new CallbackStore(
      this.index,
      callbackId,
      (index, uid) => {
        const callbacks = RelaySim.initCallbacks.get(index);
        if (callbacks) {
          callbacks.delete(uid);
        }
      }
    );
  }
  
  /**
   * Check if this relay has been initialized
   * 
   * @returns True if initialized
   */
  getInitialized(): boolean {
    return RelaySim.initialized[this.index];
  }
  
  /**
   * Set whether this relay has been initialized
   * 
   * @param initialized True if initialized
   */
  setInitialized(initialized: boolean): void {
    RelaySim.initialized[this.index] = initialized;
    
    // Notify callbacks
    const callbacks = RelaySim.initCallbacks.get(this.index);
    if (callbacks) {
      for (const callback of callbacks.values()) {
        callback.callbackNative('Initialized', 1, initialized ? 1 : 0, 0);
      }
    }
  }
  
  /**
   * Register a callback to be run when the relay forward state changes
   * 
   * @param callback The callback that will be called whenever the relay forward state changes
   * @param initialNotify If true, the callback will be run with the initial value
   * @returns The CallbackStore object associated with this callback
   */
  registerForwardCallback(callback: NotifyCallback, initialNotify: boolean): CallbackStore {
    const callbackId = RelaySim.nextCallbackId++;
    
    // Create the callback map if it doesn't exist
    if (!RelaySim.forwardCallbacks.has(this.index)) {
      RelaySim.forwardCallbacks.set(this.index, new Map());
    }
    
    // Add the callback
    RelaySim.forwardCallbacks.get(this.index)!.set(callbackId, callback);
    
    // Run the callback with the initial value if requested
    if (initialNotify) {
      callback.callbackNative('Forward', 1, RelaySim.forward[this.index] ? 1 : 0, 0);
    }
    
    // Return a CallbackStore that can be used to cancel the callback
    return new CallbackStore(
      this.index,
      callbackId,
      (index, uid) => {
        const callbacks = RelaySim.forwardCallbacks.get(index);
        if (callbacks) {
          callbacks.delete(uid);
        }
      }
    );
  }
  
  /**
   * Get the forward state of this relay
   * 
   * @returns True if the relay is set to forward
   */
  getForward(): boolean {
    return RelaySim.forward[this.index];
  }
  
  /**
   * Set the forward state of this relay
   * 
   * @param forward True to set the relay to forward
   */
  setForward(forward: boolean): void {
    RelaySim.forward[this.index] = forward;
    
    // Notify callbacks
    const callbacks = RelaySim.forwardCallbacks.get(this.index);
    if (callbacks) {
      for (const callback of callbacks.values()) {
        callback.callbackNative('Forward', 1, forward ? 1 : 0, 0);
      }
    }
  }
  
  /**
   * Register a callback to be run when the relay reverse state changes
   * 
   * @param callback The callback that will be called whenever the relay reverse state changes
   * @param initialNotify If true, the callback will be run with the initial value
   * @returns The CallbackStore object associated with this callback
   */
  registerReverseCallback(callback: NotifyCallback, initialNotify: boolean): CallbackStore {
    const callbackId = RelaySim.nextCallbackId++;
    
    // Create the callback map if it doesn't exist
    if (!RelaySim.reverseCallbacks.has(this.index)) {
      RelaySim.reverseCallbacks.set(this.index, new Map());
    }
    
    // Add the callback
    RelaySim.reverseCallbacks.get(this.index)!.set(callbackId, callback);
    
    // Run the callback with the initial value if requested
    if (initialNotify) {
      callback.callbackNative('Reverse', 1, RelaySim.reverse[this.index] ? 1 : 0, 0);
    }
    
    // Return a CallbackStore that can be used to cancel the callback
    return new CallbackStore(
      this.index,
      callbackId,
      (index, uid) => {
        const callbacks = RelaySim.reverseCallbacks.get(index);
        if (callbacks) {
          callbacks.delete(uid);
        }
      }
    );
  }
  
  /**
   * Get the reverse state of this relay
   * 
   * @returns True if the relay is set to reverse
   */
  getReverse(): boolean {
    return RelaySim.reverse[this.index];
  }
  
  /**
   * Set the reverse state of this relay
   * 
   * @param reverse True to set the relay to reverse
   */
  setReverse(reverse: boolean): void {
    RelaySim.reverse[this.index] = reverse;
    
    // Notify callbacks
    const callbacks = RelaySim.reverseCallbacks.get(this.index);
    if (callbacks) {
      for (const callback of callbacks.values()) {
        callback.callbackNative('Reverse', 1, reverse ? 1 : 0, 0);
      }
    }
  }
  
  /**
   * Reset all simulation data for this object
   */
  resetData(): void {
    RelaySim.initialized[this.index] = false;
    RelaySim.forward[this.index] = false;
    RelaySim.reverse[this.index] = false;
    
    // Notify callbacks
    const initCallbacks = RelaySim.initCallbacks.get(this.index);
    if (initCallbacks) {
      for (const callback of initCallbacks.values()) {
        callback.callbackNative('Initialized', 1, 0, 0);
      }
    }
    
    const forwardCallbacks = RelaySim.forwardCallbacks.get(this.index);
    if (forwardCallbacks) {
      for (const callback of forwardCallbacks.values()) {
        callback.callbackNative('Forward', 1, 0, 0);
      }
    }
    
    const reverseCallbacks = RelaySim.reverseCallbacks.get(this.index);
    if (reverseCallbacks) {
      for (const callback of reverseCallbacks.values()) {
        callback.callbackNative('Reverse', 1, 0, 0);
      }
    }
  }
}
