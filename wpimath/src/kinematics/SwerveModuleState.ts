import { Rotation2d } from '../geometry/Rotation2d';
import { MathUtil } from '../MathUtil';
import { Comparable } from '../util/Comparable';

/**
 * Represents the state of one swerve module.
 */
export class SwerveModuleState implements Comparable<SwerveModuleState> {
  /** Speed of the wheel of the module in meters per second. */
  public speedMetersPerSecond: number;

  /** Angle of the module. */
  public angle: Rotation2d;

  /**
   * Constructs a SwerveModuleState with zeros for speed and angle.
   */
  constructor();

  /**
   * Constructs a SwerveModuleState.
   *
   * @param speedMetersPerSecond The speed of the wheel of the module.
   * @param angle The angle of the module.
   */
  constructor(speedMetersPerSecond: number, angle: Rotation2d);

  constructor(speedMetersPerSecond?: number, angle?: Rotation2d) {
    this.speedMetersPerSecond = speedMetersPerSecond ?? 0;
    this.angle = angle ?? Rotation2d.kZero;
  }

  /**
   * Compares this SwerveModuleState to another object.
   *
   * @param obj The other object.
   * @return Whether the two objects are equal.
   */
  public equals(obj: any): boolean {
    if (obj instanceof SwerveModuleState) {
      const other = obj as SwerveModuleState;
      return (
        Math.abs(other.speedMetersPerSecond - this.speedMetersPerSecond) < 1e-9 &&
        this.angle.equals(other.angle)
      );
    }
    return false;
  }

  /**
   * Compares this SwerveModuleState to another SwerveModuleState.
   *
   * @param other The other SwerveModuleState.
   * @return -1, 0, or 1 based on whether this SwerveModuleState is less than, equal to, or greater than the other.
   */
  public compareTo(other: SwerveModuleState): number {
    return this.speedMetersPerSecond - other.speedMetersPerSecond;
  }

  /**
   * Returns a string representation of this SwerveModuleState.
   *
   * @return A string representation of this SwerveModuleState.
   */
  public toString(): string {
    return `SwerveModuleState(Speed: ${this.speedMetersPerSecond.toFixed(2)} m/s, Angle: ${this.angle.getDegrees().toFixed(2)} deg)`;
  }

  /**
   * Minimize the change in heading the desired swerve module state would require by potentially
   * reversing the direction the wheel spins. If this is used with the PIDController class's
   * continuous input functionality, the furthest a wheel will ever rotate is 90 degrees.
   *
   * @param desiredState The desired state.
   * @param currentAngle The current module angle.
   * @return Optimized swerve module state.
   */
  public static optimize(desiredState: SwerveModuleState, currentAngle: Rotation2d): SwerveModuleState {
    const delta = desiredState.angle.minus(currentAngle);
    if (Math.abs(delta.getDegrees()) > 90.0) {
      return new SwerveModuleState(
        -desiredState.speedMetersPerSecond,
        desiredState.angle.rotateBy(Rotation2d.kPi)
      );
    } else {
      return new SwerveModuleState(desiredState.speedMetersPerSecond, desiredState.angle);
    }
  }

  /**
   * Minimize the change in heading this swerve module state would require by potentially
   * reversing the direction the wheel spins. If this is used with the PIDController class's
   * continuous input functionality, the furthest a wheel will ever rotate is 90 degrees.
   *
   * @param currentAngle The current module angle.
   */
  public optimize(currentAngle: Rotation2d): void {
    const delta = this.angle.minus(currentAngle);
    if (Math.abs(delta.getDegrees()) > 90.0) {
      this.speedMetersPerSecond *= -1;
      this.angle = this.angle.rotateBy(Rotation2d.kPi);
    }
  }

  /**
   * Scales speed by cosine of angle error. This scales down movement perpendicular to the desired
   * direction of travel that can occur when modules change directions. This results in smoother
   * driving.
   *
   * @param currentAngle The current module angle.
   */
  public cosineScale(currentAngle: Rotation2d): void {
    this.speedMetersPerSecond *= this.angle.minus(currentAngle).getCos();
  }
}
