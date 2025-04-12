import { MathUtil } from '../MathUtil';

/**
 * Represents the wheel positions for a mecanum drive drivetrain.
 */
export class MecanumDriveWheelPositions {
  /** Distance measured by the front left wheel. */
  public frontLeftMeters: number;

  /** Distance measured by the front right wheel. */
  public frontRightMeters: number;

  /** Distance measured by the rear left wheel. */
  public rearLeftMeters: number;

  /** Distance measured by the rear right wheel. */
  public rearRightMeters: number;

  /**
   * Constructs a MecanumDriveWheelPositions with zeros for all wheel positions.
   */
  constructor();

  /**
   * Constructs a MecanumDriveWheelPositions.
   *
   * @param frontLeftMeters Distance measured by the front left wheel.
   * @param frontRightMeters Distance measured by the front right wheel.
   * @param rearLeftMeters Distance measured by the rear left wheel.
   * @param rearRightMeters Distance measured by the rear right wheel.
   */
  constructor(
    frontLeftMeters: number,
    frontRightMeters: number,
    rearLeftMeters: number,
    rearRightMeters: number
  );

  constructor(
    frontLeftMeters?: number,
    frontRightMeters?: number,
    rearLeftMeters?: number,
    rearRightMeters?: number
  ) {
    this.frontLeftMeters = frontLeftMeters ?? 0;
    this.frontRightMeters = frontRightMeters ?? 0;
    this.rearLeftMeters = rearLeftMeters ?? 0;
    this.rearRightMeters = rearRightMeters ?? 0;
  }

  /**
   * Checks equality between this MecanumDriveWheelPositions and another object.
   *
   * @param obj The other object.
   * @return Whether the two objects are equal.
   */
  public equals(obj: any): boolean {
    if (obj instanceof MecanumDriveWheelPositions) {
      const other = obj as MecanumDriveWheelPositions;
      return (
        Math.abs(other.frontLeftMeters - this.frontLeftMeters) < 1e-9 &&
        Math.abs(other.frontRightMeters - this.frontRightMeters) < 1e-9 &&
        Math.abs(other.rearLeftMeters - this.rearLeftMeters) < 1e-9 &&
        Math.abs(other.rearRightMeters - this.rearRightMeters) < 1e-9
      );
    }
    return false;
  }

  /**
   * Returns a string representation of this MecanumDriveWheelPositions.
   *
   * @return A string representation of this MecanumDriveWheelPositions.
   */
  public toString(): string {
    return `MecanumDriveWheelPositions(Front Left: ${this.frontLeftMeters.toFixed(2)} m, Front Right: ${this.frontRightMeters.toFixed(2)} m, Rear Left: ${this.rearLeftMeters.toFixed(2)} m, Rear Right: ${this.rearRightMeters.toFixed(2)} m)`;
  }

  /**
   * Interpolates between this MecanumDriveWheelPositions and another MecanumDriveWheelPositions.
   *
   * @param endValue The end value for the interpolation.
   * @param t The interpolation parameter, in [0, 1].
   * @return The interpolated MecanumDriveWheelPositions.
   */
  public interpolate(endValue: MecanumDriveWheelPositions, t: number): MecanumDriveWheelPositions {
    return new MecanumDriveWheelPositions(
      MathUtil.interpolate(this.frontLeftMeters, endValue.frontLeftMeters, t),
      MathUtil.interpolate(this.frontRightMeters, endValue.frontRightMeters, t),
      MathUtil.interpolate(this.rearLeftMeters, endValue.rearLeftMeters, t),
      MathUtil.interpolate(this.rearRightMeters, endValue.rearRightMeters, t)
    );
  }
}
