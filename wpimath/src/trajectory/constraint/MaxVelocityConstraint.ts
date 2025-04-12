import { Pose2d } from '../../geometry/Pose2d';
import { MinMax, TrajectoryConstraint } from '../TrajectoryConfig';

/**
 * A constraint that limits the maximum velocity.
 */
export class MaxVelocityConstraint implements TrajectoryConstraint {
  private readonly m_maxVelocityMetersPerSecond: number;

  /**
   * Constructs a new MaxVelocityConstraint.
   *
   * @param maxVelocityMetersPerSecond The maximum velocity.
   */
  constructor(maxVelocityMetersPerSecond: number) {
    this.m_maxVelocityMetersPerSecond = maxVelocityMetersPerSecond;
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
    return this.m_maxVelocityMetersPerSecond;
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
    return new MinMax(-Infinity, Infinity);
  }
}
