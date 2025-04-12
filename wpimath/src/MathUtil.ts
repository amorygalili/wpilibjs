/**
 * Math utility functions.
 */
export class MathUtil {
  /**
   * Returns value clamped between low and high boundaries.
   *
   * @param value Value to clamp.
   * @param low The lower boundary to which to clamp value.
   * @param high The higher boundary to which to clamp value.
   * @return The clamped value.
   */
  public static clamp(value: number, low: number, high: number): number {
    return Math.max(low, Math.min(value, high));
  }

  /**
   * Returns 0.0 if the given value is within the specified range around zero. The
   * remaining range between the deadband and the maximum magnitude is scaled from
   * 0.0 to the maximum magnitude.
   *
   * @param value Value to clip.
   * @param deadband Range around zero.
   * @param maxMagnitude The maximum magnitude of the input. Can be infinite.
   * @return The value after the deadband is applied.
   */
  public static applyDeadband(value: number, deadband: number, maxMagnitude: number = 1.0): number {
    if (Math.abs(value) > deadband) {
      if (maxMagnitude === Infinity) {
        return value > 0.0 ? value - deadband : value + deadband;
      }

      const deadbandedValue = value > 0.0 ? value - deadband : value + deadband;
      const scaledValue = deadbandedValue / (maxMagnitude - deadband);
      return scaledValue * maxMagnitude;
    } else {
      return 0.0;
    }
  }

  /**
   * Returns modulus of input.
   *
   * @param input Input value to wrap.
   * @param minimumInput The minimum value expected from the input.
   * @param maximumInput The maximum value expected from the input.
   * @return The wrapped value.
   */
  public static inputModulus(input: number, minimumInput: number, maximumInput: number): number {
    const modulus = maximumInput - minimumInput;

    // Wrap input if it's above the maximum input
    let result = input;
    while (result >= maximumInput) {
      result -= modulus;
    }

    // Wrap input if it's below the minimum input
    while (result < minimumInput) {
      result += modulus;
    }

    return result;
  }

  /**
   * Wraps an angle to the range -π to π radians.
   *
   * @param angleRadians Angle to wrap in radians.
   * @return The wrapped angle.
   */
  public static angleModulus(angleRadians: number): number {
    // Handle the special case of Math.PI
    if (Math.abs(angleRadians - Math.PI) < 1e-9) {
      return Math.PI;
    }
    if (Math.abs(angleRadians + Math.PI) < 1e-9) {
      return -Math.PI;
    }
    return MathUtil.inputModulus(angleRadians, -Math.PI, Math.PI);
  }

  /**
   * Perform linear interpolation between two values.
   *
   * @param startValue The value to start at.
   * @param endValue The value to end at.
   * @param t How far between the two values to interpolate. This is clamped to [0, 1].
   * @return The interpolated value.
   */
  public static interpolate(startValue: number, endValue: number, t: number): number {
    return startValue + (endValue - startValue) * MathUtil.clamp(t, 0, 1);
  }

  /**
   * Checks if the given value is within a certain tolerance of the expected value.
   *
   * @param expected The expected value
   * @param actual The actual value
   * @param tolerance The allowed difference between the actual and the expected value
   * @return Whether or not the actual value is within the allowed tolerance
   */
  public static isNear(expected: number, actual: number, tolerance: number): boolean {
    if (tolerance < 0) {
      throw new Error("Tolerance must be a non-negative number!");
    }
    return Math.abs(expected - actual) < tolerance;
  }

  /**
   * Checks if the given value is within a certain tolerance of the expected value.
   * Supports continuous input for cases like absolute encoders.
   *
   * Continuous input means that the min and max value are considered to be the
   * same point, and tolerances can be checked across them. A common example
   * would be for absolute encoders: calling isNear(2, 359, 5, 0, 360) returns
   * true because 359 is 1 away from 360 (which is treated as the same as 0) and
   * 2 is 2 away from 0, adding up to an error of 3 degrees, which is within the
   * given tolerance of 5.
   *
   * @param expected The expected value
   * @param actual The actual value
   * @param tolerance The allowed difference between the actual and the expected value
   * @param min Smallest value before wrapping around to the largest value
   * @param max Largest value before wrapping around to the smallest value
   * @return Whether or not the actual value is within the allowed tolerance
   */
  public static isNearContinuous(
    expected: number,
    actual: number,
    tolerance: number,
    min: number,
    max: number
  ): boolean {
    if (tolerance < 0) {
      throw new Error("Tolerance must be a non-negative number!");
    }
    // Max error is exactly halfway between the min and max
    const errorBound = (max - min) / 2.0;
    const error = MathUtil.inputModulus(expected - actual, -errorBound, errorBound);
    return Math.abs(error) < tolerance;
  }
}
