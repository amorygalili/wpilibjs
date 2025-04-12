import { MathShared } from './MathShared';
import { MathUsageId } from './MathUsageId';

/**
 * Default implementation of MathShared.
 */
class DefaultMathShared implements MathShared {
  reportError(error: string, stackTrace: string[]): void {
    console.error(`Error: ${error}`);
    console.error(stackTrace.join('\n'));
  }

  reportUsage(id: MathUsageId, count: number): void {
    // No-op by default
  }

  getTimestamp(): number {
    return Date.now() / 1000.0;
  }
}

/**
 * Stores the MathShared instance.
 */
export class MathSharedStore {
  private static instance: MathShared = new DefaultMathShared();

  /**
   * Get the stored MathShared instance.
   *
   * @return The stored MathShared instance
   */
  public static getShared(): MathShared {
    return MathSharedStore.instance;
  }

  /**
   * Set the MathShared instance.
   *
   * @param shared The MathShared instance
   */
  public static setShared(shared: MathShared): void {
    MathSharedStore.instance = shared;
  }

  /**
   * Report an error.
   *
   * @param error the error to set
   */
  public static reportError(error: string): void {
    const stackTrace = new Error().stack?.split('\n') || [];
    MathSharedStore.instance.reportError(error, stackTrace);
  }

  /**
   * Report usage.
   *
   * @param id the usage id
   * @param count the usage count
   */
  public static reportUsage(id: MathUsageId, count: number): void {
    MathSharedStore.instance.reportUsage(id, count);
  }

  /**
   * Get the current timestamp.
   *
   * @return The current timestamp in seconds
   */
  public static getTimestamp(): number {
    return MathSharedStore.instance.getTimestamp();
  }
}
