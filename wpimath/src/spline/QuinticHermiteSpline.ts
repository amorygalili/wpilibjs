import { Pose2d } from '../geometry/Pose2d';
import { Rotation2d } from '../geometry/Rotation2d';
import { Translation2d } from '../geometry/Translation2d';

/**
 * Represents a quintic hermite spline.
 */
export class QuinticHermiteSpline {
  private readonly m_xInitial: number;
  private readonly m_xFinal: number;
  private readonly m_yInitial: number;
  private readonly m_yFinal: number;
  private readonly m_xDotInitial: number;
  private readonly m_xDotFinal: number;
  private readonly m_yDotInitial: number;
  private readonly m_yDotFinal: number;
  private readonly m_xDotDotInitial: number;
  private readonly m_xDotDotFinal: number;
  private readonly m_yDotDotInitial: number;
  private readonly m_yDotDotFinal: number;

  /**
   * Constructs a quintic hermite spline with the specified control vectors.
   * Each control vector contains the position, first derivative, and second
   * derivative at the point.
   *
   * @param xInitial The initial x position.
   * @param xFinal The final x position.
   * @param xDotInitial The initial x derivative.
   * @param xDotFinal The final x derivative.
   * @param xDotDotInitial The initial x second derivative.
   * @param xDotDotFinal The final x second derivative.
   * @param yInitial The initial y position.
   * @param yFinal The final y position.
   * @param yDotInitial The initial y derivative.
   * @param yDotFinal The final y derivative.
   * @param yDotDotInitial The initial y second derivative.
   * @param yDotDotFinal The final y second derivative.
   */
  constructor(
    xInitial: number,
    xFinal: number,
    xDotInitial: number,
    xDotFinal: number,
    xDotDotInitial: number,
    xDotDotFinal: number,
    yInitial: number,
    yFinal: number,
    yDotInitial: number,
    yDotFinal: number,
    yDotDotInitial: number,
    yDotDotFinal: number
  ) {
    this.m_xInitial = xInitial;
    this.m_xFinal = xFinal;
    this.m_xDotInitial = xDotInitial;
    this.m_xDotFinal = xDotFinal;
    this.m_xDotDotInitial = xDotDotInitial;
    this.m_xDotDotFinal = xDotDotFinal;
    this.m_yInitial = yInitial;
    this.m_yFinal = yFinal;
    this.m_yDotInitial = yDotInitial;
    this.m_yDotFinal = yDotFinal;
    this.m_yDotDotInitial = yDotDotInitial;
    this.m_yDotDotFinal = yDotDotFinal;
  }

  /**
   * Returns the point on the spline at the given parameter.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The point on the spline at the given parameter.
   */
  public getPoint(t: number): Pose2d {
    const h0 = this.hermite0(t);
    const h1 = this.hermite1(t);
    const h2 = this.hermite2(t);
    const h3 = this.hermite3(t);
    const h4 = this.hermite4(t);
    const h5 = this.hermite5(t);

    const x = h0 * this.m_xInitial + h1 * this.m_xDotInitial + h2 * this.m_xDotDotInitial +
              h3 * this.m_xFinal + h4 * this.m_xDotFinal + h5 * this.m_xDotDotFinal;
    const y = h0 * this.m_yInitial + h1 * this.m_yDotInitial + h2 * this.m_yDotDotInitial +
              h3 * this.m_yFinal + h4 * this.m_yDotFinal + h5 * this.m_yDotDotFinal;

    const xDot = this.hermite0Dot(t) * this.m_xInitial + this.hermite1Dot(t) * this.m_xDotInitial +
                 this.hermite2Dot(t) * this.m_xDotDotInitial + this.hermite3Dot(t) * this.m_xFinal +
                 this.hermite4Dot(t) * this.m_xDotFinal + this.hermite5Dot(t) * this.m_xDotDotFinal;
    const yDot = this.hermite0Dot(t) * this.m_yInitial + this.hermite1Dot(t) * this.m_yDotInitial +
                 this.hermite2Dot(t) * this.m_yDotDotInitial + this.hermite3Dot(t) * this.m_yFinal +
                 this.hermite4Dot(t) * this.m_yDotFinal + this.hermite5Dot(t) * this.m_yDotDotFinal;

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
    const xDot = this.hermite0Dot(t) * this.m_xInitial + this.hermite1Dot(t) * this.m_xDotInitial +
                 this.hermite2Dot(t) * this.m_xDotDotInitial + this.hermite3Dot(t) * this.m_xFinal +
                 this.hermite4Dot(t) * this.m_xDotFinal + this.hermite5Dot(t) * this.m_xDotDotFinal;
    const yDot = this.hermite0Dot(t) * this.m_yInitial + this.hermite1Dot(t) * this.m_yDotInitial +
                 this.hermite2Dot(t) * this.m_yDotDotInitial + this.hermite3Dot(t) * this.m_yFinal +
                 this.hermite4Dot(t) * this.m_yDotFinal + this.hermite5Dot(t) * this.m_yDotDotFinal;

    const xDotDot = this.hermite0DotDot(t) * this.m_xInitial + this.hermite1DotDot(t) * this.m_xDotInitial +
                    this.hermite2DotDot(t) * this.m_xDotDotInitial + this.hermite3DotDot(t) * this.m_xFinal +
                    this.hermite4DotDot(t) * this.m_xDotFinal + this.hermite5DotDot(t) * this.m_xDotDotFinal;
    const yDotDot = this.hermite0DotDot(t) * this.m_yInitial + this.hermite1DotDot(t) * this.m_yDotInitial +
                    this.hermite2DotDot(t) * this.m_yDotDotInitial + this.hermite3DotDot(t) * this.m_yFinal +
                    this.hermite4DotDot(t) * this.m_yDotFinal + this.hermite5DotDot(t) * this.m_yDotDotFinal;

    return (xDot * yDotDot - yDot * xDotDot) / Math.pow(xDot * xDot + yDot * yDot, 1.5);
  }

  /**
   * Returns the first basis function of a quintic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The first basis function at the given parameter.
   */
  private hermite0(t: number): number {
    return 1 - 10 * Math.pow(t, 3) + 15 * Math.pow(t, 4) - 6 * Math.pow(t, 5);
  }

  /**
   * Returns the second basis function of a quintic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The second basis function at the given parameter.
   */
  private hermite1(t: number): number {
    return t - 6 * Math.pow(t, 3) + 8 * Math.pow(t, 4) - 3 * Math.pow(t, 5);
  }

  /**
   * Returns the third basis function of a quintic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The third basis function at the given parameter.
   */
  private hermite2(t: number): number {
    return 0.5 * Math.pow(t, 2) - 1.5 * Math.pow(t, 3) + 1.5 * Math.pow(t, 4) - 0.5 * Math.pow(t, 5);
  }

  /**
   * Returns the fourth basis function of a quintic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The fourth basis function at the given parameter.
   */
  private hermite3(t: number): number {
    return 10 * Math.pow(t, 3) - 15 * Math.pow(t, 4) + 6 * Math.pow(t, 5);
  }

  /**
   * Returns the fifth basis function of a quintic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The fifth basis function at the given parameter.
   */
  private hermite4(t: number): number {
    return -4 * Math.pow(t, 3) + 7 * Math.pow(t, 4) - 3 * Math.pow(t, 5);
  }

  /**
   * Returns the sixth basis function of a quintic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The sixth basis function at the given parameter.
   */
  private hermite5(t: number): number {
    return 0.5 * Math.pow(t, 3) - Math.pow(t, 4) + 0.5 * Math.pow(t, 5);
  }

  /**
   * Returns the derivative of the first basis function of a quintic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The derivative of the first basis function at the given parameter.
   */
  private hermite0Dot(t: number): number {
    return -30 * Math.pow(t, 2) + 60 * Math.pow(t, 3) - 30 * Math.pow(t, 4);
  }

  /**
   * Returns the derivative of the second basis function of a quintic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The derivative of the second basis function at the given parameter.
   */
  private hermite1Dot(t: number): number {
    return 1 - 18 * Math.pow(t, 2) + 32 * Math.pow(t, 3) - 15 * Math.pow(t, 4);
  }

  /**
   * Returns the derivative of the third basis function of a quintic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The derivative of the third basis function at the given parameter.
   */
  private hermite2Dot(t: number): number {
    return t - 4.5 * Math.pow(t, 2) + 6 * Math.pow(t, 3) - 2.5 * Math.pow(t, 4);
  }

  /**
   * Returns the derivative of the fourth basis function of a quintic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The derivative of the fourth basis function at the given parameter.
   */
  private hermite3Dot(t: number): number {
    return 30 * Math.pow(t, 2) - 60 * Math.pow(t, 3) + 30 * Math.pow(t, 4);
  }

  /**
   * Returns the derivative of the fifth basis function of a quintic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The derivative of the fifth basis function at the given parameter.
   */
  private hermite4Dot(t: number): number {
    return -12 * Math.pow(t, 2) + 28 * Math.pow(t, 3) - 15 * Math.pow(t, 4);
  }

  /**
   * Returns the derivative of the sixth basis function of a quintic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The derivative of the sixth basis function at the given parameter.
   */
  private hermite5Dot(t: number): number {
    return 1.5 * Math.pow(t, 2) - 4 * Math.pow(t, 3) + 2.5 * Math.pow(t, 4);
  }

  /**
   * Returns the second derivative of the first basis function of a quintic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The second derivative of the first basis function at the given parameter.
   */
  private hermite0DotDot(t: number): number {
    return -60 * t + 180 * Math.pow(t, 2) - 120 * Math.pow(t, 3);
  }

  /**
   * Returns the second derivative of the second basis function of a quintic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The second derivative of the second basis function at the given parameter.
   */
  private hermite1DotDot(t: number): number {
    return -36 * t + 96 * Math.pow(t, 2) - 60 * Math.pow(t, 3);
  }

  /**
   * Returns the second derivative of the third basis function of a quintic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The second derivative of the third basis function at the given parameter.
   */
  private hermite2DotDot(t: number): number {
    return 1 - 9 * t + 18 * Math.pow(t, 2) - 10 * Math.pow(t, 3);
  }

  /**
   * Returns the second derivative of the fourth basis function of a quintic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The second derivative of the fourth basis function at the given parameter.
   */
  private hermite3DotDot(t: number): number {
    return 60 * t - 180 * Math.pow(t, 2) + 120 * Math.pow(t, 3);
  }

  /**
   * Returns the second derivative of the fifth basis function of a quintic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The second derivative of the fifth basis function at the given parameter.
   */
  private hermite4DotDot(t: number): number {
    return -24 * t + 84 * Math.pow(t, 2) - 60 * Math.pow(t, 3);
  }

  /**
   * Returns the second derivative of the sixth basis function of a quintic hermite spline.
   *
   * @param t The parameter, which is between 0 and 1.
   * @return The second derivative of the sixth basis function at the given parameter.
   */
  private hermite5DotDot(t: number): number {
    return 3 * t - 12 * Math.pow(t, 2) + 10 * Math.pow(t, 3);
  }
}
