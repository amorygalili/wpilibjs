import { MathUtil } from '../MathUtil';

/**
 * Represents the wheel positions for a differential drive drivetrain.
 */
export class DifferentialDriveWheelPositions {
  /** Distance measured by the left side. */
  public leftMeters: number;

  /** Distance measured by the right side. */
  public rightMeters: number;

  /**
   * Constructs a DifferentialDriveWheelPositions.
   *
   * @param leftMeters Distance measured by the left side.
   * @param rightMeters Distance measured by the right side.
   */
  constructor(leftMeters: number = 0, rightMeters: number = 0) {
    this.leftMeters = leftMeters;
    this.rightMeters = rightMeters;
  }

  /**
   * Checks equality between this DifferentialDriveWheelPositions and another object.
   *
   * @param obj The other object.
   * @return Whether the two objects are equal.
   */
  public equals(obj: any): boolean {
    if (obj instanceof DifferentialDriveWheelPositions) {
      const other = obj as DifferentialDriveWheelPositions;
      return (
        Math.abs(other.leftMeters - this.leftMeters) < 1e-9 &&
        Math.abs(other.rightMeters - this.rightMeters) < 1e-9
      );
    }
    return false;
  }

  /**
   * Returns a string representation of this DifferentialDriveWheelPositions.
   *
   * @return A string representation of this DifferentialDriveWheelPositions.
   */
  public toString(): string {
    return `DifferentialDriveWheelPositions(Left: ${this.leftMeters.toFixed(2)} m, Right: ${this.rightMeters.toFixed(2)} m)`;
  }

  /**
   * Interpolates between this DifferentialDriveWheelPositions and another DifferentialDriveWheelPositions.
   *
   * @param endValue The end value for the interpolation.
   * @param t The interpolation parameter, in [0, 1].
   * @return The interpolated DifferentialDriveWheelPositions.
   */
  public interpolate(endValue: DifferentialDriveWheelPositions, t: number): DifferentialDriveWheelPositions {
    return new DifferentialDriveWheelPositions(
      MathUtil.interpolate(this.leftMeters, endValue.leftMeters, t),
      MathUtil.interpolate(this.rightMeters, endValue.rightMeters, t)
    );
  }
}
