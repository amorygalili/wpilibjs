/**
 * A change in distance along a 2D arc since the last pose update. We can use ideas from
 * differential calculus to create new Pose2d objects from a Twist2d and vice versa.
 *
 * A Twist can be used to represent a difference between two poses.
 */
export class Twist2d {
  /**
   * Linear "dx" component.
   */
  public dx: number;

  /**
   * Linear "dy" component.
   */
  public dy: number;

  /**
   * Angular "dtheta" component (radians).
   */
  public dtheta: number;

  /**
   * Constructs a Twist2d with the given values.
   *
   * @param dx Change in x direction relative to robot
   * @param dy Change in y direction relative to robot
   * @param dtheta Change in angle relative to robot (radians)
   */
  constructor(dx: number = 0, dy: number = 0, dtheta: number = 0) {
    this.dx = dx;
    this.dy = dy;
    this.dtheta = dtheta;
  }

  /**
   * Returns a string representation of the twist.
   *
   * @return A string representation of the twist.
   */
  public toString(): string {
    return `Twist2d(dX: ${this.dx}, dY: ${this.dy}, dTheta: ${this.dtheta})`;
  }

  /**
   * Checks equality between this Twist2d and another object.
   *
   * @param obj The other object.
   * @return Whether the two objects are equal.
   */
  public equals(obj: any): boolean {
    if (obj instanceof Twist2d) {
      const other = obj as Twist2d;
      return (
        Math.abs(this.dx - other.dx) < 1e-9 &&
        Math.abs(this.dy - other.dy) < 1e-9 &&
        Math.abs(this.dtheta - other.dtheta) < 1e-9
      );
    }
    return false;
  }
}
