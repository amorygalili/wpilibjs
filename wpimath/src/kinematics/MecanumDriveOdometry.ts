import { Pose2d } from '../geometry/Pose2d';
import { Rotation2d } from '../geometry/Rotation2d';
import { MathSharedStore } from '../MathSharedStore';
import { MathUsageId } from '../MathUsageId';
import { MecanumDriveKinematics } from './MecanumDriveKinematics';
import { MecanumDriveWheelPositions } from './MecanumDriveWheelPositions';
import { Odometry } from './Odometry';

/**
 * Class for mecanum drive odometry. Odometry allows you to track the robot's position on the field
 * over a course of a match using readings from your mecanum wheel encoders.
 *
 * <p>Teams can use odometry during the autonomous period for complex tasks like path following.
 * Furthermore, odometry can be used for latency compensation when using computer-vision systems.
 */
export class MecanumDriveOdometry extends Odometry<MecanumDriveWheelPositions> {
  private readonly m_mecanumKinematics: MecanumDriveKinematics;

  /**
   * Constructs a MecanumDriveOdometry object.
   *
   * @param kinematics The mecanum drive kinematics for your drivetrain.
   * @param gyroAngle The angle reported by the gyroscope.
   * @param wheelPositions The distances driven by each wheel.
   * @param initialPoseMeters The starting position of the robot on the field.
   */
  constructor(
    kinematics: MecanumDriveKinematics,
    gyroAngle: Rotation2d,
    wheelPositions: MecanumDriveWheelPositions,
    initialPoseMeters: Pose2d = new Pose2d()
  ) {
    super(kinematics, gyroAngle, wheelPositions, initialPoseMeters);
    this.m_mecanumKinematics = kinematics;
    MathSharedStore.reportUsage(MathUsageId.kOdometry_MecanumDrive, 1);
  }

  /**
   * Constructs a MecanumDriveOdometry object with the default pose at the origin.
   *
   * @param kinematics The mecanum drive kinematics for your drivetrain.
   * @param gyroAngle The angle reported by the gyroscope.
   * @param initialWheelPositionsOrFrontLeftDistanceMeters The initial distances driven by each wheel or the front-left wheel distance.
   * @param frontRightDistanceMeters The distance traveled by the front-right wheel (optional).
   * @param rearLeftDistanceMeters The distance traveled by the rear-left wheel (optional).
   * @param rearRightDistanceMeters The distance traveled by the rear-right wheel (optional).
   */
  public static fromWheelDistances(
    kinematics: MecanumDriveKinematics,
    gyroAngle: Rotation2d,
    initialWheelPositionsOrFrontLeftDistanceMeters: MecanumDriveWheelPositions | number,
    frontRightDistanceMeters?: number,
    rearLeftDistanceMeters?: number,
    rearRightDistanceMeters?: number
  ): MecanumDriveOdometry {
    if (initialWheelPositionsOrFrontLeftDistanceMeters instanceof MecanumDriveWheelPositions) {
      return new MecanumDriveOdometry(kinematics, gyroAngle, initialWheelPositionsOrFrontLeftDistanceMeters);
    } else {
      return new MecanumDriveOdometry(
        kinematics,
        gyroAngle,
        new MecanumDriveWheelPositions(
          initialWheelPositionsOrFrontLeftDistanceMeters,
          frontRightDistanceMeters!,
          rearLeftDistanceMeters!,
          rearRightDistanceMeters!
        )
      );
    }
  }

  /**
   * Resets the robot's position on the field.
   *
   * @param gyroAngle The angle reported by the gyroscope.
   * @param wheelPositions The distances driven by each wheel.
   * @param poseMeters The position on the field that your robot is at.
   */
  public resetPosition(
    gyroAngle: Rotation2d,
    wheelPositions: MecanumDriveWheelPositions,
    poseMeters: Pose2d
  ): void {
    super.resetPosition(gyroAngle, wheelPositions, poseMeters);
  }

  /**
   * Resets the robot's position on the field.
   *
   * @param gyroAngle The angle reported by the gyroscope.
   * @param frontLeftDistanceMeters The distance traveled by the front-left wheel.
   * @param frontRightDistanceMeters The distance traveled by the front-right wheel.
   * @param rearLeftDistanceMeters The distance traveled by the rear-left wheel.
   * @param rearRightDistanceMeters The distance traveled by the rear-right wheel.
   * @param poseMeters The position on the field that your robot is at.
   */
  public resetPositionWithDistances(
    gyroAngle: Rotation2d,
    frontLeftDistanceMeters: number,
    frontRightDistanceMeters: number,
    rearLeftDistanceMeters: number,
    rearRightDistanceMeters: number,
    poseMeters: Pose2d
  ): void {
    this.resetPosition(
      gyroAngle,
      new MecanumDriveWheelPositions(
        frontLeftDistanceMeters,
        frontRightDistanceMeters,
        rearLeftDistanceMeters,
        rearRightDistanceMeters
      ),
      poseMeters
    );
  }

  /**
   * Updates the robot's position on the field using forward kinematics and integration of the pose
   * over time. This method takes in the current gyroscope angle and wheel distances.
   *
   * @param gyroAngle The angle reported by the gyroscope.
   * @param wheelPositions The distances driven by each wheel.
   * @return The new pose of the robot.
   */
  public update(
    gyroAngle: Rotation2d,
    wheelPositions: MecanumDriveWheelPositions
  ): Pose2d {
    return super.update(gyroAngle, wheelPositions);
  }

  /**
   * Updates the robot's position on the field using forward kinematics and integration of the pose
   * over time. This method takes in the current gyroscope angle and wheel distances.
   *
   * @param gyroAngle The angle reported by the gyroscope.
   * @param frontLeftDistanceMeters The distance traveled by the front-left wheel.
   * @param frontRightDistanceMeters The distance traveled by the front-right wheel.
   * @param rearLeftDistanceMeters The distance traveled by the rear-left wheel.
   * @param rearRightDistanceMeters The distance traveled by the rear-right wheel.
   * @return The new pose of the robot.
   */
  public updateWithDistances(
    gyroAngle: Rotation2d,
    frontLeftDistanceMeters: number,
    frontRightDistanceMeters: number,
    rearLeftDistanceMeters: number,
    rearRightDistanceMeters: number
  ): Pose2d {
    return this.update(
      gyroAngle,
      new MecanumDriveWheelPositions(
        frontLeftDistanceMeters,
        frontRightDistanceMeters,
        rearLeftDistanceMeters,
        rearRightDistanceMeters
      )
    );
  }
}
