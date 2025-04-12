import { Twist2d } from '../geometry/Twist2d';

/**
 * Helper class that converts a chassis velocity (dx, dy, and dtheta components) into individual
 * wheel speeds. Robot code should not use this directly- Instead, use the particular type for
 * your drivetrain (e.g., DifferentialDriveKinematics).
 *
 * Inverse kinematics converts a desired chassis speed into wheel speeds whereas
 * forward kinematics converts wheel speeds into a chassis speed.
 *
 * @param WheelSpeeds Wheel speeds type.
 * @param WheelPositions Wheel positions type.
 */
export abstract class Kinematics<WheelSpeeds, WheelPositions> {
  /**
   * Creates a deep copy of the provided wheel positions.
   *
   * @param wheelPositions The wheel positions to copy.
   * @return A deep copy of the provided wheel positions.
   */
  public abstract copy(wheelPositions: WheelPositions): WheelPositions;

  /**
   * Copies the provided wheel positions into the destination wheel positions.
   *
   * @param wheelPositions The wheel positions to copy.
   * @param destinationWheelPositions The wheel positions to copy into.
   */
  public abstract copyInto(wheelPositions: WheelPositions, destinationWheelPositions: WheelPositions): void;

  /**
   * Performs forward kinematics to return the resulting Twist2d from the given wheel deltas.
   * This method is often used for odometry -- determining the robot's position on the field
   * using changes in the distance driven by each wheel on the robot.
   *
   * @param start The previous wheel positions.
   * @param end The current wheel positions.
   * @return The resulting Twist2d.
   */
  public abstract toTwist2d(start: WheelPositions, end: WheelPositions): Twist2d;

  /**
   * Performs inverse kinematics to return the wheel speeds from a desired chassis velocity.
   * This method is often used to convert joystick values into wheel speeds.
   *
   * @param chassisSpeeds The desired chassis speed.
   * @return The wheel speeds.
   */
  public abstract toWheelSpeeds(chassisSpeeds: any): WheelSpeeds;

  /**
   * Performs forward kinematics to return the resulting chassis speed from the given wheel speeds.
   * This method is often used for odometry -- determining the robot's position on the field using
   * data from the real-world speed of each wheel on the robot.
   *
   * @param wheelSpeeds The wheel speeds.
   * @return The resulting chassis speed.
   */
  public abstract toChassisSpeeds(wheelSpeeds: WheelSpeeds): any;

  /**
   * Interpolates between two wheel positions.
   *
   * @param start The start wheel positions.
   * @param end The end wheel positions.
   * @param t The interpolation parameter, in [0, 1].
   * @return The interpolated wheel positions.
   */
  public abstract interpolate(start: WheelPositions, end: WheelPositions, t: number): WheelPositions;
}
