/**
 * Callback management utilities
 */

/**
 * Callback listener interface
 */
export interface CallbackListener<T> {
  callback: T;
  param: any;
  uid: number;
}

/**
 * Callback registry for managing callbacks
 */
export class CallbackRegistry<T> {
  private callbacks: Map<number, CallbackListener<T>> = new Map();
  private nextUid: number = 1;

  /**
   * Register a callback
   * @param callback The callback function
   * @param param Parameter to pass to the callback
   * @returns UID for the callback
   */
  register(callback: T, param: any): number {
    if (!callback) {
      return -1;
    }
    
    const uid = this.nextUid++;
    this.callbacks.set(uid, { callback, param, uid });
    return uid;
  }

  /**
   * Cancel a callback
   * @param uid UID of the callback to cancel
   */
  cancel(uid: number): void {
    if (uid > 0) {
      this.callbacks.delete(uid);
    }
  }

  /**
   * Get all callbacks
   * @returns Array of callback listeners
   */
  getAll(): CallbackListener<T>[] {
    return Array.from(this.callbacks.values());
  }

  /**
   * Reset all callbacks
   */
  reset(): void {
    this.callbacks.clear();
  }
}

/**
 * Notify callback registry
 */
export class NotifyCallbackRegistry extends CallbackRegistry<Function> {
  /**
   * Notify all callbacks
   * @param name Name of the value
   * @param value Value to pass to callbacks
   */
  notify(name: string, value: any): void {
    const callbacks = this.getAll();
    for (const cb of callbacks) {
      cb.callback(name, cb.param, value);
    }
  }
}

/**
 * Buffer callback registry
 */
export class BufferCallbackRegistry extends CallbackRegistry<Function> {
  /**
   * Notify all callbacks with a buffer
   * @param name Name of the buffer
   * @param buffer Buffer to pass to callbacks
   * @param count Number of bytes in the buffer
   */
  notify(name: string, buffer: Uint8Array, count: number): void {
    const callbacks = this.getAll();
    for (const cb of callbacks) {
      cb.callback(name, cb.param, buffer, count);
    }
  }
}
