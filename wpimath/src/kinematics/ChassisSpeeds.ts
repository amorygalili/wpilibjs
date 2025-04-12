import { Rotation2d } from '../geometry/Rotation2d';
import { Translation2d } from '../geometry/Translation2d';
import { Twist2d } from '../geometry/Twist2d';
import { Pose2d } from '../geometry/Pose2d';

/**
 * Represents the speed of a robot chassis. Although this class contains similar members compared to
 * a Twist2d, they do NOT represent the same thing. Whereas a Twist2d represents a change in pose
 * w.r.t to the robot frame of reference, a ChassisSpeeds object represents a robot's velocity.
 *
 * A strictly non-holonomic drivetrain, such as a differential drive, should never have a dy component because it can never move sideways.
 * Holonomic drivetrains such as swerve and mecanum will often have all three components.
 */
export class ChassisSpeeds {
  /** Velocity along the x-axis. (Fwd is +) */
  public vxMetersPerSecond: number;

  /** Velocity along the y-axis. (Left is +) */
  public vyMetersPerSecond: number;

  /** Represents the angular velocity of the robot frame. (CCW is +) */
  public omegaRadiansPerSecond: number;

  /** Constructs a ChassisSpeeds with zeros for dx, dy, and theta. */
  constructor();

  /**
   * Constructs a ChassisSpeeds object.
   *
   * @param vxMetersPerSecond Forward velocity.
   * @param vyMetersPerSecond Sideways velocity.
   * @param omegaRadiansPerSecond Angular velocity.
   */
  constructor(vxMetersPerSecond: number, vyMetersPerSecond: number, omegaRadiansPerSecond: number);

  constructor(vxMetersPerSecond?: number, vyMetersPerSecond?: number, omegaRadiansPerSecond?: number) {
    this.vxMetersPerSecond = vxMetersPerSecond ?? 0;
    this.vyMetersPerSecond = vyMetersPerSecond ?? 0;
    this.omegaRadiansPerSecond = omegaRadiansPerSecond ?? 0;
  }

  /**
   * Creates a Twist2d from ChassisSpeeds.
   *
   * @param dt The duration of the timestep.
   * @return Twist2d.
   */
  public toTwist2d(dt: number): Twist2d {
    return new Twist2d(
      this.vxMetersPerSecond * dt,
      this.vyMetersPerSecond * dt,
      this.omegaRadiansPerSecond * dt
    );
  }

  /**
   * Discretizes a continuous-time chassis speed.
   *
   * This function converts a continuous-time chassis speed into a discrete-time one such that
   * when the discrete-time chassis speed is applied for one timestep, the robot moves as if the
   * velocity components are independent (i.e., the robot moves v_x * dt along the x-axis, v_y * dt
   * along the y-axis, and omega * dt around the z-axis).
   *
   * This is useful for compensating for translational skew when translating and rotating a holonomic
   * (swerve or mecanum) drivetrain. However, scaling down the ChassisSpeeds after discretizing
   * (e.g., when desaturating swerve module speeds) rotates the direction of net motion in the
   * opposite direction of rotational velocity, introducing a different translational skew which is
   * not accounted for by discretization.
   *
   * @param vxMetersPerSecondOrContinuousSpeeds Forward velocity or continuous speeds.
   * @param vyMetersPerSecondOrDtSeconds Sideways velocity or timestep duration.
   * @param omegaRadiansPerSecond Angular velocity (optional).
   * @param dtSeconds The duration of the timestep the speeds should be applied for (optional).
   * @return Discretized ChassisSpeeds.
   */
  public static discretize(
    vxMetersPerSecondOrContinuousSpeeds: number | ChassisSpeeds,
    vyMetersPerSecondOrDtSeconds: number,
    omegaRadiansPerSecond?: number,
    dtSeconds?: number
  ): ChassisSpeeds {
    // Handle overloaded function
    if (vxMetersPerSecondOrContinuousSpeeds instanceof ChassisSpeeds) {
      const continuousSpeeds = vxMetersPerSecondOrContinuousSpeeds;
      const dtSeconds = vyMetersPerSecondOrDtSeconds;
      return ChassisSpeeds.discretize(
        continuousSpeeds.vxMetersPerSecond,
        continuousSpeeds.vyMetersPerSecond,
        continuousSpeeds.omegaRadiansPerSecond,
        dtSeconds
      );
    } else {
      const vxMetersPerSecond = vxMetersPerSecondOrContinuousSpeeds;
      const vyMetersPerSecond = vyMetersPerSecondOrDtSeconds;
      // We know these are defined because we're in the else branch
      const omega = omegaRadiansPerSecond!;
      const dt = dtSeconds!;

      // Construct the desired pose after a timestep, relative to the current pose. The desired pose
      // has decoupled translation and rotation.
      const desiredDeltaPose = new Pose2d(
        vxMetersPerSecond * dt,
        vyMetersPerSecond * dt,
        new Rotation2d(omega * dt)
      );

      // Create a twist that represents this pose delta.
      const twist = Pose2d.kZero.log(desiredDeltaPose);

      // Create a new chassis speeds that when applied to a robot for dt seconds, moves the robot
      // along the specified twist.
      return new ChassisSpeeds(
        twist.dx / dt,
        twist.dy / dt,
        twist.dtheta / dt
      );
    }
  }

  /**
   * Creates a new ChassisSpeeds object representing this one converted from field-relative speeds
   * to robot-relative speeds.
   *
   * @param vxMetersPerSecond The field-relative x velocity component.
   * @param vyMetersPerSecond The field-relative y velocity component.
   * @param omegaRadiansPerSecond The field-relative angular velocity component.
   * @param robotAngle The robot's rotation on the field.
   * @return ChassisSpeeds object representing the speeds in the robot's frame of reference.
   */
  public static fromFieldRelativeSpeeds(
    vxMetersPerSecond: number,
    vyMetersPerSecond: number,
    omegaRadiansPerSecond: number,
    robotAngle: Rotation2d
  ): ChassisSpeeds {
    // CW rotation into chassis frame
    const rotated = new Translation2d(vxMetersPerSecond, vyMetersPerSecond).rotateBy(robotAngle.unaryMinus());
    return new ChassisSpeeds(rotated.getX(), rotated.getY(), omegaRadiansPerSecond);
  }

  /**
   * Creates a new ChassisSpeeds object representing this one converted from robot-relative speeds
   * to field-relative speeds.
   *
   * @param vxMetersPerSecond The robot-relative x velocity component.
   * @param vyMetersPerSecond The robot-relative y velocity component.
   * @param omegaRadiansPerSecond The robot-relative angular velocity component.
   * @param robotAngle The robot's rotation on the field.
   * @return ChassisSpeeds object representing the speeds in the field's frame of reference.
   */
  public static fromRobotRelativeSpeeds(
    vxMetersPerSecond: number,
    vyMetersPerSecond: number,
    omegaRadiansPerSecond: number,
    robotAngle: Rotation2d
  ): ChassisSpeeds {
    // CCW rotation out of chassis frame
    const rotated = new Translation2d(vxMetersPerSecond, vyMetersPerSecond).rotateBy(robotAngle);
    return new ChassisSpeeds(rotated.getX(), rotated.getY(), omegaRadiansPerSecond);
  }
}
