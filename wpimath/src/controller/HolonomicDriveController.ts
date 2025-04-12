import { Pose2d } from '../geometry/Pose2d';
import { Rotation2d } from '../geometry/Rotation2d';
import { ChassisSpeeds } from '../kinematics/ChassisSpeeds';
import { Trajectory } from '../trajectory/Trajectory';
import { MathUtil } from '../MathUtil';
import { PIDController } from './PIDController';
import { ProfiledPIDController } from './ProfiledPIDController';

/**
 * This holonomic drive controller can be used to follow trajectories using a holonomic drivetrain
 * (i.e. swerve or mecanum). Holonomic trajectory following is a much simpler problem to solve
 * compared to skid-steer style drivetrains because it is possible to individually control forward,
 * sideways, and angular velocity.
 *
 * The holonomic drive controller takes in one PID controller for each direction, forward and
 * sideways, and one profiled PID controller for the angular direction. Because the heading dynamics
 * are decoupled from translations, users can specify a custom heading that the drivetrain should
 * point toward. This heading reference is profiled for smoothness.
 */
export class HolonomicDriveController {
  private m_poseError = Pose2d.kZero;
  private m_rotationError = Rotation2d.kZero;
  private m_poseTolerance = Pose2d.kZero;
  private m_enabled = true;

  private m_xController: PIDController;
  private m_yController: PIDController;
  private m_thetaController: ProfiledPIDController;

  private m_firstRun = true;

  /**
   * Constructs a holonomic drive controller.
   *
   * @param xController A PID Controller to respond to error in the field-relative x direction.
   * @param yController A PID Controller to respond to error in the field-relative y direction.
   * @param thetaController A profiled PID controller to respond to error in angle.
   */
  constructor(
    xController: PIDController,
    yController: PIDController,
    thetaController: ProfiledPIDController
  ) {
    this.m_xController = xController;
    this.m_yController = yController;
    this.m_thetaController = thetaController;
    this.m_thetaController.enableContinuousInput(0, 2 * Math.PI);
  }

  /**
   * Returns true if the pose error is within tolerance of the reference.
   *
   * @return True if the pose error is within tolerance of the reference.
   */
  public atReference(): boolean {
    const eTranslate = this.m_poseError.getTranslation();
    const eRotate = this.m_rotationError;
    const tolTranslate = this.m_poseTolerance.getTranslation();
    const tolRotate = this.m_poseTolerance.getRotation();

    return (
      Math.abs(eTranslate.getX()) < tolTranslate.getX() &&
      Math.abs(eTranslate.getY()) < tolTranslate.getY() &&
      Math.abs(eRotate.getRadians()) < tolRotate.getRadians()
    );
  }

  /**
   * Sets the pose error which is considered tolerable for use with atReference().
   *
   * @param poseTolerance Pose error which is tolerable.
   */
  public setTolerance(poseTolerance: Pose2d): void {
    this.m_poseTolerance = poseTolerance;
  }

  /**
   * Returns the next output of the holonomic drive controller.
   *
   * @param currentPose The current pose, as measured by odometry or pose estimator.
   * @param trajectoryPose The desired trajectory pose, as sampled for the current timestep.
   * @param desiredLinearVelocityMetersPerSecond The desired linear velocity.
   * @param desiredHeading The desired heading.
   * @return The next output of the holonomic drive controller.
   */
  public calculate(
    currentPose: Pose2d,
    trajectoryPose: Pose2d,
    desiredLinearVelocityMetersPerSecond: number,
    desiredHeading: Rotation2d
  ): ChassisSpeeds {
    // If this is the first run, then we need to reset the theta controller to the current pose's
    // heading.
    if (this.m_firstRun) {
      this.m_thetaController.reset(currentPose.getRotation().getRadians());
      this.m_firstRun = false;
    }

    // Calculate feedforward velocities (field-relative).
    const xFF = desiredLinearVelocityMetersPerSecond * trajectoryPose.getRotation().getCos();
    const yFF = desiredLinearVelocityMetersPerSecond * trajectoryPose.getRotation().getSin();
    const thetaFF = this.m_thetaController.calculate(
      currentPose.getRotation().getRadians(),
      desiredHeading.getRadians()
    );

    this.m_poseError = trajectoryPose.relativeTo(currentPose);
    this.m_rotationError = desiredHeading.minus(currentPose.getRotation());

    if (!this.m_enabled) {
      return ChassisSpeeds.fromFieldRelativeSpeeds(
        xFF,
        yFF,
        thetaFF,
        currentPose.getRotation()
      );
    }

    // Calculate feedback velocities (based on position error).
    const xFeedback = this.m_xController.calculate(
      currentPose.getX(),
      trajectoryPose.getX()
    );
    const yFeedback = this.m_yController.calculate(
      currentPose.getY(),
      trajectoryPose.getY()
    );

    // Return next output.
    return ChassisSpeeds.fromFieldRelativeSpeeds(
      xFF + xFeedback,
      yFF + yFeedback,
      thetaFF,
      currentPose.getRotation()
    );
  }

  /**
   * Returns the next output of the holonomic drive controller.
   *
   * @param currentPose The current pose, as measured by odometry or pose estimator.
   * @param desiredState The desired trajectory pose, as sampled for the current timestep.
   * @param desiredHeading The desired heading.
   * @return The next output of the holonomic drive controller.
   */
  public calculateWithTrajectory(
    currentPose: Pose2d,
    desiredState: Trajectory.State,
    desiredHeading: Rotation2d
  ): ChassisSpeeds {
    return this.calculate(
      currentPose,
      desiredState.poseMeters,
      desiredState.velocityMetersPerSecond,
      desiredHeading
    );
  }

  /**
   * Enables and disables the controller for troubleshooting purposes.
   *
   * @param enabled If the controller is enabled or not.
   */
  public setEnabled(enabled: boolean): void {
    this.m_enabled = enabled;
  }

  /**
   * Returns the x controller.
   *
   * @return X PIDController
   */
  public getXController(): PIDController {
    return this.m_xController;
  }

  /**
   * Returns the y controller.
   *
   * @return Y PIDController
   */
  public getYController(): PIDController {
    return this.m_yController;
  }

  /**
   * Returns the heading controller.
   *
   * @return heading ProfiledPIDController
   */
  public getThetaController(): ProfiledPIDController {
    return this.m_thetaController;
  }
}
