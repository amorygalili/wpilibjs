import { Pose2d } from '../geometry/Pose2d';
import { PoseWithCurvature } from './PoseWithCurvature';

/**
 * A malformed spline does not have a valid parameterization.
 */
export class MalformedSplineException extends Error {
  /**
   * Constructs a MalformedSplineException.
   *
   * @param message The exception message.
   */
  constructor(message: string) {
    super(message);
    this.name = 'MalformedSplineException';
  }
}

/**
 * Class used to parameterize a spline by its arc length.
 */
export class SplineParameterizer {
  private static readonly kMaxDx = 0.127;
  private static readonly kMaxDy = 0.00127;
  private static readonly kMaxDtheta = 0.0872;
  private static readonly kMinSampleSize = 1;
  /**
   * Parameterizes the spline. This method breaks up the spline into various
   * arcs until their dx, dy, and dtheta are within specific tolerances.
   *
   * @param spline The spline to parameterize.
   * @return A vector of poses and curvatures that represents various points on the spline.
   * @throws MalformedSplineException When the spline is malformed (e.g. has a
   *     parameter outside of [0, 1]).
   */
  public static parameterize<T extends { getPoint: (t: number) => Pose2d; getCurvature: (t: number) => number }>(
    spline: T
  ): PoseWithCurvature[] {
    // List of poses and curvatures at various points on the spline
    const poses: PoseWithCurvature[] = [];

    // The spline's parameter at the current point
    let t = 0.0;

    // Get the initial pose and curvature
    let pose = spline.getPoint(t);
    let curvature = spline.getCurvature(t);

    // Add the initial point to the vector
    poses.push(new PoseWithCurvature(pose, curvature));

    // While we haven't reached the end of the spline
    while (t < 1.0) {
      // Get the current pose and curvature
      const lastPose = pose;

      // Calculate the step size
      let step = 1.0 - t;

      // Find the largest step size that results in a valid parameterization
      while (step > 0.00001) {
        const newT = t + step;

        // Make sure we don't go past the end of the spline
        if (newT > 1.0) {
          step = 1.0 - t;
        }

        // Get the new pose and curvature
        pose = spline.getPoint(t + step);
        curvature = spline.getCurvature(t + step);

        // Calculate the change in position and rotation
        const dx = pose.getTranslation().getX() - lastPose.getTranslation().getX();
        const dy = pose.getTranslation().getY() - lastPose.getTranslation().getY();
        const dtheta = Math.abs(pose.getRotation().getRadians() - lastPose.getRotation().getRadians());

        // If the step is within tolerance, break out of the loop
        if (dx < SplineParameterizer.kMaxDx && dy < SplineParameterizer.kMaxDy && dtheta < SplineParameterizer.kMaxDtheta) {
          break;
        }

        // If the step is not within tolerance, halve it and try again
        step /= 2.0;
      }

      // Increment the parameter by the step size
      t += step;

      // Add the new point to the vector
      poses.push(new PoseWithCurvature(pose, curvature));
    }

    return poses;
  }
}
