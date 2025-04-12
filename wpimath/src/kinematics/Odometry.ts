import { Pose2d } from '../geometry/Pose2d';
import { Rotation2d } from '../geometry/Rotation2d';
import { Translation2d } from '../geometry/Translation2d';
import { Kinematics } from './Kinematics';

/**
 * Class for odometry. Robot code should not use this directly- Instead, use the particular type for
 * your drivetrain (e.g., DifferentialDriveOdometry). Odometry allows you to track the
 * robot's position on the field over the course of a match using readings from encoders and a
 * gyroscope.
 *
 * Teams can use odometry during the autonomous period for complex tasks like path following.
 * Furthermore, odometry can be used for latency compensation when using computer-vision systems.
 *
 * @param T Wheel positions type.
 */
export class Odometry<T> {
  private readonly m_kinematics: Kinematics<any, T>;
  private m_poseMeters: Pose2d;

  private m_gyroOffset: Rotation2d;
  private m_previousAngle: Rotation2d;
  private readonly m_previousWheelPositions: T;

  /**
   * Constructs an Odometry object.
   *
   * @param kinematics The kinematics of the drivebase.
   * @param gyroAngle The angle reported by the gyroscope.
   * @param wheelPositions The current encoder readings.
   * @param initialPoseMeters The starting position of the robot on the field.
   */
  constructor(
    kinematics: Kinematics<any, T>,
    gyroAngle: Rotation2d,
    wheelPositions: T,
    initialPoseMeters: Pose2d = new Pose2d()
  ) {
    this.m_kinematics = kinematics;
    this.m_poseMeters = initialPoseMeters;
    this.m_gyroOffset = this.m_poseMeters.getRotation().minus(gyroAngle);
    this.m_previousAngle = this.m_poseMeters.getRotation();
    this.m_previousWheelPositions = this.m_kinematics.copy(wheelPositions);
  }

  /**
   * Resets the robot's position on the field.
   *
   * The gyroscope angle does not need to be reset here on the user's robot code. The library
   * automatically takes care of offsetting the gyro angle.
   *
   * @param gyroAngle The angle reported by the gyroscope.
   * @param wheelPositions The current encoder readings.
   * @param poseMeters The position on the field that your robot is at.
   */
  public resetPosition(gyroAngle: Rotation2d, wheelPositions: T, poseMeters: Pose2d): void {
    this.m_poseMeters = poseMeters;
    this.m_previousAngle = this.m_poseMeters.getRotation();
    this.m_gyroOffset = this.m_poseMeters.getRotation().minus(gyroAngle);
    this.m_kinematics.copyInto(wheelPositions, this.m_previousWheelPositions);
  }

  /**
   * Resets the pose.
   *
   * @param poseMeters The pose to reset to.
   */
  public resetPose(poseMeters: Pose2d): void {
    this.m_gyroOffset = this.m_gyroOffset.plus(poseMeters.getRotation().minus(this.m_poseMeters.getRotation()));
    this.m_poseMeters = poseMeters;
    this.m_previousAngle = this.m_poseMeters.getRotation();
  }

  /**
   * Resets the translation of the pose.
   *
   * @param translation The translation to reset to.
   */
  public resetTranslation(translation: Translation2d): void {
    this.m_poseMeters = new Pose2d(translation, this.m_poseMeters.getRotation());
  }

  /**
   * Resets the rotation of the pose.
   *
   * @param rotation The rotation to reset to.
   */
  public resetRotation(rotation: Rotation2d): void {
    this.m_gyroOffset = this.m_gyroOffset.plus(rotation.minus(this.m_poseMeters.getRotation()));
    this.m_poseMeters = new Pose2d(this.m_poseMeters.getTranslation(), rotation);
    this.m_previousAngle = this.m_poseMeters.getRotation();
  }

  /**
   * Returns the position of the robot on the field.
   *
   * @return The pose of the robot (x and y are in meters).
   */
  public getPoseMeters(): Pose2d {
    return this.m_poseMeters;
  }

  /**
   * Updates the robot's position on the field using forward kinematics and integration of the pose
   * over time. This method takes in an angle parameter which is used instead of the angular rate
   * that is calculated from forward kinematics, in addition to the current distance measurement at
   * each wheel.
   *
   * @param gyroAngle The angle reported by the gyroscope.
   * @param wheelPositions The current encoder readings.
   * @return The new pose of the robot.
   */
  public update(gyroAngle: Rotation2d, wheelPositions: T): Pose2d {
    const angle = gyroAngle.plus(this.m_gyroOffset);

    const twist = this.m_kinematics.toTwist2d(this.m_previousWheelPositions, wheelPositions);
    twist.dtheta = angle.minus(this.m_previousAngle).getRadians();

    const newPose = this.m_poseMeters.exp(twist);

    this.m_previousAngle = angle;
    this.m_kinematics.copyInto(wheelPositions, this.m_previousWheelPositions);
    this.m_poseMeters = new Pose2d(newPose.getTranslation(), angle);

    return this.m_poseMeters;
  }
}
