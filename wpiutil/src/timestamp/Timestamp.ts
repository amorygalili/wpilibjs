/**
 * Utility class for getting the current system timestamp
 */
export class Timestamp {
  /**
   * Get the current system time in microseconds
   * 
   * @returns The current system time in microseconds
   */
  static getMicroseconds(): bigint {
    // Use the high-resolution time API if available
    if (typeof process !== 'undefined' && process.hrtime) {
      // Node.js environment
      const [seconds, nanoseconds] = process.hrtime();
      return BigInt(seconds) * 1_000_000n + BigInt(nanoseconds) / 1_000n;
    } else if (typeof performance !== 'undefined' && performance.now) {
      // Browser environment
      return BigInt(Math.floor(performance.now() * 1000));
    } else {
      // Fallback to Date.now() (less precise)
      return BigInt(Date.now() * 1000);
    }
  }
  
  /**
   * Get the current system time in milliseconds
   * 
   * @returns The current system time in milliseconds
   */
  static getMilliseconds(): number {
    return Number(Timestamp.getMicroseconds() / 1000n);
  }
  
  /**
   * Get the current system time in seconds
   * 
   * @returns The current system time in seconds
   */
  static getSeconds(): number {
    return Number(Timestamp.getMicroseconds() / 1_000_000n);
  }
  
  /**
   * Sleep for the specified number of microseconds
   * 
   * @param micros The number of microseconds to sleep
   */
  static async delayMicroseconds(micros: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, micros / 1000);
    });
  }
  
  /**
   * Sleep for the specified number of milliseconds
   * 
   * @param millis The number of milliseconds to sleep
   */
  static async delayMilliseconds(millis: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, millis);
    });
  }
  
  /**
   * Sleep for the specified number of seconds
   * 
   * @param seconds The number of seconds to sleep
   */
  static async delaySeconds(seconds: number): Promise<void> {
    return Timestamp.delayMilliseconds(seconds * 1000);
  }
}
