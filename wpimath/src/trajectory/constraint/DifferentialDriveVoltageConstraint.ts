import { Pose2d } from '../../geometry/Pose2d';
import { SimpleMotorFeedforward } from '../../controller/SimpleMotorFeedforward';
import { DifferentialDriveKinematics } from '../../kinematics/DifferentialDriveKinematics';
import { ChassisSpeeds } from '../../kinematics/ChassisSpeeds';
import { MinMax, TrajectoryConstraint } from '../TrajectoryConfig';

/**
 * A class that enforces constraints on differential drive voltage expenditure based on the motor
 * dynamics and the drive kinematics. Ensures that the acceleration of any wheel of the robot
 * while following the trajectory doesn't exceed the maximum acceleration that can be achieved
 * with the given maximum voltage.
 */
export class DifferentialDriveVoltageConstraint implements TrajectoryConstraint {
  private readonly m_feedforward: SimpleMotorFeedforward;
  private readonly m_kinematics: DifferentialDriveKinematics;
  private readonly m_maxVoltage: number;

  /**
   * Creates a new DifferentialDriveVoltageConstraint.
   *
   * @param feedforward A feedforward component describing the behavior of the drive.
   * @param kinematics A kinematics component describing the drive geometry.
   * @param maxVoltage The maximum voltage available to the motors while following the path.
   *     Should be somewhat less than the nominal battery voltage (12V) to account for "voltage sag"
   *     due to current draw.
   */
  constructor(
    feedforward: SimpleMotorFeedforward,
    kinematics: DifferentialDriveKinematics,
    maxVoltage: number
  ) {
    this.m_feedforward = feedforward;
    this.m_kinematics = kinematics;
    this.m_maxVoltage = maxVoltage;
  }

  /**
   * Returns the max velocity given the current pose and curvature.
   *
   * @param poseMeters The pose at the current point in the trajectory.
   * @param curvatureRadPerMeter The curvature at the current point in the trajectory.
   * @param velocityMetersPerSecond The velocity at the current point in the trajectory before constraints are applied.
   * @return The absolute maximum velocity.
   */
  public getMaxVelocityMetersPerSecond(
    poseMeters: Pose2d,
    curvatureRadPerMeter: number,
    velocityMetersPerSecond: number
  ): number {
    // Calculate the wheel speeds from the velocity and curvature
    const wheelSpeeds = this.m_kinematics.toWheelSpeeds(
      new ChassisSpeeds(velocityMetersPerSecond, 0, velocityMetersPerSecond * curvatureRadPerMeter)
    );

    // Calculate the maximum velocity that can be achieved with the given voltage constraint
    const maxLeftVelocity = this.getMaxVelocityForWheel(wheelSpeeds.leftMetersPerSecond, wheelSpeeds.rightMetersPerSecond);
    const maxRightVelocity = this.getMaxVelocityForWheel(wheelSpeeds.rightMetersPerSecond, wheelSpeeds.leftMetersPerSecond);

    // Return the minimum of the two maximum velocities
    return Math.min(maxLeftVelocity, maxRightVelocity) / Math.max(1.0, Math.abs(velocityMetersPerSecond));
  }

  /**
   * Returns the minimum and maximum allowable acceleration for the trajectory
   * given pose, curvature, and speed.
   *
   * @param poseMeters The pose at the current point in the trajectory.
   * @param curvatureRadPerMeter The curvature at the current point in the trajectory.
   * @param velocityMetersPerSecond The speed at the current point in the trajectory.
   * @return The min and max acceleration bounds.
   */
  public getMinMaxAccelerationMetersPerSecondSq(
    poseMeters: Pose2d,
    curvatureRadPerMeter: number,
    velocityMetersPerSecond: number
  ): MinMax {
    // Calculate the wheel speeds from the velocity and curvature
    const wheelSpeeds = this.m_kinematics.toWheelSpeeds(
      new ChassisSpeeds(velocityMetersPerSecond, 0, velocityMetersPerSecond * curvatureRadPerMeter)
    );

    // Calculate the maximum acceleration that can be achieved with the given voltage constraint
    const maxLeftAcceleration = this.getMaxAccelerationForWheel(
      wheelSpeeds.leftMetersPerSecond,
      wheelSpeeds.rightMetersPerSecond,
      this.m_maxVoltage
    );
    const maxRightAcceleration = this.getMaxAccelerationForWheel(
      wheelSpeeds.rightMetersPerSecond,
      wheelSpeeds.leftMetersPerSecond,
      this.m_maxVoltage
    );

    // Calculate the minimum acceleration that can be achieved with the given voltage constraint
    const minLeftAcceleration = this.getMaxAccelerationForWheel(
      wheelSpeeds.leftMetersPerSecond,
      wheelSpeeds.rightMetersPerSecond,
      -this.m_maxVoltage
    );
    const minRightAcceleration = this.getMaxAccelerationForWheel(
      wheelSpeeds.rightMetersPerSecond,
      wheelSpeeds.leftMetersPerSecond,
      -this.m_maxVoltage
    );

    // Return the minimum of the two maximum accelerations and the maximum of the two minimum accelerations
    return new MinMax(
      Math.max(minLeftAcceleration, minRightAcceleration),
      Math.min(maxLeftAcceleration, maxRightAcceleration)
    );
  }

  /**
   * Calculates the maximum velocity for a wheel given the velocity of the other wheel.
   *
   * @param velocity The velocity of the wheel.
   * @param otherVelocity The velocity of the other wheel.
   * @return The maximum velocity for the wheel.
   */
  private getMaxVelocityForWheel(velocity: number, otherVelocity: number): number {
    // Calculate the maximum velocity that can be achieved with the given voltage constraint
    const maxVelocity = this.m_feedforward.getMaxVelocity(this.m_maxVoltage);

    // Return the maximum velocity
    return maxVelocity;
  }

  /**
   * Calculates the maximum acceleration for a wheel given the velocity of both wheels and the maximum voltage.
   *
   * @param velocity The velocity of the wheel.
   * @param otherVelocity The velocity of the other wheel.
   * @param maxVoltage The maximum voltage available to the motors.
   * @return The maximum acceleration for the wheel.
   */
  private getMaxAccelerationForWheel(velocity: number, otherVelocity: number, maxVoltage: number): number {
    // Calculate the maximum acceleration that can be achieved with the given voltage constraint
    const maxAcceleration = this.m_feedforward.getMaxAcceleration(velocity, maxVoltage);

    // Return the maximum acceleration
    return maxAcceleration;
  }
}
