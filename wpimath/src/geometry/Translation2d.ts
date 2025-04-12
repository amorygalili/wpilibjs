import { MathUtil } from '../MathUtil';
import { Rotation2d } from './Rotation2d';

/**
 * Represents a translation in 2D space. This object can be used to represent a point or a vector.
 *
 * This assumes that you are using conventional mathematical axes. When the robot is at the
 * origin facing in the positive X direction, forward is positive X and left is positive Y.
 */
export class Translation2d {
  /**
   * A preallocated Translation2d representing the origin.
   *
   * This exists to avoid allocations for common translations.
   */
  public static readonly kZero = new Translation2d();

  private readonly m_x: number;
  private readonly m_y: number;

  /**
   * Constructs a Translation2d with X and Y components equal to zero.
   */
  constructor();

  /**
   * Constructs a Translation2d with the X and Y components equal to the provided values.
   *
   * @param x The x component of the translation.
   * @param y The y component of the translation.
   */
  constructor(x: number, y: number);

  /**
   * Constructs a Translation2d with the provided distance and angle. This is essentially converting
   * from polar coordinates to Cartesian coordinates.
   *
   * @param distance The distance from the origin to the end of the translation.
   * @param angle The angle between the x-axis and the translation vector.
   */
  constructor(distance: number, angle: Rotation2d);

  constructor(xOrDistance?: number, yOrAngle?: number | Rotation2d) {
    if (xOrDistance === undefined || yOrAngle === undefined) {
      this.m_x = 0.0;
      this.m_y = 0.0;
    } else if (yOrAngle instanceof Rotation2d) {
      // Distance and angle constructor
      this.m_x = xOrDistance * yOrAngle.getCos();
      this.m_y = xOrDistance * yOrAngle.getSin();
    } else {
      // X and Y constructor
      this.m_x = xOrDistance;
      this.m_y = yOrAngle;
    }
  }

  /**
   * Calculates the distance between two translations in 2D space.
   *
   * The distance between translations is defined as √((x₂−x₁)²+(y₂−y₁)²).
   *
   * @param other The translation to compute the distance to.
   * @return The distance between the two translations.
   */
  public getDistance(other: Translation2d): number {
    return Math.hypot(other.m_x - this.m_x, other.m_y - this.m_y);
  }

  /**
   * Returns the X component of the translation.
   *
   * @return The X component of the translation.
   */
  public getX(): number {
    return this.m_x;
  }

  /**
   * Returns the Y component of the translation.
   *
   * @return The Y component of the translation.
   */
  public getY(): number {
    return this.m_y;
  }

  /**
   * Returns the norm, or distance from the origin to the translation.
   *
   * @return The norm of the translation.
   */
  public getNorm(): number {
    return Math.hypot(this.m_x, this.m_y);
  }

  /**
   * Returns the angle this translation forms with the positive X axis.
   *
   * @return The angle of the translation.
   */
  public getAngle(): Rotation2d {
    return new Rotation2d(this.m_x, this.m_y);
  }

  /**
   * Applies a rotation to the translation in 2D space.
   *
   * This multiplies the translation vector by a counterclockwise rotation matrix of the given
   * angle.
   *
   * [x_new]   [other.cos, -other.sin][x]
   * [y_new] = [other.sin,  other.cos][y]
   *
   * For example, rotating a Translation2d of <2, 0> by 90 degrees will return a
   * Translation2d of <0, 2>.
   *
   * @param other The rotation to rotate the translation by.
   * @return The new rotated translation.
   */
  public rotateBy(other: Rotation2d): Translation2d {
    return new Translation2d(
      this.m_x * other.getCos() - this.m_y * other.getSin(),
      this.m_x * other.getSin() + this.m_y * other.getCos()
    );
  }

  /**
   * Adds two translations in 2D space and returns the sum.
   *
   * For example, Translation2d(1.0, 2.5) + Translation2d(2.0, 5.5) = Translation2d(3.0, 8.0)
   *
   * @param other The translation to add.
   * @return The sum of the translations.
   */
  public plus(other: Translation2d): Translation2d {
    return new Translation2d(this.m_x + other.m_x, this.m_y + other.m_y);
  }

  /**
   * Subtracts the other translation from the other translation and returns the difference.
   *
   * For example, Translation2d(5.0, 4.0) - Translation2d(1.0, 2.0) = Translation2d(4.0, 2.0)
   *
   * @param other The translation to subtract.
   * @return The difference between the two translations.
   */
  public minus(other: Translation2d): Translation2d {
    return new Translation2d(this.m_x - other.m_x, this.m_y - other.m_y);
  }

  /**
   * Returns the inverse of the current translation.
   *
   * For example, Translation2d(1.0, 2.0).unaryMinus() = Translation2d(-1.0, -2.0)
   *
   * @return The inverse of the current translation.
   */
  public unaryMinus(): Translation2d {
    return new Translation2d(-this.m_x, -this.m_y);
  }

  /**
   * Multiplies the translation by a scalar and returns the new translation.
   *
   * For example, Translation2d(2.0, 2.5) * 2 = Translation2d(4.0, 5.0)
   *
   * @param scalar The scalar to multiply by.
   * @return The scaled translation.
   */
  public times(scalar: number): Translation2d {
    return new Translation2d(this.m_x * scalar, this.m_y * scalar);
  }

  /**
   * Divides the translation by a scalar and returns the new translation.
   *
   * For example, Translation2d(2.0, 2.5) / 2 = Translation2d(1.0, 1.25)
   *
   * @param scalar The scalar to divide by.
   * @return The scaled translation.
   */
  public div(scalar: number): Translation2d {
    return new Translation2d(this.m_x / scalar, this.m_y / scalar);
  }

  /**
   * Returns the nearest Translation2d from a list of translations.
   *
   * @param translations The list of translations to check.
   * @return The nearest Translation2d from the list.
   */
  public nearest(translations: Translation2d[]): Translation2d {
    return translations.reduce((closest, current) => {
      return this.getDistance(current) < this.getDistance(closest) ? current : closest;
    });
  }

  /**
   * Interpolates between this translation and another translation.
   *
   * @param endValue The end value for the interpolation.
   * @param t The interpolation parameter, in [0, 1].
   * @return The interpolated translation.
   */
  public interpolate(endValue: Translation2d, t: number): Translation2d {
    return new Translation2d(
      MathUtil.interpolate(this.m_x, endValue.m_x, t),
      MathUtil.interpolate(this.m_y, endValue.m_y, t)
    );
  }

  /**
   * Returns whether the translation is equal to another translation.
   *
   * @param obj The other translation.
   * @return Whether the two translations are equal.
   */
  public equals(obj: unknown): boolean {
    if (obj instanceof Translation2d) {
      const other = obj;
      return Math.abs(this.m_x - other.m_x) < 1E-9 &&
             Math.abs(this.m_y - other.m_y) < 1E-9;
    }
    return false;
  }

  /**
   * Returns a string representation of the translation.
   *
   * @return A string representation of the translation.
   */
  public toString(): string {
    return `Translation2d(X: ${this.m_x}, Y: ${this.m_y})`;
  }
}
