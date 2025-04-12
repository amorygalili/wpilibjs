import { Translation2d } from '../geometry/Translation2d';
import { Twist2d } from '../geometry/Twist2d';
import { SimpleMatrix } from '../util/SimpleMatrix';
import { ChassisSpeeds } from './ChassisSpeeds';
import { Kinematics } from './Kinematics';
import { MecanumDriveWheelPositions } from './MecanumDriveWheelPositions';
import { MecanumDriveWheelSpeeds } from './MecanumDriveWheelSpeeds';

/**
 * Helper class that converts a chassis velocity (dx, dy, and dtheta components) into individual
 * wheel speeds.
 *
 * <p>The inverse kinematics (converting from a desired chassis velocity to individual wheel speeds)
 * uses the relative locations of the wheels with respect to the center of rotation. The center of
 * rotation for inverse kinematics is also variable. This means that you can set your center of
 * rotation in a corner of the robot to perform special evasion maneuvers.
 *
 * <p>Forward kinematics (converting an array of wheel speeds into the overall chassis motion) is
 * performs the exact opposite of what inverse kinematics does. Since this is an overdetermined
 * system (more equations than variables), we use a least-squares approximation.
 *
 * <p>The inverse kinematics: [wheelSpeeds] = [wheelLocations] * [chassisSpeeds] We take the
 * Moore-Penrose pseudoinverse of [wheelLocations] and then multiply by [wheelSpeeds] to get our
 * chassis speeds.
 *
 * <p>Forward kinematics is also used for odometry -- determining the position of the robot on the
 * field using encoders and a gyro.
 */
export class MecanumDriveKinematics extends Kinematics<MecanumDriveWheelSpeeds, MecanumDriveWheelPositions> {
  private readonly m_frontLeftWheelMeters: Translation2d;
  private readonly m_frontRightWheelMeters: Translation2d;
  private readonly m_rearLeftWheelMeters: Translation2d;
  private readonly m_rearRightWheelMeters: Translation2d;

  private readonly m_inverseKinematics: SimpleMatrix;
  private readonly m_forwardKinematics: SimpleMatrix;

  private m_prevCoR = new Translation2d();

  /**
   * Constructs a mecanum drive kinematics object.
   *
   * @param frontLeftWheelMeters The location of the front-left wheel relative to the physical center of the robot.
   * @param frontRightWheelMeters The location of the front-right wheel relative to the physical center of the robot.
   * @param rearLeftWheelMeters The location of the rear-left wheel relative to the physical center of the robot.
   * @param rearRightWheelMeters The location of the rear-right wheel relative to the physical center of the robot.
   */
  constructor(
    frontLeftWheelMeters: Translation2d,
    frontRightWheelMeters: Translation2d,
    rearLeftWheelMeters: Translation2d,
    rearRightWheelMeters: Translation2d
  ) {
    super();
    this.m_frontLeftWheelMeters = frontLeftWheelMeters;
    this.m_frontRightWheelMeters = frontRightWheelMeters;
    this.m_rearLeftWheelMeters = rearLeftWheelMeters;
    this.m_rearRightWheelMeters = rearRightWheelMeters;

    this.m_inverseKinematics = this.setInverseKinematics(
      frontLeftWheelMeters,
      frontRightWheelMeters,
      rearLeftWheelMeters,
      rearRightWheelMeters
    );

    // Initialize forward kinematics as the pseudoinverse of the inverse kinematics
    this.m_forwardKinematics = this.m_inverseKinematics.pseudoInverse();
  }

  /**
   * Performs inverse kinematics to return the wheel speeds from a desired chassis velocity.
   *
   * @param chassisSpeedsOrChassisSpeeds The desired chassis speed.
   * @param centerOfRotationMeters The center of rotation (optional). For example, if you set the center of
   *     rotation at one corner of the robot and provide a chassis speed that only has a dtheta
   *     component, the robot will rotate around that corner.
   * @return The wheel speeds that achieve the desired chassis speed.
   */
  public toWheelSpeeds(
    chassisSpeedsOrChassisSpeeds: ChassisSpeeds,
    centerOfRotationMeters?: Translation2d
  ): MecanumDriveWheelSpeeds {
    const chassisSpeeds = chassisSpeedsOrChassisSpeeds;
    const centerOfRotation = centerOfRotationMeters ?? new Translation2d();
    // We have a new center of rotation. We need to compute the matrix again.
    if (!centerOfRotation.equals(this.m_prevCoR)) {
      const fl = this.m_frontLeftWheelMeters.minus(centerOfRotation);
      const fr = this.m_frontRightWheelMeters.minus(centerOfRotation);
      const rl = this.m_rearLeftWheelMeters.minus(centerOfRotation);
      const rr = this.m_rearRightWheelMeters.minus(centerOfRotation);

      this.setInverseKinematics(fl, fr, rl, rr);
      this.m_prevCoR = centerOfRotation;
    }

    const chassisSpeedsVector = new SimpleMatrix(3, 1);
    chassisSpeedsVector.set(0, 0, chassisSpeeds.vxMetersPerSecond);
    chassisSpeedsVector.set(1, 0, chassisSpeeds.vyMetersPerSecond);
    chassisSpeedsVector.set(2, 0, chassisSpeeds.omegaRadiansPerSecond);

    const wheelSpeedsMatrix = this.m_inverseKinematics.mult(chassisSpeedsVector);

    return new MecanumDriveWheelSpeeds(
      wheelSpeedsMatrix.get(0, 0),
      wheelSpeedsMatrix.get(1, 0),
      wheelSpeedsMatrix.get(2, 0),
      wheelSpeedsMatrix.get(3, 0)
    );
  }

  /**
   * Performs forward kinematics to return the resulting chassis state from the given wheel speeds.
   * This method is often used for odometry -- determining the robot's position on the field using
   * data from the real-world speed of each wheel on the robot.
   *
   * @param wheelSpeeds The current mecanum drive wheel speeds.
   * @return The resulting chassis speed.
   */
  public toChassisSpeeds(wheelSpeeds: MecanumDriveWheelSpeeds): ChassisSpeeds {
    const wheelSpeedsMatrix = new SimpleMatrix(4, 1);
    wheelSpeedsMatrix.set(0, 0, wheelSpeeds.frontLeftMetersPerSecond);
    wheelSpeedsMatrix.set(1, 0, wheelSpeeds.frontRightMetersPerSecond);
    wheelSpeedsMatrix.set(2, 0, wheelSpeeds.rearLeftMetersPerSecond);
    wheelSpeedsMatrix.set(3, 0, wheelSpeeds.rearRightMetersPerSecond);

    const chassisSpeedsVector = this.m_forwardKinematics.mult(wheelSpeedsMatrix);

    return new ChassisSpeeds(
      chassisSpeedsVector.get(0, 0),
      chassisSpeedsVector.get(1, 0),
      chassisSpeedsVector.get(2, 0)
    );
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
  public toTwist2d(start: MecanumDriveWheelPositions, end: MecanumDriveWheelPositions): Twist2d {
    const wheelDeltasMatrix = new SimpleMatrix(4, 1);
    wheelDeltasMatrix.set(0, 0, end.frontLeftMeters - start.frontLeftMeters);
    wheelDeltasMatrix.set(1, 0, end.frontRightMeters - start.frontRightMeters);
    wheelDeltasMatrix.set(2, 0, end.rearLeftMeters - start.rearLeftMeters);
    wheelDeltasMatrix.set(3, 0, end.rearRightMeters - start.rearRightMeters);

    const twistMatrix = this.m_forwardKinematics.mult(wheelDeltasMatrix);
    return new Twist2d(twistMatrix.get(0, 0), twistMatrix.get(1, 0), twistMatrix.get(2, 0));
  }

  /**
   * Performs forward kinematics to return the resulting Twist2d from the given wheel deltas.
   * This method is often used for odometry -- determining the robot's position on the field using
   * changes in the distance driven by each wheel on the robot.
   *
   * @param wheelDeltas The distances driven by each wheel.
   * @return The resulting Twist2d.
   */
  public toTwist2dFromDeltas(wheelDeltas: MecanumDriveWheelPositions): Twist2d {
    const wheelDeltasMatrix = new SimpleMatrix(4, 1);
    wheelDeltasMatrix.set(0, 0, wheelDeltas.frontLeftMeters);
    wheelDeltasMatrix.set(1, 0, wheelDeltas.frontRightMeters);
    wheelDeltasMatrix.set(2, 0, wheelDeltas.rearLeftMeters);
    wheelDeltasMatrix.set(3, 0, wheelDeltas.rearRightMeters);

    const twistMatrix = this.m_forwardKinematics.mult(wheelDeltasMatrix);
    return new Twist2d(twistMatrix.get(0, 0), twistMatrix.get(1, 0), twistMatrix.get(2, 0));
  }

  /**
   * Returns the front-left wheel translation.
   *
   * @return The front-left wheel translation.
   */
  public getFrontLeftWheel(): Translation2d {
    return this.m_frontLeftWheelMeters;
  }

  /**
   * Returns the front-right wheel translation.
   *
   * @return The front-right wheel translation.
   */
  public getFrontRightWheel(): Translation2d {
    return this.m_frontRightWheelMeters;
  }

  /**
   * Returns the rear-left wheel translation.
   *
   * @return The rear-left wheel translation.
   */
  public getRearLeftWheel(): Translation2d {
    return this.m_rearLeftWheelMeters;
  }

  /**
   * Returns the rear-right wheel translation.
   *
   * @return The rear-right wheel translation.
   */
  public getRearRightWheel(): Translation2d {
    return this.m_rearRightWheelMeters;
  }

  /**
   * Construct inverse kinematics matrix from wheel locations.
   *
   * @param fl The location of the front-left wheel relative to the physical center of the robot.
   * @param fr The location of the front-right wheel relative to the physical center of the robot.
   * @param rl The location of the rear-left wheel relative to the physical center of the robot.
   * @param rr The location of the rear-right wheel relative to the physical center of the robot.
   * @return The inverse kinematics matrix.
   */
  private setInverseKinematics(
    fl: Translation2d,
    fr: Translation2d,
    rl: Translation2d,
    rr: Translation2d
  ): SimpleMatrix {
    const inverseKinematics = new SimpleMatrix(4, 3);

    // First row is the front left wheel
    inverseKinematics.set(0, 0, 1);
    inverseKinematics.set(0, 1, 1);
    inverseKinematics.set(0, 2, -fl.getX() - fl.getY());

    // Second row is the front right wheel
    inverseKinematics.set(1, 0, 1);
    inverseKinematics.set(1, 1, -1);
    inverseKinematics.set(1, 2, -fr.getX() + fr.getY());

    // Third row is the rear left wheel
    inverseKinematics.set(2, 0, 1);
    inverseKinematics.set(2, 1, -1);
    inverseKinematics.set(2, 2, -rl.getX() + rl.getY());

    // Fourth row is the rear right wheel
    inverseKinematics.set(3, 0, 1);
    inverseKinematics.set(3, 1, 1);
    inverseKinematics.set(3, 2, -rr.getX() - rr.getY());

    return inverseKinematics;
  }

  /**
   * Creates a deep copy of the provided wheel positions.
   *
   * @param wheelPositions The wheel positions to copy.
   * @return A deep copy of the provided wheel positions.
   */
  public copy(wheelPositions: MecanumDriveWheelPositions): MecanumDriveWheelPositions {
    return new MecanumDriveWheelPositions(
      wheelPositions.frontLeftMeters,
      wheelPositions.frontRightMeters,
      wheelPositions.rearLeftMeters,
      wheelPositions.rearRightMeters
    );
  }

  /**
   * Copies the provided wheel positions into the destination wheel positions.
   *
   * @param wheelPositions The wheel positions to copy.
   * @param destinationWheelPositions The wheel positions to copy into.
   */
  public copyInto(
    wheelPositions: MecanumDriveWheelPositions,
    destinationWheelPositions: MecanumDriveWheelPositions
  ): void {
    destinationWheelPositions.frontLeftMeters = wheelPositions.frontLeftMeters;
    destinationWheelPositions.frontRightMeters = wheelPositions.frontRightMeters;
    destinationWheelPositions.rearLeftMeters = wheelPositions.rearLeftMeters;
    destinationWheelPositions.rearRightMeters = wheelPositions.rearRightMeters;
  }

  /**
   * Interpolates between two wheel positions.
   *
   * @param start The start wheel positions.
   * @param end The end wheel positions.
   * @param t The interpolation parameter, in [0, 1].
   * @return The interpolated wheel positions.
   */
  public interpolate(
    start: MecanumDriveWheelPositions,
    end: MecanumDriveWheelPositions,
    t: number
  ): MecanumDriveWheelPositions {
    return start.interpolate(end, t);
  }
}
