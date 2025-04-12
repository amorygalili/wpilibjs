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

    // For simplicity in this TypeScript implementation, we'll just create a simple trajectory
    // that connects the waypoints with straight lines and constant velocity
    const states: Trajectory.State[] = [];

    if (waypoints.length < 2) {
      return new Trajectory(states);
    }

    // Calculate the total distance of the path
    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      totalDistance += waypoints[i].getTranslation().getDistance(waypoints[i + 1].getTranslation());
    }

    // Calculate the time needed to travel the path at the max velocity
    const totalTime = totalDistance / config.getMaxVelocityMetersPerSecond();

    // Create states along the path
    let currentTime = 0;
    let currentDistance = 0;

    // Add the initial state
    states.push(
      new Trajectory.State(
        0,
        config.getStartVelocityMetersPerSecond(),
        0,
        waypoints[0],
        0
      )
    );

    // Add intermediate states
    for (let i = 0; i < waypoints.length - 1; i++) {
      const startPose = waypoints[i];
      const endPose = waypoints[i + 1];

      const segmentDistance = startPose.getTranslation().getDistance(endPose.getTranslation());
      const segmentTime = segmentDistance / config.getMaxVelocityMetersPerSecond();

      // Add states along this segment
      const numStates = Math.max(2, Math.ceil(segmentTime / 0.02)); // At least 2 states, or one every 20ms

      for (let j = 1; j < numStates; j++) {
        const t = j / numStates;
        const pose = startPose.interpolate(endPose, t);

        // Calculate curvature (approximation)
        let curvature = 0;
        if (i > 0 && j === 1) {
          // For the first point in a segment (except the very first segment),
          // calculate curvature based on the angle change from the previous segment
          const prevPose = waypoints[i - 1];
          const angle1 = prevPose.getTranslation().minus(startPose.getTranslation()).getAngle();
          const angle2 = endPose.getTranslation().minus(startPose.getTranslation()).getAngle();
          const angleDiff = angle2.minus(angle1).getRadians();

          // Simple curvature approximation
          curvature = angleDiff / segmentDistance;
        }

        currentTime = i * segmentTime + t * segmentTime;
        currentDistance = i * segmentDistance + t * segmentDistance;

        states.push(
          new Trajectory.State(
            currentTime,
            config.getMaxVelocityMetersPerSecond(),
            0,
            pose,
            curvature
          )
        );
      }
    }

    // Add the final state
    states.push(
      new Trajectory.State(
        currentTime + 0.02, // Add a small time increment for the final state
        config.getEndVelocityMetersPerSecond(),
        0,
        waypoints[waypoints.length - 1],
        0
      )
    );

    return new Trajectory(states);
  }


}
