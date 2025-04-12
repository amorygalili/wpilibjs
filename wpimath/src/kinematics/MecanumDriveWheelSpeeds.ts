/**
 * Represents the wheel speeds for a mecanum drive drivetrain.
 */
export class MecanumDriveWheelSpeeds {
  /** Speed of the front left wheel. */
  public frontLeftMetersPerSecond: number;

  /** Speed of the front right wheel. */
  public frontRightMetersPerSecond: number;

  /** Speed of the rear left wheel. */
  public rearLeftMetersPerSecond: number;

  /** Speed of the rear right wheel. */
  public rearRightMetersPerSecond: number;

  /**
   * Constructs a MecanumDriveWheelSpeeds with zeros for all wheel speeds.
   */
  constructor();

  /**
   * Constructs a MecanumDriveWheelSpeeds.
   *
   * @param frontLeftMetersPerSecond Speed of the front left wheel.
   * @param frontRightMetersPerSecond Speed of the front right wheel.
   * @param rearLeftMetersPerSecond Speed of the rear left wheel.
   * @param rearRightMetersPerSecond Speed of the rear right wheel.
   */
  constructor(
    frontLeftMetersPerSecond: number,
    frontRightMetersPerSecond: number,
    rearLeftMetersPerSecond: number,
    rearRightMetersPerSecond: number
  );

  constructor(
    frontLeftMetersPerSecond?: number,
    frontRightMetersPerSecond?: number,
    rearLeftMetersPerSecond?: number,
    rearRightMetersPerSecond?: number
  ) {
    this.frontLeftMetersPerSecond = frontLeftMetersPerSecond ?? 0;
    this.frontRightMetersPerSecond = frontRightMetersPerSecond ?? 0;
    this.rearLeftMetersPerSecond = rearLeftMetersPerSecond ?? 0;
    this.rearRightMetersPerSecond = rearRightMetersPerSecond ?? 0;
  }

  /**
   * Normalizes the wheel speeds using the given maximum speed.
   *
   * <p>Sometimes, after inverse kinematics, the requested speed from one or more wheels may be
   * above the max attainable speed for the driving motor on that wheel. To fix this issue, one can
   * reduce all the wheel speeds to make sure that all requested module speeds are at-or-below the
   * absolute threshold, while maintaining the ratio of speeds between wheels.
   *
   * @param attainableMaxSpeedMetersPerSecond The absolute max speed that a wheel can reach.
   */
  public normalize(attainableMaxSpeedMetersPerSecond: number): void {
    const realMaxSpeed = Math.max(
      Math.abs(this.frontLeftMetersPerSecond),
      Math.abs(this.frontRightMetersPerSecond),
      Math.abs(this.rearLeftMetersPerSecond),
      Math.abs(this.rearRightMetersPerSecond)
    );

    if (realMaxSpeed > attainableMaxSpeedMetersPerSecond) {
      this.frontLeftMetersPerSecond = (this.frontLeftMetersPerSecond / realMaxSpeed) * attainableMaxSpeedMetersPerSecond;
      this.frontRightMetersPerSecond = (this.frontRightMetersPerSecond / realMaxSpeed) * attainableMaxSpeedMetersPerSecond;
      this.rearLeftMetersPerSecond = (this.rearLeftMetersPerSecond / realMaxSpeed) * attainableMaxSpeedMetersPerSecond;
      this.rearRightMetersPerSecond = (this.rearRightMetersPerSecond / realMaxSpeed) * attainableMaxSpeedMetersPerSecond;
    }
  }

  /**
   * Alias for normalize() to maintain API compatibility with the Java version.
   *
   * @param attainableMaxSpeedMetersPerSecond The absolute max speed that a wheel can reach.
   */
  public desaturate(attainableMaxSpeedMetersPerSecond: number): void {
    this.normalize(attainableMaxSpeedMetersPerSecond);
  }
}
