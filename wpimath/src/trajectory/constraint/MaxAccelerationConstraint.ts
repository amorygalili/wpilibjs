import { Pose2d } from '../../geometry/Pose2d';
import { MinMax, TrajectoryConstraint } from '../TrajectoryConfig';

/**
 * A constraint that limits the maximum acceleration.
 */
export class MaxAccelerationConstraint implements TrajectoryConstraint {
  private readonly m_maxAccelerationMetersPerSecondSq: number;

  /**
   * Constructs a new MaxAccelerationConstraint.
   *
   * @param maxAccelerationMetersPerSecondSq The maximum acceleration.
   */
  constructor(maxAccelerationMetersPerSecondSq: number) {
    this.m_maxAccelerationMetersPerSecondSq = maxAccelerationMetersPerSecondSq;
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
    return Infinity;
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
    return new MinMax(-this.m_maxAccelerationMetersPerSecondSq, this.m_maxAccelerationMetersPerSecondSq);
  }
}
