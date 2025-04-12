import { Pose2d } from '../geometry/Pose2d';
import { Rotation2d } from '../geometry/Rotation2d';
import { MathSharedStore } from '../MathSharedStore';
import { MathUsageId } from '../MathUsageId';
import { DifferentialDriveKinematics } from './DifferentialDriveKinematics';
import { DifferentialDriveWheelPositions } from './DifferentialDriveWheelPositions';
import { Odometry } from './Odometry';

/**
 * Class for differential drive odometry. Odometry allows you to track the robot's position on the
 * field over the course of a match using readings from 2 encoders and a gyroscope.
 *
 * Teams can use odometry during the autonomous period for complex tasks like path following.
 * Furthermore, odometry can be used for latency compensation when using computer-vision systems.
 *
 * It is important that you reset your encoders to zero before using this class. Any subsequent
 * pose resets also require the encoders to be reset to zero.
 */
export class DifferentialDriveOdometry extends Odometry<DifferentialDriveWheelPositions> {
  private readonly m_diffKinematics: DifferentialDriveKinematics;

  /**
   * Constructs a DifferentialDriveOdometry object.
   *
   * @param gyroAngle The angle reported by the gyroscope.
   * @param leftDistanceMeters The distance traveled by the left encoder.
   * @param rightDistanceMeters The distance traveled by the right encoder.
   * @param initialPoseMeters The starting position of the robot on the field.
   */
  constructor(
    gyroAngle: Rotation2d,
    leftDistanceMeters: number = 0,
    rightDistanceMeters: number = 0,
    initialPoseMeters: Pose2d = new Pose2d()
  ) {
    // The kinematics trackwidth doesn't matter for odometry, so we use a placeholder value of 1
    const kinematics = new DifferentialDriveKinematics(1);
    super(
      kinematics,
      gyroAngle,
      new DifferentialDriveWheelPositions(leftDistanceMeters, rightDistanceMeters),
      initialPoseMeters
    );
    this.m_diffKinematics = kinematics;
    MathSharedStore.reportUsage(MathUsageId.kOdometry_DifferentialDrive, 1);
  }

  /**
   * Resets the robot's position on the field.
   *
   * The gyroscope angle does not need to be reset here on the user's robot code. The library
   * automatically takes care of offsetting the gyro angle.
   *
   * @param gyroAngle The angle reported by the gyroscope.
   * @param wheelPositions The wheel positions.
   * @param poseMeters The position on the field that your robot is at.
   */
  public resetPosition(
    gyroAngle: Rotation2d,
    wheelPositions: DifferentialDriveWheelPositions,
    poseMeters: Pose2d
  ): void {
    super.resetPosition(gyroAngle, wheelPositions, poseMeters);
  }

  /**
   * Resets the robot's position on the field.
   *
   * The gyroscope angle does not need to be reset here on the user's robot code. The library
   * automatically takes care of offsetting the gyro angle.
   *
   * @param gyroAngle The angle reported by the gyroscope.
   * @param leftDistanceMeters The distance traveled by the left encoder.
   * @param rightDistanceMeters The distance traveled by the right encoder.
   * @param poseMeters The position on the field that your robot is at.
   */
  public resetPositionWithDistances(
    gyroAngle: Rotation2d,
    leftDistanceMeters: number,
    rightDistanceMeters: number,
    poseMeters: Pose2d
  ): void {
    this.resetPosition(
      gyroAngle,
      new DifferentialDriveWheelPositions(leftDistanceMeters, rightDistanceMeters),
      poseMeters
    );
  }

  /**
   * Updates the robot position on the field using distance measurements from encoders. This method
   * is more numerically accurate than using velocities to integrate the pose and is also
   * advantageous for teams that are using lower CPR encoders.
   *
   * @param gyroAngle The angle reported by the gyroscope.
   * @param wheelPositions The wheel positions.
   * @return The new pose of the robot.
   */
  public update(
    gyroAngle: Rotation2d,
    wheelPositions: DifferentialDriveWheelPositions
  ): Pose2d {
    return super.update(gyroAngle, wheelPositions);
  }

  /**
   * Updates the robot position on the field using distance measurements from encoders. This method
   * is more numerically accurate than using velocities to integrate the pose and is also
   * advantageous for teams that are using lower CPR encoders.
   *
   * @param gyroAngle The angle reported by the gyroscope.
   * @param leftDistanceMeters The distance traveled by the left encoder.
   * @param rightDistanceMeters The distance traveled by the right encoder.
   * @return The new pose of the robot.
   */
  public updateWithDistances(
    gyroAngle: Rotation2d,
    leftDistanceMeters: number,
    rightDistanceMeters: number
  ): Pose2d {
    return this.update(
      gyroAngle,
      new DifferentialDriveWheelPositions(leftDistanceMeters, rightDistanceMeters)
    );
  }
}
