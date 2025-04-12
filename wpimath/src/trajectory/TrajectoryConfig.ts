import { DifferentialDriveKinematics } from '../kinematics/DifferentialDriveKinematics';
import { MecanumDriveKinematics } from '../kinematics/MecanumDriveKinematics';
import { SwerveDriveKinematics } from '../kinematics/SwerveDriveKinematics';
import { Translation2d } from '../geometry/Translation2d';
import { Pose2d } from '../geometry/Pose2d';
import { ChassisSpeeds } from '../kinematics/ChassisSpeeds';

/**
 * Represents the configuration for generating a trajectory. This class stores the start velocity,
 * end velocity, max velocity, max acceleration, custom constraints, and the reversed flag.
 *
 * The class must be constructed with a max velocity and max acceleration. The other parameters
 * (start velocity, end velocity, constraints, reversed) have been defaulted to reasonable values.
 * These values can be changed via the setXXX methods.
 */
export class TrajectoryConfig {
  private m_maxVelocityMetersPerSecond: number;
  private m_maxAccelerationMetersPerSecondSq: number;
  private m_startVelocityMetersPerSecond = 0;
  private m_endVelocityMetersPerSecond = 0;
  private m_reversed = false;
  private m_constraints: TrajectoryConstraint[] = [];

  /**
   * Constructs the trajectory configuration.
   *
   * @param maxVelocityMetersPerSecond The max velocity for the trajectory.
   * @param maxAccelerationMetersPerSecondSq The max acceleration for the trajectory.
   */
  constructor(maxVelocityMetersPerSecond: number, maxAccelerationMetersPerSecondSq: number) {
    this.m_maxVelocityMetersPerSecond = maxVelocityMetersPerSecond;
    this.m_maxAccelerationMetersPerSecondSq = maxAccelerationMetersPerSecondSq;
  }

  /**
   * Sets the reversed flag.
   *
   * @param reversed Whether the trajectory should be reversed or not.
   * @return This config object.
   */
  public setReversed(reversed: boolean): TrajectoryConfig {
    this.m_reversed = reversed;
    return this;
  }

  /**
   * Sets the start velocity.
   *
   * @param startVelocityMetersPerSecond The start velocity.
   * @return This config object.
   */
  public setStartVelocity(startVelocityMetersPerSecond: number): TrajectoryConfig {
    this.m_startVelocityMetersPerSecond = startVelocityMetersPerSecond;
    return this;
  }

  /**
   * Sets the end velocity.
   *
   * @param endVelocityMetersPerSecond The end velocity.
   * @return This config object.
   */
  public setEndVelocity(endVelocityMetersPerSecond: number): TrajectoryConfig {
    this.m_endVelocityMetersPerSecond = endVelocityMetersPerSecond;
    return this;
  }

  /**
   * Adds a user-defined constraint to the trajectory.
   *
   * @param constraint The user-defined constraint.
   * @return This config object.
   */
  public addConstraint(constraint: TrajectoryConstraint): TrajectoryConfig {
    this.m_constraints.push(constraint);
    return this;
  }

  /**
   * Adds all user-defined constraints from a list to the trajectory.
   *
   * @param constraints The user-defined constraints.
   * @return This config object.
   */
  public addConstraints(constraints: TrajectoryConstraint[]): TrajectoryConfig {
    this.m_constraints.push(...constraints);
    return this;
  }

  /**
   * Adds a drive kinematics constraint to ensure that no wheel velocity of a drive
   * goes above the max velocity.
   *
   * @param kinematics The drive kinematics.
   * @return This config object.
   */
  public setKinematics(kinematics: DifferentialDriveKinematics | MecanumDriveKinematics | SwerveDriveKinematics): TrajectoryConfig {
    if (kinematics instanceof DifferentialDriveKinematics) {
      this.addConstraint(new DifferentialDriveKinematicsConstraint(kinematics, this.m_maxVelocityMetersPerSecond));
    } else if (kinematics instanceof MecanumDriveKinematics) {
      this.addConstraint(new MecanumDriveKinematicsConstraint(kinematics, this.m_maxVelocityMetersPerSecond));
    } else if (kinematics instanceof SwerveDriveKinematics) {
      this.addConstraint(new SwerveDriveKinematicsConstraint(kinematics, this.m_maxVelocityMetersPerSecond));
    }
    return this;
  }

  /**
   * Returns the max velocity.
   *
   * @return The max velocity.
   */
  public getMaxVelocityMetersPerSecond(): number {
    return this.m_maxVelocityMetersPerSecond;
  }

  /**
   * Returns the max acceleration.
   *
   * @return The max acceleration.
   */
  public getMaxAccelerationMetersPerSecondSq(): number {
    return this.m_maxAccelerationMetersPerSecondSq;
  }

  /**
   * Returns the start velocity.
   *
   * @return The start velocity.
   */
  public getStartVelocityMetersPerSecond(): number {
    return this.m_startVelocityMetersPerSecond;
  }

  /**
   * Returns the end velocity.
   *
   * @return The end velocity.
   */
  public getEndVelocityMetersPerSecond(): number {
    return this.m_endVelocityMetersPerSecond;
  }

  /**
   * Returns the reversed flag.
   *
   * @return The reversed flag.
   */
  public isReversed(): boolean {
    return this.m_reversed;
  }

  /**
   * Returns the user-defined constraints.
   *
   * @return The user-defined constraints.
   */
  public getConstraints(): TrajectoryConstraint[] {
    return this.m_constraints;
  }
}

/**
 * An interface for defining user-defined velocity and acceleration constraints
 * while generating trajectories.
 */
export interface TrajectoryConstraint {
  /**
   * Returns the max velocity given the current pose and curvature.
   *
   * @param poseMeters The pose at the current point in the trajectory.
   * @param curvatureRadPerMeter The curvature at the current point in the trajectory.
   * @param velocityMetersPerSecond The velocity at the current point in the trajectory before
   *     constraints are applied.
   * @return The absolute maximum velocity.
   */
  getMaxVelocityMetersPerSecond(
    poseMeters: Pose2d,
    curvatureRadPerMeter: number,
    velocityMetersPerSecond: number
  ): number;

  /**
   * Returns the minimum and maximum allowable acceleration for the trajectory
   * given pose, curvature, and speed.
   *
   * @param poseMeters The pose at the current point in the trajectory.
   * @param curvatureRadPerMeter The curvature at the current point in the trajectory.
   * @param velocityMetersPerSecond The velocity at the current point in the trajectory.
   * @return The min and max acceleration bounds.
   */
  getMinMaxAccelerationMetersPerSecondSq(
    poseMeters: Pose2d,
    curvatureRadPerMeter: number,
    velocityMetersPerSecond: number
  ): MinMax;
}

/**
 * Represents a minimum and maximum acceleration.
 */
export class MinMax {
  /**
   * Constructs a MinMax.
   *
   * @param minAccelerationMetersPerSecondSq The minimum acceleration.
   * @param maxAccelerationMetersPerSecondSq The maximum acceleration.
   */
  constructor(
    public minAccelerationMetersPerSecondSq: number,
    public maxAccelerationMetersPerSecondSq: number
  ) {}
}

/**
 * A constraint on the maximum absolute velocity of a differential drive robot.
 */
export class DifferentialDriveKinematicsConstraint implements TrajectoryConstraint {
  private m_kinematics: DifferentialDriveKinematics;
  private m_maxSpeedMetersPerSecond: number;

  /**
   * Constructs a differential drive dynamics constraint.
   *
   * @param kinematics The differential drive kinematics.
   * @param maxSpeedMetersPerSecond The max speed that a side of the robot can travel at.
   */
  constructor(kinematics: DifferentialDriveKinematics, maxSpeedMetersPerSecond: number) {
    this.m_kinematics = kinematics;
    this.m_maxSpeedMetersPerSecond = maxSpeedMetersPerSecond;
  }

  /**
   * Returns the max velocity given the current pose and curvature.
   *
   * @param poseMeters The pose at the current point in the trajectory.
   * @param curvatureRadPerMeter The curvature at the current point in the trajectory.
   * @param velocityMetersPerSecond The velocity at the current point in the trajectory before
   *     constraints are applied.
   * @return The absolute maximum velocity.
   */
  public getMaxVelocityMetersPerSecond(
    poseMeters: Pose2d,
    curvatureRadPerMeter: number,
    velocityMetersPerSecond: number
  ): number {
    // Create a ChassisSpeeds object from the velocity and curvature
    const chassisSpeeds = new ChassisSpeeds(
      velocityMetersPerSecond,
      0,
      velocityMetersPerSecond * curvatureRadPerMeter
    );

    // Get the wheel speeds
    const wheelSpeeds = this.m_kinematics.toWheelSpeeds(chassisSpeeds);

    // Find the wheel with the highest speed
    const maxWheelSpeed = Math.max(Math.abs(wheelSpeeds.leftMetersPerSecond), Math.abs(wheelSpeeds.rightMetersPerSecond));

    // If we're going too fast, scale down the wheel speeds
    if (maxWheelSpeed > this.m_maxSpeedMetersPerSecond) {
      return velocityMetersPerSecond * this.m_maxSpeedMetersPerSecond / maxWheelSpeed;
    }

    return velocityMetersPerSecond;
  }

  /**
   * Returns the minimum and maximum allowable acceleration for the trajectory
   * given pose, curvature, and speed.
   *
   * @param poseMeters The pose at the current point in the trajectory.
   * @param curvatureRadPerMeter The curvature at the current point in the trajectory.
   * @param velocityMetersPerSecond The velocity at the current point in the trajectory.
   * @return The min and max acceleration bounds.
   */
  public getMinMaxAccelerationMetersPerSecondSq(
    poseMeters: Pose2d,
    curvatureRadPerMeter: number,
    velocityMetersPerSecond: number
  ): MinMax {
    return new MinMax(-Infinity, Infinity);
  }
}

/**
 * A constraint on the maximum absolute velocity of a mecanum drive robot.
 */
export class MecanumDriveKinematicsConstraint implements TrajectoryConstraint {
  private m_kinematics: MecanumDriveKinematics;
  private m_maxSpeedMetersPerSecond: number;

  /**
   * Constructs a mecanum drive dynamics constraint.
   *
   * @param kinematics The mecanum drive kinematics.
   * @param maxSpeedMetersPerSecond The max speed that a wheel can travel at.
   */
  constructor(kinematics: MecanumDriveKinematics, maxSpeedMetersPerSecond: number) {
    this.m_kinematics = kinematics;
    this.m_maxSpeedMetersPerSecond = maxSpeedMetersPerSecond;
  }

  /**
   * Returns the max velocity given the current pose and curvature.
   *
   * @param poseMeters The pose at the current point in the trajectory.
   * @param curvatureRadPerMeter The curvature at the current point in the trajectory.
   * @param velocityMetersPerSecond The velocity at the current point in the trajectory before
   *     constraints are applied.
   * @return The absolute maximum velocity.
   */
  public getMaxVelocityMetersPerSecond(
    poseMeters: Pose2d,
    curvatureRadPerMeter: number,
    velocityMetersPerSecond: number
  ): number {
    // Create a ChassisSpeeds object from the velocity and curvature
    const chassisSpeeds = new ChassisSpeeds(
      velocityMetersPerSecond,
      0,
      velocityMetersPerSecond * curvatureRadPerMeter
    );

    // Get the wheel speeds
    const wheelSpeeds = this.m_kinematics.toWheelSpeeds(chassisSpeeds);

    // Find the wheel with the highest speed
    const maxWheelSpeed = Math.max(
      Math.abs(wheelSpeeds.frontLeftMetersPerSecond),
      Math.abs(wheelSpeeds.frontRightMetersPerSecond),
      Math.abs(wheelSpeeds.rearLeftMetersPerSecond),
      Math.abs(wheelSpeeds.rearRightMetersPerSecond)
    );

    // If we're going too fast, scale down the wheel speeds
    if (maxWheelSpeed > this.m_maxSpeedMetersPerSecond) {
      return velocityMetersPerSecond * this.m_maxSpeedMetersPerSecond / maxWheelSpeed;
    }

    return velocityMetersPerSecond;
  }

  /**
   * Returns the minimum and maximum allowable acceleration for the trajectory
   * given pose, curvature, and speed.
   *
   * @param poseMeters The pose at the current point in the trajectory.
   * @param curvatureRadPerMeter The curvature at the current point in the trajectory.
   * @param velocityMetersPerSecond The velocity at the current point in the trajectory.
   * @return The min and max acceleration bounds.
   */
  public getMinMaxAccelerationMetersPerSecondSq(
    poseMeters: Pose2d,
    curvatureRadPerMeter: number,
    velocityMetersPerSecond: number
  ): MinMax {
    return new MinMax(-Infinity, Infinity);
  }
}

/**
 * A constraint on the maximum absolute velocity of a swerve drive robot.
 */
export class SwerveDriveKinematicsConstraint implements TrajectoryConstraint {
  private m_kinematics: SwerveDriveKinematics;
  private m_maxSpeedMetersPerSecond: number;

  /**
   * Constructs a swerve drive dynamics constraint.
   *
   * @param kinematics The swerve drive kinematics.
   * @param maxSpeedMetersPerSecond The max speed that a module can travel at.
   */
  constructor(kinematics: SwerveDriveKinematics, maxSpeedMetersPerSecond: number) {
    this.m_kinematics = kinematics;
    this.m_maxSpeedMetersPerSecond = maxSpeedMetersPerSecond;
  }

  /**
   * Returns the max velocity given the current pose and curvature.
   *
   * @param poseMeters The pose at the current point in the trajectory.
   * @param curvatureRadPerMeter The curvature at the current point in the trajectory.
   * @param velocityMetersPerSecond The velocity at the current point in the trajectory before
   *     constraints are applied.
   * @return The absolute maximum velocity.
   */
  public getMaxVelocityMetersPerSecond(
    poseMeters: Pose2d,
    curvatureRadPerMeter: number,
    velocityMetersPerSecond: number
  ): number {
    // Create a ChassisSpeeds object from the velocity and curvature
    const chassisSpeeds = new ChassisSpeeds(
      velocityMetersPerSecond,
      0,
      velocityMetersPerSecond * curvatureRadPerMeter
    );

    // Get the module states
    const moduleStates = this.m_kinematics.toSwerveModuleStates(chassisSpeeds);

    // Find the module with the highest speed
    let maxModuleSpeed = 0;
    for (const moduleState of moduleStates) {
      maxModuleSpeed = Math.max(maxModuleSpeed, Math.abs(moduleState.speedMetersPerSecond));
    }

    // If we're going too fast, scale down the module speeds
    if (maxModuleSpeed > this.m_maxSpeedMetersPerSecond) {
      return velocityMetersPerSecond * this.m_maxSpeedMetersPerSecond / maxModuleSpeed;
    }

    return velocityMetersPerSecond;
  }

  /**
   * Returns the minimum and maximum allowable acceleration for the trajectory
   * given pose, curvature, and speed.
   *
   * @param poseMeters The pose at the current point in the trajectory.
   * @param curvatureRadPerMeter The curvature at the current point in the trajectory.
   * @param velocityMetersPerSecond The velocity at the current point in the trajectory.
   * @return The min and max acceleration bounds.
   */
  public getMinMaxAccelerationMetersPerSecondSq(
    poseMeters: Pose2d,
    curvatureRadPerMeter: number,
    velocityMetersPerSecond: number
  ): MinMax {
    return new MinMax(-Infinity, Infinity);
  }
}
