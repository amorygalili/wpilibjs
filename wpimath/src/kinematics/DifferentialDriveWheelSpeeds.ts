/**
 * Represents the wheel speeds for a differential drive drivetrain.
 */
export class DifferentialDriveWheelSpeeds {
  /** Speed of the left side of the robot. */
  public leftMetersPerSecond: number;

  /** Speed of the right side of the robot. */
  public rightMetersPerSecond: number;

  /**
   * Constructs a DifferentialDriveWheelSpeeds with zeros for left and right speeds.
   */
  constructor();

  /**
   * Constructs a DifferentialDriveWheelSpeeds.
   *
   * @param leftMetersPerSecond The left speed.
   * @param rightMetersPerSecond The right speed.
   */
  constructor(leftMetersPerSecond: number, rightMetersPerSecond: number);

  constructor(leftMetersPerSecond?: number, rightMetersPerSecond?: number) {
    this.leftMetersPerSecond = leftMetersPerSecond ?? 0;
    this.rightMetersPerSecond = rightMetersPerSecond ?? 0;
  }

  /**
   * Normalizes the wheel speeds using the given maximum speed.
   *
   * @param attainableMaxSpeedMetersPerSecond The absolute maximum speed that a wheel can
   *                                          reach.
   */
  public normalize(attainableMaxSpeedMetersPerSecond: number): void {
    const realMaxSpeed = Math.max(
      Math.abs(this.leftMetersPerSecond),
      Math.abs(this.rightMetersPerSecond)
    );

    if (realMaxSpeed > attainableMaxSpeedMetersPerSecond) {
      this.leftMetersPerSecond = (this.leftMetersPerSecond / realMaxSpeed) * attainableMaxSpeedMetersPerSecond;
      this.rightMetersPerSecond = (this.rightMetersPerSecond / realMaxSpeed) * attainableMaxSpeedMetersPerSecond;
    }
  }
}
