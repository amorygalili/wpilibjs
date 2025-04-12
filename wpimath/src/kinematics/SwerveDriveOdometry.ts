import { Pose2d } from '../geometry/Pose2d';
import { Rotation2d } from '../geometry/Rotation2d';
import { MathSharedStore } from '../MathSharedStore';
import { MathUsageId } from '../MathUsageId';
import { Odometry } from './Odometry';
import { SwerveDriveKinematics } from './SwerveDriveKinematics';
import { SwerveModulePosition } from './SwerveModulePosition';

/**
 * Class for swerve drive odometry. Odometry allows you to track the robot's position on the field
 * over a course of a match using readings from your swerve drive encoders and swerve azimuth
 * encoders.
 *
 * <p>Teams can use odometry during the autonomous period for complex tasks like path following.
 * Furthermore, odometry can be used for latency compensation when using computer-vision systems.
 */
export class SwerveDriveOdometry extends Odometry<SwerveModulePosition[]> {
  private readonly m_numModules: number;

  /**
   * Constructs a SwerveDriveOdometry object.
   *
   * @param kinematics The swerve drive kinematics for your drivetrain.
   * @param gyroAngle The angle reported by the gyroscope.
   * @param modulePositions The wheel positions reported by each module.
   * @param initialPose The starting position of the robot on the field.
   */
  constructor(
    kinematics: SwerveDriveKinematics,
    gyroAngle: Rotation2d,
    modulePositions: SwerveModulePosition[],
    initialPose: Pose2d = new Pose2d()
  ) {
    super(kinematics, gyroAngle, modulePositions, initialPose);

    this.m_numModules = modulePositions.length;

    MathSharedStore.reportUsage(MathUsageId.kOdometry_SwerveDrive, 1);
  }

  /**
   * Resets the robot's position on the field.
   *
   * <p>The gyroscope angle does not need to be reset here on the user's robot code. The library
   * automatically takes care of offsetting the gyro angle.
   *
   * @param gyroAngle The angle reported by the gyroscope.
   * @param modulePositions The wheel positions reported by each module.
   * @param pose The position on the field that your robot is at.
   */
  public resetPosition(
    gyroAngle: Rotation2d,
    modulePositions: SwerveModulePosition[],
    pose: Pose2d
  ): void {
    if (modulePositions.length !== this.m_numModules) {
      throw new Error(
        "Number of modules is not consistent with number of wheel locations provided in constructor"
      );
    }
    super.resetPosition(gyroAngle, modulePositions, pose);
  }

  /**
   * Updates the robot's position on the field using forward kinematics and integration of the pose
   * over time. This method takes in the current gyroscope angle and wheel positions. The wheel
   * positions are used for forward kinematics to determine the change in robot pose over time.
   *
   * @param gyroAngle The angle reported by the gyroscope.
   * @param modulePositions The wheel positions reported by each module.
   * @return The new pose of the robot.
   */
  public update(gyroAngle: Rotation2d, modulePositions: SwerveModulePosition[]): Pose2d {
    if (modulePositions.length !== this.m_numModules) {
      throw new Error(
        "Number of modules is not consistent with number of wheel locations provided in constructor"
      );
    }
    return super.update(gyroAngle, modulePositions);
  }
}
