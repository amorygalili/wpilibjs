import { Pose2d } from '../geometry/Pose2d';
import { Rotation2d } from '../geometry/Rotation2d';
import { Translation2d } from '../geometry/Translation2d';

/**
 * Represents a cubic hermite spline.
 */
export class CubicHermiteSpline {
  private readonly m_xInitial: number;
  private readonly m_xFinal: number;
  private readonly m_yInitial: number;
  private readonly m_yFinal: number;
  private readonly m_xDotInitial: number;
  private readonly m_xDotFinal: number;
  private readonly m_yDotInitial: number;
  private readonly m_yDotFinal: number;

  /**
   * Constructs a cubic hermite spline with the specified control vectors.
   * Each control vector contains the position and the derivative at the point.
   *
   * @param xInitial The initial x position.
   * @param xFinal The final x position.
   * @param xDotInitial The initial x derivative.
   * @param xDotFinal The final x derivative.
   * @param yInitial The initial y position.
   * @param yFinal The final y position.
   * @param yDotInitial The initial y derivative.
   * @param yDotFinal The final y derivative.
   */
  constructor(
    xInitial: number,
    xFinal: number,
    xDotInitial: number,
    xDotFinal: number,
    yInitial: number,
    yFinal: number,
    yDotInitial: number,
    yDotFinal: number
  ) {
    this.m_xInitial = xInitial;
    this.m_xFinal = xFinal;
    this.m_xDotInitial = xDotInitial;
    this.m_xDotFinal = xDotFinal;
    this.m_yInitial = yInitial;
    this.m_yFinal = yFinal;
    this.m_yDotInitial = yDotInitial;
    this.m_yDotFinal = yDotFinal;
  }

  /**
   * Returns the point on the spline at the given parameter.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The point on the spline at the given parameter.
   */
  public getPoint(t: number): Pose2d {
    const h00 = this.hermite00(t);
    const h10 = this.hermite10(t);
    const h01 = this.hermite01(t);
    const h11 = this.hermite11(t);

    const x = h00 * this.m_xInitial + h10 * this.m_xDotInitial + h01 * this.m_xFinal + h11 * this.m_xDotFinal;
    const y = h00 * this.m_yInitial + h10 * this.m_yDotInitial + h01 * this.m_yFinal + h11 * this.m_yDotFinal;

    const xDot = this.hermite00Dot(t) * this.m_xInitial + this.hermite10Dot(t) * this.m_xDotInitial +
                 this.hermite01Dot(t) * this.m_xFinal + this.hermite11Dot(t) * this.m_xDotFinal;
    const yDot = this.hermite00Dot(t) * this.m_yInitial + this.hermite10Dot(t) * this.m_yDotInitial +
                 this.hermite01Dot(t) * this.m_yFinal + this.hermite11Dot(t) * this.m_yDotFinal;

    const angle = new Rotation2d(xDot, yDot);
    return new Pose2d(new Translation2d(x, y), angle);
  }

  /**
   * Returns the curvature at the given parameter.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The curvature at the given parameter.
   */
  public getCurvature(t: number): number {
    const xDot = this.hermite00Dot(t) * this.m_xInitial + this.hermite10Dot(t) * this.m_xDotInitial +
                 this.hermite01Dot(t) * this.m_xFinal + this.hermite11Dot(t) * this.m_xDotFinal;
    const yDot = this.hermite00Dot(t) * this.m_yInitial + this.hermite10Dot(t) * this.m_yDotInitial +
                 this.hermite01Dot(t) * this.m_yFinal + this.hermite11Dot(t) * this.m_yDotFinal;

    const xDotDot = this.hermite00DotDot(t) * this.m_xInitial + this.hermite10DotDot(t) * this.m_xDotInitial +
                    this.hermite01DotDot(t) * this.m_xFinal + this.hermite11DotDot(t) * this.m_xDotFinal;
    const yDotDot = this.hermite00DotDot(t) * this.m_yInitial + this.hermite10DotDot(t) * this.m_yDotInitial +
                    this.hermite01DotDot(t) * this.m_yFinal + this.hermite11DotDot(t) * this.m_yDotFinal;

    return (xDot * yDotDot - yDot * xDotDot) / Math.pow(xDot * xDot + yDot * yDot, 1.5);
  }

  /**
   * Returns the first basis function of a cubic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The first basis function at the given parameter.
   */
  private hermite00(t: number): number {
    return 2 * Math.pow(t, 3) - 3 * Math.pow(t, 2) + 1;
  }

  /**
   * Returns the second basis function of a cubic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The second basis function at the given parameter.
   */
  private hermite10(t: number): number {
    return Math.pow(t, 3) - 2 * Math.pow(t, 2) + t;
  }

  /**
   * Returns the third basis function of a cubic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The third basis function at the given parameter.
   */
  private hermite01(t: number): number {
    return -2 * Math.pow(t, 3) + 3 * Math.pow(t, 2);
  }

  /**
   * Returns the fourth basis function of a cubic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The fourth basis function at the given parameter.
   */
  private hermite11(t: number): number {
    return Math.pow(t, 3) - Math.pow(t, 2);
  }

  /**
   * Returns the derivative of the first basis function of a cubic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The derivative of the first basis function at the given parameter.
   */
  private hermite00Dot(t: number): number {
    return 6 * Math.pow(t, 2) - 6 * t;
  }

  /**
   * Returns the derivative of the second basis function of a cubic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The derivative of the second basis function at the given parameter.
   */
  private hermite10Dot(t: number): number {
    return 3 * Math.pow(t, 2) - 4 * t + 1;
  }

  /**
   * Returns the derivative of the third basis function of a cubic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The derivative of the third basis function at the given parameter.
   */
  private hermite01Dot(t: number): number {
    return -6 * Math.pow(t, 2) + 6 * t;
  }

  /**
   * Returns the derivative of the fourth basis function of a cubic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The derivative of the fourth basis function at the given parameter.
   */
  private hermite11Dot(t: number): number {
    return 3 * Math.pow(t, 2) - 2 * t;
  }

  /**
   * Returns the second derivative of the first basis function of a cubic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The second derivative of the first basis function at the given parameter.
   */
  private hermite00DotDot(t: number): number {
    return 12 * t - 6;
  }

  /**
   * Returns the second derivative of the second basis function of a cubic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The second derivative of the second basis function at the given parameter.
   */
  private hermite10DotDot(t: number): number {
    return 6 * t - 4;
  }

  /**
   * Returns the second derivative of the third basis function of a cubic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The second derivative of the third basis function at the given parameter.
   */
  private hermite01DotDot(t: number): number {
    return -12 * t + 6;
  }

  /**
   * Returns the second derivative of the fourth basis function of a cubic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The second derivative of the fourth basis function at the given parameter.
   */
  private hermite11DotDot(t: number): number {
    return 6 * t - 2;
  }
}
