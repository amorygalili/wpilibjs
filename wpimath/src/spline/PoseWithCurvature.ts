import { Pose2d } from '../geometry/Pose2d';

/**
 * Represents a pair of a pose and a curvature.
 */
export class PoseWithCurvature {
  /**
   * Represents the pose.
   */
  public poseMeters: Pose2d;

  /**
   * Represents the curvature.
   */
  public curvatureRadPerMeter: number;

  /**
   * Constructs a PoseWithCurvature.
   *
   * @param poseMeters The pose.
   * @param curvatureRadPerMeter The curvature.
   */
  constructor(poseMeters: Pose2d, curvatureRadPerMeter: number) {
    this.poseMeters = poseMeters;
    this.curvatureRadPerMeter = curvatureRadPerMeter;
  }

  /**
   * Constructs a PoseWithCurvature with default values.
   */
  public static kZero = new PoseWithCurvature(Pose2d.kZero, 0);
}
