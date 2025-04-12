import { MathSharedStore } from '../MathSharedStore';
import { MathUtil } from '../MathUtil';

/**
 * A rotation in a 2D coordinate frame represented by a point on the unit circle (cosine and sine).
 *
 * The angle is continuous, that is if a Rotation2d is constructed with 361 degrees, it will
 * return 361 degrees. This allows algorithms that wouldn't want to see a discontinuity in the
 * rotations as it sweeps past from 360 to 0 on the second time around.
 */
export class Rotation2d {
  /**
   * A preallocated Rotation2d representing no rotation.
   */
  public static readonly kZero = new Rotation2d();

  /**
   * A preallocated Rotation2d representing a counterclockwise rotation by π rad (180°).
   */
  public static readonly kPi = new Rotation2d(Math.PI);

  private readonly m_value: number;
  private readonly m_cos: number;
  private readonly m_sin: number;

  /**
   * Constructs a Rotation2d with a default angle of 0 degrees.
   */
  constructor();

  /**
   * Constructs a Rotation2d with the given radian value.
   *
   * @param value The value of the angle in radians.
   */
  constructor(value: number);

  /**
   * Constructs a Rotation2d with the given x and y (cosine and sine) components.
   *
   * @param x The x component or cosine of the rotation.
   * @param y The y component or sine of the rotation.
   */
  constructor(x: number, y: number);

  constructor(valueOrX?: number, y?: number) {
    if (valueOrX === undefined) {
      // Default constructor
      this.m_value = 0.0;
      this.m_cos = 1.0;
      this.m_sin = 0.0;
    } else if (y === undefined) {
      // Constructor with radian value
      this.m_value = valueOrX;
      this.m_cos = Math.cos(valueOrX);
      this.m_sin = Math.sin(valueOrX);
    } else {
      // Constructor with x and y components
      const magnitude = Math.hypot(valueOrX, y);
      if (magnitude > 1e-6) {
        this.m_cos = valueOrX / magnitude;
        this.m_sin = y / magnitude;
      } else {
        this.m_cos = 1.0;
        this.m_sin = 0.0;
        MathSharedStore.reportError("x and y components of Rotation2d are zero");
      }
      this.m_value = Math.atan2(this.m_sin, this.m_cos);
    }
  }

  /**
   * Constructs and returns a Rotation2d with the given radian value.
   *
   * @param radians The value of the angle in radians.
   * @return The rotation object with the desired angle value.
   */
  public static fromRadians(radians: number): Rotation2d {
    return new Rotation2d(radians);
  }

  /**
   * Constructs and returns a Rotation2d with the given degree value.
   *
   * @param degrees The value of the angle in degrees.
   * @return The rotation object with the desired angle value.
   */
  public static fromDegrees(degrees: number): Rotation2d {
    return new Rotation2d(degrees * (Math.PI / 180.0));
  }

  /**
   * Constructs and returns a Rotation2d with the given number of rotations.
   *
   * @param rotations The value of the angle in rotations.
   * @return The rotation object with the desired angle value.
   */
  public static fromRotations(rotations: number): Rotation2d {
    return new Rotation2d(rotations * 2 * Math.PI);
  }

  /**
   * Adds two rotations together, with the result being bounded between -π and π.
   *
   * For example, Rotation2d.fromDegrees(30) + Rotation2d.fromDegrees(60) = Rotation2d.fromDegrees(90)
   *
   * @param other The rotation to add.
   * @return The sum of the two rotations.
   */
  public plus(other: Rotation2d): Rotation2d {
    return this.rotateBy(other);
  }

  /**
   * Subtracts the new rotation from the current rotation and returns the new rotation.
   *
   * For example, Rotation2d.fromDegrees(30) - Rotation2d.fromDegrees(60) = Rotation2d.fromDegrees(-30)
   *
   * @param other The rotation to subtract.
   * @return The difference between the two rotations.
   */
  public minus(other: Rotation2d): Rotation2d {
    return this.rotateBy(new Rotation2d(other.getCos(), -other.getSin()));
  }

  /**
   * Takes the inverse of the current rotation. This is simply the negative of the current angular value.
   *
   * @return The inverse of the current rotation.
   */
  public unaryMinus(): Rotation2d {
    return new Rotation2d(-this.m_value);
  }

  /**
   * Multiplies the current rotation by a scalar.
   *
   * @param scalar The scalar.
   * @return The new scaled Rotation2d.
   */
  public times(scalar: number): Rotation2d {
    return new Rotation2d(this.m_value * scalar);
  }

  /**
   * Adds the new rotation to the current rotation using a rotation matrix.
   *
   * [cos_new]   [other.cos, -other.sin][cos]
   * [sin_new] = [other.sin,  other.cos][sin]
   * value_new = atan2(sin_new, cos_new)
   *
   * @param other The rotation to rotate by.
   * @return The new rotated Rotation2d.
   */
  public rotateBy(other: Rotation2d): Rotation2d {
    return new Rotation2d(
      this.m_cos * other.m_cos - this.m_sin * other.m_sin,
      this.m_cos * other.m_sin + this.m_sin * other.m_cos
    );
  }

  /**
   * Returns the radian value of the Rotation2d.
   *
   * @return The radian value of the Rotation2d.
   */
  public getRadians(): number {
    return this.m_value;
  }

  /**
   * Alias for getRadians() to maintain compatibility with tests.
   */
  public get radians(): number {
    return this.getRadians();
  }

  /**
   * Returns the degree value of the Rotation2d.
   *
   * @return The degree value of the Rotation2d.
   */
  public getDegrees(): number {
    return this.m_value * (180.0 / Math.PI);
  }

  /**
   * Returns the number of rotations of the Rotation2d.
   *
   * @return The number of rotations of the Rotation2d.
   */
  public getRotations(): number {
    return this.m_value / (2 * Math.PI);
  }

  /**
   * Returns the cosine of the Rotation2d.
   *
   * @return The cosine of the Rotation2d.
   */
  public getCos(): number {
    return this.m_cos;
  }

  /**
   * Returns the sine of the Rotation2d.
   *
   * @return The sine of the Rotation2d.
   */
  public getSin(): number {
    return this.m_sin;
  }

  /**
   * Returns the tangent of the Rotation2d.
   *
   * @return The tangent of the Rotation2d.
   */
  public getTan(): number {
    return this.m_sin / this.m_cos;
  }

  /**
   * Interpolates between this rotation and another rotation.
   *
   * @param endValue The end value for the interpolation.
   * @param t The interpolation parameter, in [0, 1].
   * @return The interpolated rotation.
   */
  public interpolate(endValue: Rotation2d, t: number): Rotation2d {
    return this.plus(endValue.minus(this).times(MathUtil.clamp(t, 0, 1)));
  }

  /**
   * Returns whether the rotation is equal to another rotation.
   *
   * @param obj The other rotation.
   * @return Whether the two rotations are equal.
   */
  public equals(obj: unknown): boolean {
    if (obj instanceof Rotation2d) {
      const other = obj;
      return Math.abs(this.m_cos - other.m_cos) < 1E-9 &&
             Math.abs(this.m_sin - other.m_sin) < 1E-9;
    }
    return false;
  }

  /**
   * Returns a string representation of the rotation.
   *
   * @return A string representation of the rotation.
   */
  public toString(): string {
    return `Rotation2d(${Math.round(this.getDegrees())}°)`;
  }
}
