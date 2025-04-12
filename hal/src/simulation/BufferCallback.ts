/**
 * Callback interface for simulation buffer changes
 */
export interface BufferCallback {
  /**
   * Called when a simulation buffer changes
   * 
   * @param name The name of the buffer that changed
   * @param buffer The new buffer data
   * @param count The number of bytes in the buffer
   */
  callback(name: string, buffer: Uint8Array, count: number): void;
}

/**
 * Implementation of BufferCallback that wraps a simple function
 */
export class BufferCallbackFunc implements BufferCallback {
  /**
   * Create a BufferCallback from a function
   * 
   * @param func The function to call
   * @returns A BufferCallback that calls the function
   */
  static create(func: (name: string, buffer: Uint8Array, count: number) => void): BufferCallback {
    return new BufferCallbackFunc(func);
  }
  
  /**
   * Constructor
   * 
   * @param func The function to call
   */
  constructor(private func: (name: string, buffer: Uint8Array, count: number) => void) {}
  
  /**
   * Called when a simulation buffer changes
   * 
   * @param name The name of the buffer that changed
   * @param buffer The new buffer data
   * @param count The number of bytes in the buffer
   */
  callback(name: string, buffer: Uint8Array, count: number): void {
    this.func(name, buffer, count);
  }
}

/**
 * Callback interface for simulation constant buffer changes
 */
export interface ConstBufferCallback {
  /**
   * Called when a simulation constant buffer changes
   * 
   * @param name The name of the buffer that changed
   * @param buffer The new buffer data
   * @param count The number of bytes in the buffer
   */
  callback(name: string, buffer: Uint8Array, count: number): void;
}

/**
 * Implementation of ConstBufferCallback that wraps a simple function
 */
export class ConstBufferCallbackFunc implements ConstBufferCallback {
  /**
   * Create a ConstBufferCallback from a function
   * 
   * @param func The function to call
   * @returns A ConstBufferCallback that calls the function
   */
  static create(func: (name: string, buffer: Uint8Array, count: number) => void): ConstBufferCallback {
    return new ConstBufferCallbackFunc(func);
  }
  
  /**
   * Constructor
   * 
   * @param func The function to call
   */
  constructor(private func: (name: string, buffer: Uint8Array, count: number) => void) {}
  
  /**
   * Called when a simulation constant buffer changes
   * 
   * @param name The name of the buffer that changed
   * @param buffer The new buffer data
   * @param count The number of bytes in the buffer
   */
  callback(name: string, buffer: Uint8Array, count: number): void {
    this.func(name, buffer, count);
  }
}
