import { Rotation2d } from '../geometry/Rotation2d';
import { MathUtil } from '../MathUtil';
import { Comparable } from '../util/Comparable';

/**
 * Represents the position of one swerve module.
 */
export class SwerveModulePosition implements Comparable<SwerveModulePosition> {
  /** Distance measured by the wheel of the module in meters. */
  public distanceMeters: number;

  /** Angle of the module. */
  public angle: Rotation2d;

  /**
   * Constructs a SwerveModulePosition with zeros for distance and angle.
   */
  constructor();

  /**
   * Constructs a SwerveModulePosition.
   *
   * @param distanceMeters The distance measured by the wheel of the module.
   * @param angle The angle of the module.
   */
  constructor(distanceMeters: number, angle: Rotation2d);

  constructor(distanceMeters?: number, angle?: Rotation2d) {
    this.distanceMeters = distanceMeters ?? 0;
    this.angle = angle ?? Rotation2d.kZero;
  }

  /**
   * Compares this SwerveModulePosition to another object.
   *
   * @param obj The other object.
   * @return Whether the two objects are equal.
   */
  public equals(obj: any): boolean {
    if (obj instanceof SwerveModulePosition) {
      const other = obj as SwerveModulePosition;
      return (
        Math.abs(other.distanceMeters - this.distanceMeters) < 1e-9 &&
        this.angle.equals(other.angle)
      );
    }
    return false;
  }

  /**
   * Compares this SwerveModulePosition to another SwerveModulePosition.
   *
   * @param other The other SwerveModulePosition.
   * @return -1, 0, or 1 based on whether this SwerveModulePosition is less than, equal to, or greater than the other.
   */
  public compareTo(other: SwerveModulePosition): number {
    return this.distanceMeters - other.distanceMeters;
  }

  /**
   * Returns a string representation of this SwerveModulePosition.
   *
   * @return A string representation of this SwerveModulePosition.
   */
  public toString(): string {
    return `SwerveModulePosition(Distance: ${this.distanceMeters.toFixed(2)} m, Angle: ${this.angle.getDegrees().toFixed(2)} deg)`;
  }

  /**
   * Returns a copy of this swerve module position.
   *
   * @return A copy of this swerve module position.
   */
  public copy(): SwerveModulePosition {
    return new SwerveModulePosition(this.distanceMeters, this.angle);
  }

  /**
   * Interpolates between this swerve module position and another swerve module position.
   *
   * @param endValue The end value for the interpolation.
   * @param t The interpolation parameter, in [0, 1].
   * @return The interpolated swerve module position.
   */
  public interpolate(endValue: SwerveModulePosition, t: number): SwerveModulePosition {
    return new SwerveModulePosition(
      MathUtil.interpolate(this.distanceMeters, endValue.distanceMeters, t),
      this.angle.interpolate(endValue.angle, t)
    );
  }
}
