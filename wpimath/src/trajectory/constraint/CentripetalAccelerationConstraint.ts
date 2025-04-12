import { Pose2d } from '../../geometry/Pose2d';
import { MinMax, TrajectoryConstraint } from '../TrajectoryConfig';

/**
 * A constraint on the maximum centripetal acceleration allowed when traversing a trajectory.
 *
 * This is useful to prevent trajectories from being planned with turns that are too sharp
 * and would cause the robot to tip over.
 */
export class CentripetalAccelerationConstraint implements TrajectoryConstraint {
  private readonly m_maxCentripetalAccelerationMetersPerSecondSq: number;

  /**
   * Constructs a new CentripetalAccelerationConstraint.
   *
   * @param maxCentripetalAccelerationMetersPerSecondSq The maximum centripetal acceleration.
   */
  constructor(maxCentripetalAccelerationMetersPerSecondSq: number) {
    this.m_maxCentripetalAccelerationMetersPerSecondSq = maxCentripetalAccelerationMetersPerSecondSq;
  }

  /**
   * Returns the max velocity given the current pose and curvature.
   *
   * @param poseMeters The pose at the current point in the trajectory.
   * @param curvatureRadPerMeter The curvature at the current point in the trajectory.
   * @param velocityMetersPerSecond The velocity at the current point in the trajectory before constraints are applied.
   * @return The absolute maximum velocity.
   */
  public getMaxVelocityMetersPerSecond(
    poseMeters: Pose2d,
    curvatureRadPerMeter: number,
    velocityMetersPerSecond: number
  ): number {
    // Calculate the maximum velocity allowed by the centripetal acceleration constraint
    // v^2 / r = a_centripetal
    // v^2 = a_centripetal * r
    // v^2 = a_centripetal / curvature
    // v = sqrt(a_centripetal / curvature)

    // Handle the case where the curvature is very small (straight line)
    if (Math.abs(curvatureRadPerMeter) < 1e-9) {
      return Infinity;
    }

    return Math.sqrt(this.m_maxCentripetalAccelerationMetersPerSecondSq / Math.abs(curvatureRadPerMeter));
  }

  /**
   * Returns the minimum and maximum allowable acceleration for the trajectory
   * given pose, curvature, and speed.
   *
   * @param poseMeters The pose at the current point in the trajectory.
   * @param curvatureRadPerMeter The curvature at the current point in the trajectory.
   * @param velocityMetersPerSecond The speed at the current point in the trajectory.
   * @return The min and max acceleration bounds.
   */
  public getMinMaxAccelerationMetersPerSecondSq(
    poseMeters: Pose2d,
    curvatureRadPerMeter: number,
    velocityMetersPerSecond: number
  ): MinMax {
    // The centripetal acceleration constraint doesn't limit the tangential acceleration
    return new MinMax(-Infinity, Infinity);
  }
}
