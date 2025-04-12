import { ChassisSpeeds } from './ChassisSpeeds';
import { DifferentialDriveWheelSpeeds } from './DifferentialDriveWheelSpeeds';
import { DifferentialDriveWheelPositions } from './DifferentialDriveWheelPositions';
import { Kinematics } from './Kinematics';
import { Twist2d } from '../geometry/Twist2d';

/**
 * Helper class that converts a chassis velocity (dx, dy, dtheta) to left and right wheel velocities
 * for a differential drive.
 *
 * Inverse kinematics converts a desired chassis velocity into left and right wheel velocities.
 *
 * Forward kinematics converts left and right wheel velocities into a chassis velocity.
 */
export class DifferentialDriveKinematics extends Kinematics<DifferentialDriveWheelSpeeds, DifferentialDriveWheelPositions> {
  /** The track width in meters. */
  private m_trackWidthMeters: number;

  /**
   * Constructs a differential drive kinematics object.
   *
   * @param trackWidthMeters The track width of the drivetrain. Theoretically, this is the distance
   *                         between the left wheels and right wheels. However, the empirical value
   *                         may be larger than the physical measured value due to scrubbing effects.
   */
  constructor(trackWidthMeters: number) {
    super();
    this.m_trackWidthMeters = trackWidthMeters;
  }

  /**
   * Returns the track width.
   *
   * @return The track width in meters.
   */
  public getTrackWidthMeters(): number {
    return this.m_trackWidthMeters;
  }

  /**
   * Performs inverse kinematics to return the wheel speeds from a desired chassis velocity. This
   * method is often used to convert joystick values into wheel speeds.
   *
   * <p>This function also supports inverse kinematics for a differential drive robot moving with
   * a non-zero lateral velocity. However, most teams don't use this functionality.
   *
   * @param chassisSpeeds The desired chassis speed.
   * @return The left and right wheel speeds.
   */
  public toWheelSpeeds(chassisSpeeds: ChassisSpeeds): DifferentialDriveWheelSpeeds {
    return new DifferentialDriveWheelSpeeds(
      chassisSpeeds.vxMetersPerSecond - chassisSpeeds.omegaRadiansPerSecond * this.m_trackWidthMeters / 2,
      chassisSpeeds.vxMetersPerSecond + chassisSpeeds.omegaRadiansPerSecond * this.m_trackWidthMeters / 2
    );
  }

  /**
   * Performs forward kinematics to return the resulting chassis state from the given wheel speeds.
   * This method is often used for odometry -- determining the robot's position on the field using
   * data from the real-world speed of each wheel on the robot.
   *
   * @param wheelSpeeds The left and right wheel speeds.
   * @return The resulting chassis speed.
   */
  public toChassisSpeeds(wheelSpeeds: DifferentialDriveWheelSpeeds): ChassisSpeeds;

  /**
   * Performs forward kinematics to return the resulting chassis state from the given wheel speeds.
   * This method is often used for odometry -- determining the robot's position on the field using
   * data from the real-world speed of each wheel on the robot.
   *
   * @param leftMetersPerSecond The speed of the left side of the robot.
   * @param rightMetersPerSecond The speed of the right side of the robot.
   * @return The resulting chassis speed.
   */
  public toChassisSpeeds(leftMetersPerSecond: number, rightMetersPerSecond: number): ChassisSpeeds;

  /**
   * Performs forward kinematics to return the resulting chassis state from the given wheel speeds.
   * This method is often used for odometry -- determining the robot's position on the field using
   * data from the real-world speed of each wheel on the robot.
   *
   * @param wheelSpeedsOrLeft The left and right wheel speeds or the left wheel speed.
   * @param right The right wheel speed (optional).
   * @return The resulting chassis speed.
   */
  public toChassisSpeeds(wheelSpeedsOrLeft: DifferentialDriveWheelSpeeds | number, right?: number): ChassisSpeeds {
    if (typeof wheelSpeedsOrLeft === 'number' && right !== undefined) {
      // Handle the case where we're given left and right wheel speeds directly
      return new ChassisSpeeds(
        (wheelSpeedsOrLeft + right) / 2,
        0,
        (right - wheelSpeedsOrLeft) / this.m_trackWidthMeters
      );
    } else if (wheelSpeedsOrLeft instanceof DifferentialDriveWheelSpeeds) {
      // Handle the case where we're given a DifferentialDriveWheelSpeeds object
      return new ChassisSpeeds(
        (wheelSpeedsOrLeft.leftMetersPerSecond + wheelSpeedsOrLeft.rightMetersPerSecond) / 2,
        0,
        (wheelSpeedsOrLeft.rightMetersPerSecond - wheelSpeedsOrLeft.leftMetersPerSecond) / this.m_trackWidthMeters
      );
    } else {
      throw new Error('Invalid arguments to toChassisSpeeds');
    }
  }

  /**
   * Performs forward kinematics to return the resulting Twist2d from the given wheel deltas.
   * This method is often used for odometry -- determining the robot's position on the field using
   * changes in the distance driven by each wheel on the robot.
   *
   * @param start The previous wheel positions.
   * @param end The current wheel positions.
   * @return The resulting Twist2d.
   */
  public toTwist2d(start: DifferentialDriveWheelPositions, end: DifferentialDriveWheelPositions): Twist2d {
    const leftDelta = end.leftMeters - start.leftMeters;
    const rightDelta = end.rightMeters - start.rightMeters;

    return new Twist2d(
      (leftDelta + rightDelta) / 2,
      0,
      (rightDelta - leftDelta) / this.m_trackWidthMeters
    );
  }

  /**
   * Creates a deep copy of the provided wheel positions.
   *
   * @param wheelPositions The wheel positions to copy.
   * @return A deep copy of the provided wheel positions.
   */
  public copy(wheelPositions: DifferentialDriveWheelPositions): DifferentialDriveWheelPositions {
    return new DifferentialDriveWheelPositions(wheelPositions.leftMeters, wheelPositions.rightMeters);
  }

  /**
   * Copies the provided wheel positions into the destination wheel positions.
   *
   * @param wheelPositions The wheel positions to copy.
   * @param destinationWheelPositions The wheel positions to copy into.
   */
  public copyInto(wheelPositions: DifferentialDriveWheelPositions, destinationWheelPositions: DifferentialDriveWheelPositions): void {
    destinationWheelPositions.leftMeters = wheelPositions.leftMeters;
    destinationWheelPositions.rightMeters = wheelPositions.rightMeters;
  }

  /**
   * Interpolates between two wheel positions.
   *
   * @param start The start wheel positions.
   * @param end The end wheel positions.
   * @param t The interpolation parameter, in [0, 1].
   * @return The interpolated wheel positions.
   */
  public interpolate(start: DifferentialDriveWheelPositions, end: DifferentialDriveWheelPositions, t: number): DifferentialDriveWheelPositions {
    return start.interpolate(end, t);
  }
}
