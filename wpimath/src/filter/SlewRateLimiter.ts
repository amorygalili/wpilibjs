import { MathSharedStore } from '../MathSharedStore';
import { MathUtil } from '../MathUtil';

/**
 * A class that limits the rate of change of an input value. Useful for implementing voltage,
 * setpoint, and/or output ramps. A slew-rate limit is most appropriate when the quantity being
 * controlled is a velocity or a voltage; when controlling a position, consider using a
 * TrapezoidProfile instead.
 */
export class SlewRateLimiter {
  private m_positiveRateLimit: number;
  private m_negativeRateLimit: number;
  private m_prevVal: number;
  private m_prevTime: number;

  /**
   * Creates a new SlewRateLimiter with the given positive and negative rate limits and initial
   * value.
   *
   * @param positiveRateLimit The rate-of-change limit in the positive direction, in units per
   *     second. This is expected to be positive.
   * @param negativeRateLimit The rate-of-change limit in the negative direction, in units per
   *     second. This is expected to be negative.
   * @param initialValue The initial value of the input.
   */
  constructor(positiveRateLimit: number, negativeRateLimit: number, initialValue: number = 0) {
    this.m_positiveRateLimit = positiveRateLimit;
    this.m_negativeRateLimit = negativeRateLimit;
    this.m_prevVal = initialValue;
    this.m_prevTime = MathSharedStore.getTimestamp();
  }

  /**
   * Creates a new SlewRateLimiter with the given positive rate limit and negative rate limit of
   * -rateLimit.
   *
   * @param rateLimit The rate-of-change limit, in units per second.
   */
  static withSymmetricLimit(rateLimit: number): SlewRateLimiter {
    return new SlewRateLimiter(rateLimit, -rateLimit);
  }

  /**
   * Filters the input to limit its slew rate.
   *
   * @param input The input value whose slew rate is to be limited.
   * @return The filtered value, which will not change faster than the slew rate.
   */
  public calculate(input: number): number {
    const currentTime = MathSharedStore.getTimestamp();
    const elapsedTime = currentTime - this.m_prevTime;
    this.m_prevVal +=
        MathUtil.clamp(
            input - this.m_prevVal,
            this.m_negativeRateLimit * elapsedTime,
            this.m_positiveRateLimit * elapsedTime);
    this.m_prevTime = currentTime;
    return this.m_prevVal;
  }

  /**
   * Returns the value last calculated by the SlewRateLimiter.
   *
   * @return The last value.
   */
  public lastValue(): number {
    return this.m_prevVal;
  }

  /**
   * Resets the slew rate limiter to the specified value; ignores the rate limit when doing so.
   *
   * @param value The value to reset to.
   */
  public reset(value: number): void {
    this.m_prevVal = value;
    this.m_prevTime = MathSharedStore.getTimestamp();
  }
}
