/**
 * Utility class for working with binary data buffers
 */
export class BufferUtils {
  /**
   * Convert a string to a UTF-8 encoded buffer
   * 
   * @param str The string to convert
   * @returns A buffer containing the UTF-8 encoded string
   */
  static stringToBuffer(str: string): Buffer {
    return Buffer.from(str, 'utf8');
  }
  
  /**
   * Convert a buffer to a UTF-8 string
   * 
   * @param buffer The buffer to convert
   * @returns The UTF-8 string
   */
  static bufferToString(buffer: Buffer): string {
    return buffer.toString('utf8');
  }
  
  /**
   * Concatenate multiple buffers
   * 
   * @param buffers The buffers to concatenate
   * @returns A new buffer containing all the input buffers
   */
  static concat(buffers: Buffer[]): Buffer {
    return Buffer.concat(buffers);
  }
  
  /**
   * Create a buffer filled with zeros
   * 
   * @param size The size of the buffer
   * @returns A new buffer filled with zeros
   */
  static zeroBuffer(size: number): Buffer {
    return Buffer.alloc(size);
  }
  
  /**
   * Copy a buffer
   * 
   * @param buffer The buffer to copy
   * @returns A new buffer with the same contents
   */
  static copyBuffer(buffer: Buffer): Buffer {
    const copy = Buffer.alloc(buffer.length);
    buffer.copy(copy);
    return copy;
  }
  
  /**
   * Compare two buffers for equality
   * 
   * @param a The first buffer
   * @param b The second buffer
   * @returns True if the buffers have the same contents
   */
  static equals(a: Buffer, b: Buffer): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Convert a buffer to a hexadecimal string
   * 
   * @param buffer The buffer to convert
   * @param uppercase Whether to use uppercase letters
   * @returns A hexadecimal string representation of the buffer
   */
  static toHexString(buffer: Buffer, uppercase: boolean = false): string {
    const hex = buffer.toString('hex');
    return uppercase ? hex.toUpperCase() : hex;
  }
  
  /**
   * Convert a hexadecimal string to a buffer
   * 
   * @param hex The hexadecimal string
   * @returns A buffer containing the decoded hexadecimal data
   */
  static fromHexString(hex: string): Buffer {
    // Remove any non-hex characters
    const cleanHex = hex.replace(/[^0-9A-Fa-f]/g, '');
    
    // Ensure even length
    const paddedHex = cleanHex.length % 2 === 0 ? cleanHex : '0' + cleanHex;
    
    return Buffer.from(paddedHex, 'hex');
  }
}
