import { MathSharedStore } from '../MathSharedStore';
import { MathUsageId } from '../MathUsageId';
import { CircularBuffer } from '../util/CircularBuffer';

/**
 * A class that implements a median filter. Median filters are useful for
 * removing outliers from noisy data.
 *
 * The median filter removes noise by taking the median of the last N data
 * inputs. The window size, N, is configurable and determines how many
 * previous inputs are stored.
 */
export class MedianFilter {
  private static instances = 0;

  private m_inputs: CircularBuffer<number>;
  private m_size: number;
  private m_output = 0;

  /**
   * Creates a new MedianFilter.
   *
   * @param size The window size for the median filter.
   * @throws Error if window size is less than 1.
   */
  constructor(size: number) {
    if (size <= 0) {
      throw new Error("Window size must be at least 1");
    }
    this.m_size = size;
    this.m_inputs = new CircularBuffer<number>(size);

    MedianFilter.instances++;
    MathSharedStore.reportUsage(MathUsageId.kFilter_Median, MedianFilter.instances);
  }

  /**
   * Calculates the median of the input values seen so far.
   *
   * @param input The latest input value.
   * @return The median of the window, or the input if the window is empty.
   */
  public calculate(input: number): number {
    // Add the input to the buffer
    if (this.m_inputs.size() < this.m_size) {
      this.m_inputs.addLast(input);
    } else {
      this.m_inputs.addLast(input);
    }

    // If we only have one element, return it
    if (this.m_inputs.size() === 1) {
      this.m_output = input;
      return this.m_output;
    }

    // Sort the inputs
    const sorted = new Array<number>(this.m_inputs.size());
    for (let i = 0; i < this.m_inputs.size(); i++) {
      sorted[i] = this.m_inputs.get(i);
    }
    sorted.sort((a, b) => a - b);

    // For even-length arrays, take the average of the two middle elements
    if (sorted.length % 2 === 0) {
      this.m_output = (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    } else {
      // For odd-length arrays, take the middle element
      this.m_output = sorted[Math.floor(sorted.length / 2)];
    }

    return this.m_output;
  }

  /**
   * Returns the last value calculated by the MedianFilter.
   *
   * @return The last value.
   */
  public lastValue(): number {
    return this.m_output;
  }

  /**
   * Resets the filter by clearing the window.
   */
  public reset(): void {
    this.m_inputs.clear();
    this.m_output = 0;
  }
}
