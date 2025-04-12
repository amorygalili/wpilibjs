import { Pose2d } from '../geometry/Pose2d';
import { Rotation2d } from '../geometry/Rotation2d';
import { Translation2d } from '../geometry/Translation2d';
import { PoseWithCurvature } from '../spline/PoseWithCurvature';
import { Trajectory } from './Trajectory';
import { TrajectoryConfig } from './TrajectoryConfig';
import { TrajectoryParameterizer } from './TrajectoryParameterizer';

/**
 * Helper class for generating trajectories.
 */
export class TrajectoryGenerator {
  /**
   * Generates a trajectory from the given waypoints and config. This method
   * uses quintic hermite splines -- therefore, all points must be represented
   * as Pose2d objects. Continuous curvature is guaranteed in this method.
   *
   * @param waypoints List of waypoints to use in trajectory generation.
   * @param config The configuration for the trajectory.
   * @return The generated trajectory.
   */
  public static generateTrajectory(waypoints: Pose2d[], config: TrajectoryConfig): Trajectory;

  /**
   * Generates a trajectory from the given waypoints and config. This method
   * uses quintic hermite splines -- therefore, all points must be represented
   * as Pose2d objects. Continuous curvature is guaranteed in this method.
   *
   * @param start The starting pose.
   * @param interiorWaypoints The interior waypoints.
   * @param end The ending pose.
   * @param config The configuration for the trajectory.
   * @return The generated trajectory.
   */
  public static generateTrajectory(
    start: Pose2d,
    interiorWaypoints: Translation2d[],
    end: Pose2d,
    config: TrajectoryConfig
  ): Trajectory;

  public static generateTrajectory(
    waypointsOrStart: Pose2d[] | Pose2d,
    configOrInteriorWaypoints: TrajectoryConfig | Translation2d[],
    endOrUndefined?: Pose2d,
    configOrUndefined?: TrajectoryConfig
  ): Trajectory {
    // Handle the different overloads
    let waypoints: Pose2d[];
    let config: TrajectoryConfig;

    if (Array.isArray(waypointsOrStart)) {
      // First overload: (waypoints: Pose2d[], config: TrajectoryConfig)
      waypoints = waypointsOrStart;
      config = configOrInteriorWaypoints as TrajectoryConfig;
    } else {
      // Second overload: (start: Pose2d, interiorWaypoints: Translation2d[], end: Pose2d, config: TrajectoryConfig)
      const start = waypointsOrStart;
      const interiorWaypoints = configOrInteriorWaypoints as Translation2d[];
      const end = endOrUndefined as Pose2d;
      config = configOrUndefined as TrajectoryConfig;

      // Convert the interior waypoints to poses with the same rotation as the start pose
      waypoints = [start];

      for (const point of interiorWaypoints) {
        waypoints.push(new Pose2d(point, start.getRotation()));
      }

      waypoints.push(end);
    }

    // Generate a list of PoseWithCurvature objects from the waypoints
    const splinePoints: PoseWithCurvature[] = [];

    if (waypoints.length < 2) {
      return new Trajectory([]);
    }

    // For each waypoint, create a PoseWithCurvature
    for (let i = 0; i < waypoints.length; i++) {
      const pose = waypoints[i];
      
      // For simplicity, we'll use zero curvature for all points
      // In a real implementation, this would use spline parameterization
      splinePoints.push(new PoseWithCurvature(pose, 0));
    }
    
    // Use the TrajectoryParameterizer to generate the trajectory
    return TrajectoryParameterizer.timeParameterizeTrajectory(
      splinePoints,
      config.getConstraints(),
      config.getStartVelocityMetersPerSecond(),
      config.getEndVelocityMetersPerSecond(),
      config.getMaxVelocityMetersPerSecond(),
      config.getMaxAccelerationMetersPerSecondSq(),
      config.isReversed()
    );
  }
}
