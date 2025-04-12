import { MathUsageId } from './MathUsageId';

/**
 * WPIMath utility functions.
 */
export interface MathShared {
  /**
   * Report an error.
   *
   * @param error the error to set
   * @param stackTrace array of stacktrace elements
   */
  reportError(error: string, stackTrace: string[]): void;

  /**
   * Report usage.
   *
   * @param id the usage id
   * @param count the usage count
   */
  reportUsage(id: MathUsageId, count: number): void;

  /**
   * Get the current time.
   *
   * @return Time in seconds
   */
  getTimestamp(): number;
}
