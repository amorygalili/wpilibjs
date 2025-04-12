import { Translation2d } from '../geometry/Translation2d';
import { Twist2d } from '../geometry/Twist2d';
import { SimpleMatrix } from '../util/SimpleMatrix';
import { ChassisSpeeds } from './ChassisSpeeds';
import { Kinematics } from './Kinematics';
import { SwerveModulePosition } from './SwerveModulePosition';
import { SwerveModuleState } from './SwerveModuleState';
import { MathSharedStore } from '../MathSharedStore';
import { MathUsageId } from '../MathUsageId';

/**
 * Helper class that converts a chassis velocity (dx, dy, and dtheta components) into individual
 * module states (speed and angle).
 *
 * <p>The inverse kinematics (converting from a desired chassis velocity to individual module
 * states) uses the relative locations of the modules with respect to the center of rotation. The
 * center of rotation for inverse kinematics is also variable. This means that you can set your
 * center of rotation in a corner of the robot to perform special evasion maneuvers.
 *
 * <p>Forward kinematics (converting an array of module states into the overall chassis motion) is
 * performs the exact opposite of what inverse kinematics does. Since this is an overdetermined
 * system (more equations than variables), we use a least-squares approximation.
 *
 * <p>The inverse kinematics: [moduleStates] = [moduleLocations] * [chassisSpeeds] We take the
 * Moore-Penrose pseudoinverse of [moduleLocations] and then multiply by [moduleStates] to get our
 * chassis speeds.
 *
 * <p>Forward kinematics is also used for odometry -- determining the position of the robot on the
 * field using encoders and a gyro.
 */
export class SwerveDriveKinematics extends Kinematics<SwerveModuleState[], SwerveModulePosition[]> {
  private readonly m_modules: Translation2d[];
  private readonly m_inverseKinematics: SimpleMatrix;
  private readonly m_forwardKinematics: SimpleMatrix;
  private m_previousCoR = new Translation2d();

  /**
   * Constructs a swerve drive kinematics object.
   *
   * @param wheelsLocations The locations of the wheels relative to the physical center of the robot.
   */
  constructor(...wheelsLocations: Translation2d[]) {
    super();
    this.m_modules = wheelsLocations;

    // Create the inverse kinematics matrix
    this.m_inverseKinematics = new SimpleMatrix(wheelsLocations.length * 2, 3);

    for (let i = 0; i < wheelsLocations.length; i++) {
      this.m_inverseKinematics.set(i * 2, 0, 1);
      this.m_inverseKinematics.set(i * 2, 1, 0);
      this.m_inverseKinematics.set(i * 2, 2, -wheelsLocations[i].getY());
      this.m_inverseKinematics.set(i * 2 + 1, 0, 0);
      this.m_inverseKinematics.set(i * 2 + 1, 1, 1);
      this.m_inverseKinematics.set(i * 2 + 1, 2, wheelsLocations[i].getX());
    }

    // Create the forward kinematics matrix (pseudoinverse of inverse kinematics matrix)
    this.m_forwardKinematics = this.m_inverseKinematics.pseudoInverse();

    MathSharedStore.reportUsage(MathUsageId.kKinematics_SwerveDrive, 1);
  }

  /**
   * Performs inverse kinematics to return the wheel speeds from a desired chassis velocity.
   * This method is often used to convert joystick values into wheel speeds.
   *
   * @param chassisSpeeds The desired chassis speed.
   * @return The wheel speeds.
   */
  public toWheelSpeeds(chassisSpeeds: ChassisSpeeds): SwerveModuleState[] {
    return this.toSwerveModuleStates(chassisSpeeds);
  }

  /**
   * Performs inverse kinematics to return the module states from a desired chassis velocity.
   *
   * @param chassisSpeeds The desired chassis speed.
   * @return An array of module states.
   */
  public toSwerveModuleStates(chassisSpeeds: ChassisSpeeds): SwerveModuleState[];

  /**
   * Performs inverse kinematics to return the module states from a desired chassis velocity.
   *
   * @param chassisSpeeds The desired chassis speed.
   * @param centerOfRotation The center of rotation. For example, if you set the center of
   *     rotation at one corner of the robot and provide a chassis speed that only has a dtheta
   *     component, the robot will rotate around that corner.
   * @return An array of module states.
   */
  public toSwerveModuleStates(
    chassisSpeeds: ChassisSpeeds,
    centerOfRotation: Translation2d
  ): SwerveModuleState[];

  public toSwerveModuleStates(
    chassisSpeeds: ChassisSpeeds,
    centerOfRotation?: Translation2d
  ): SwerveModuleState[] {
    const cor = centerOfRotation ?? new Translation2d();

    // We have a new center of rotation. We need to compute the matrix again.
    if (!cor.equals(this.m_previousCoR)) {
      for (let i = 0; i < this.m_modules.length; i++) {
        const module = this.m_modules[i].minus(cor);
        this.m_inverseKinematics.set(i * 2, 2, -module.getY());
        this.m_inverseKinematics.set(i * 2 + 1, 2, module.getX());
      }
      this.m_previousCoR = cor;
    }

    const chassisSpeedsVector = new SimpleMatrix(3, 1);
    chassisSpeedsVector.set(0, 0, chassisSpeeds.vxMetersPerSecond);
    chassisSpeedsVector.set(1, 0, chassisSpeeds.vyMetersPerSecond);
    chassisSpeedsVector.set(2, 0, chassisSpeeds.omegaRadiansPerSecond);

    const moduleStatesMatrix = this.m_inverseKinematics.mult(chassisSpeedsVector);

    const moduleStates: SwerveModuleState[] = [];
    for (let i = 0; i < this.m_modules.length; i++) {
      const x = moduleStatesMatrix.get(i * 2, 0);
      const y = moduleStatesMatrix.get(i * 2 + 1, 0);

      const speed = Math.hypot(x, y);
      const angle = Math.atan2(y, x);

      moduleStates.push(new SwerveModuleState(speed, new Translation2d(x, y).getAngle()));
    }

    return moduleStates;
  }

  /**
   * Performs forward kinematics to return the resulting chassis state from the given module states.
   * This method is often used for odometry -- determining the robot's position on the field using
   * data from the real-world speed and angle of each module on the robot.
   *
   * @param wheelStates The state of the modules (as a SwerveModuleState type) as measured from
   *     respective encoders and gyros. The order of the swerve module states should be same as
   *     passed into the constructor of this class.
   * @return The resulting chassis speed.
   */
  public toChassisSpeeds(wheelStates: SwerveModuleState[]): ChassisSpeeds {
    if (wheelStates.length != this.m_modules.length) {
      throw new Error(
        "Number of modules is not consistent with number of wheel locations provided in constructor"
      );
    }

    const moduleStatesMatrix = new SimpleMatrix(this.m_modules.length * 2, 1);

    for (let i = 0; i < wheelStates.length; i++) {
      const module = wheelStates[i];
      moduleStatesMatrix.set(i * 2, 0, module.speedMetersPerSecond * module.angle.getCos());
      moduleStatesMatrix.set(i * 2 + 1, 0, module.speedMetersPerSecond * module.angle.getSin());
    }

    const chassisSpeedsVector = this.m_forwardKinematics.mult(moduleStatesMatrix);
    return new ChassisSpeeds(
      chassisSpeedsVector.get(0, 0),
      chassisSpeedsVector.get(1, 0),
      chassisSpeedsVector.get(2, 0)
    );
  }

  /**
   * Performs forward kinematics to return the resulting Twist2d from the given module deltas.
   * This method is often used for odometry -- determining the robot's position on the field using
   * changes in the distance driven by each wheel on the robot.
   *
   * @param wheelDeltasOrStart The latest change in position of the modules (as a SwerveModulePosition type)
   *     as measured from respective encoders and gyros, or the previous positions of the modules.
   * @param end The current positions of the modules (optional).
   * @return The resulting Twist2d.
   */
  public toTwist2d(wheelDeltasOrStart: SwerveModulePosition[], end?: SwerveModulePosition[]): Twist2d {
    if (end) {
      // We're being called with start and end positions
      if (wheelDeltasOrStart.length != end.length || wheelDeltasOrStart.length != this.m_modules.length) {
        throw new Error(
          "Number of modules is not consistent with number of wheel locations provided in constructor"
        );
      }

      const wheelDeltas: SwerveModulePosition[] = [];
      for (let i = 0; i < wheelDeltasOrStart.length; i++) {
        wheelDeltas.push(
          new SwerveModulePosition(
            end[i].distanceMeters - wheelDeltasOrStart[i].distanceMeters,
            end[i].angle
          )
        );
      }

      // Call ourselves with just the deltas
      return this.toTwist2d(wheelDeltas);
    } else {
      // We're being called with just the deltas
      const wheelDeltas = wheelDeltasOrStart;

      if (wheelDeltas.length != this.m_modules.length) {
        throw new Error(
          "Number of modules is not consistent with number of wheel locations provided in constructor"
        );
      }

      const modulesDeltasMatrix = new SimpleMatrix(this.m_modules.length * 2, 1);

      for (let i = 0; i < wheelDeltas.length; i++) {
        const module = wheelDeltas[i];
        modulesDeltasMatrix.set(i * 2, 0, module.distanceMeters * module.angle.getCos());
        modulesDeltasMatrix.set(i * 2 + 1, 0, module.distanceMeters * module.angle.getSin());
      }

      const chassisDeltaVector = this.m_forwardKinematics.mult(modulesDeltasMatrix);
      return new Twist2d(
        chassisDeltaVector.get(0, 0),
        chassisDeltaVector.get(1, 0),
        chassisDeltaVector.get(2, 0)
      );
    }
  }

  /**
   * Normalizes the wheel speeds using some max attainable speed. Sometimes, after inverse
   * kinematics, the requested speed from a/several modules may be above the max attainable speed
   * for the driving motor on that module. To fix this issue, one can "normalize" all the wheel
   * speeds to make sure that all requested module speeds are below the absolute threshold, while
   * maintaining the ratio of speeds between modules.
   *
   * @param moduleStates Reference to array of module states. The array will be mutated with the
   *     normalized speeds!
   * @param attainableMaxSpeedMetersPerSecondOrCurrentChassisSpeed The absolute max speed that a module can reach,
   *     or the current chassis speed.
   * @param attainableMaxModuleSpeedMetersPerSecond The absolute max speed that a module can reach (optional).
   * @param attainableMaxTranslationalSpeedMetersPerSecond The absolute max speed that the robot can
   *     reach while translating (optional).
   * @param attainableMaxRotationalVelocityRadiansPerSecond The absolute max speed the robot can
   *     reach while rotating (optional).
   */
  public static desaturateWheelSpeeds(
    moduleStates: SwerveModuleState[],
    attainableMaxSpeedMetersPerSecondOrCurrentChassisSpeed: number | ChassisSpeeds,
    attainableMaxModuleSpeedMetersPerSecond?: number,
    attainableMaxTranslationalSpeedMetersPerSecond?: number,
    attainableMaxRotationalVelocityRadiansPerSecond?: number
  ): void {
    if (typeof attainableMaxSpeedMetersPerSecondOrCurrentChassisSpeed === 'number') {
      // Simple case: just normalize based on the max speed
      const attainableMaxSpeedMetersPerSecond = attainableMaxSpeedMetersPerSecondOrCurrentChassisSpeed;

      let realMaxSpeed = 0;
      for (const module of moduleStates) {
        realMaxSpeed = Math.max(realMaxSpeed, Math.abs(module.speedMetersPerSecond));
      }

      if (realMaxSpeed > attainableMaxSpeedMetersPerSecond) {
        for (const module of moduleStates) {
          module.speedMetersPerSecond =
            (module.speedMetersPerSecond / realMaxSpeed) * attainableMaxSpeedMetersPerSecond;
        }
      }
    } else {
      // Complex case: normalize based on chassis speed constraints
      const currentChassisSpeed = attainableMaxSpeedMetersPerSecondOrCurrentChassisSpeed;

      if (!attainableMaxModuleSpeedMetersPerSecond ||
          !attainableMaxTranslationalSpeedMetersPerSecond ||
          !attainableMaxRotationalVelocityRadiansPerSecond) {
        throw new Error("Missing required parameters for chassis speed normalization");
      }

      // Determine the translational and rotational components of the requested chassis speed
      const translationalRequestX = currentChassisSpeed.vxMetersPerSecond;
      const translationalRequestY = currentChassisSpeed.vyMetersPerSecond;
      const translationalRequest = Math.hypot(translationalRequestX, translationalRequestY);
      const rotationalRequest = Math.abs(currentChassisSpeed.omegaRadiansPerSecond);

      // Determine the factors by which to scale the chassis speed to stay within attainable speeds
      const translationalFactor = translationalRequest > attainableMaxTranslationalSpeedMetersPerSecond
        ? attainableMaxTranslationalSpeedMetersPerSecond / translationalRequest
        : 1.0;
      const rotationalFactor = rotationalRequest > attainableMaxRotationalVelocityRadiansPerSecond
        ? attainableMaxRotationalVelocityRadiansPerSecond / rotationalRequest
        : 1.0;

      // Apply the more restrictive factor
      const factor = Math.min(translationalFactor, rotationalFactor);

      // Scale the chassis speed
      const scaledChassisSpeed = new ChassisSpeeds(
        currentChassisSpeed.vxMetersPerSecond * factor,
        currentChassisSpeed.vyMetersPerSecond * factor,
        currentChassisSpeed.omegaRadiansPerSecond * factor
      );

      // Find the max speed of any wheel
      let realMaxSpeed = 0;
      for (const module of moduleStates) {
        realMaxSpeed = Math.max(realMaxSpeed, Math.abs(module.speedMetersPerSecond));
      }

      // If the max speed exceeds the attainable max module speed, scale all wheel speeds
      if (realMaxSpeed > attainableMaxModuleSpeedMetersPerSecond) {
        for (const module of moduleStates) {
          module.speedMetersPerSecond =
            (module.speedMetersPerSecond / realMaxSpeed) * attainableMaxModuleSpeedMetersPerSecond;
        }
      }
    }
  }

  /**
   * Returns the wheel locations.
   *
   * @return The wheel locations.
   */
  public getModuleLocations(): Translation2d[] {
    return [...this.m_modules];
  }

  /**
   * Creates a deep copy of the provided wheel positions.
   *
   * @param wheelPositions The wheel positions to copy.
   * @return A deep copy of the provided wheel positions.
   */
  public copy(wheelPositions: SwerveModulePosition[]): SwerveModulePosition[] {
    return wheelPositions.map(position => position.copy());
  }

  /**
   * Copies the provided wheel positions into the destination wheel positions.
   *
   * @param wheelPositions The wheel positions to copy.
   * @param destinationWheelPositions The wheel positions to copy into.
   */
  public copyInto(
    wheelPositions: SwerveModulePosition[],
    destinationWheelPositions: SwerveModulePosition[]
  ): void {
    for (let i = 0; i < wheelPositions.length; i++) {
      destinationWheelPositions[i].distanceMeters = wheelPositions[i].distanceMeters;
      destinationWheelPositions[i].angle = wheelPositions[i].angle;
    }
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
    start: SwerveModulePosition[],
    end: SwerveModulePosition[],
    t: number
  ): SwerveModulePosition[] {
    if (start.length !== end.length) {
      throw new Error("Start and end wheel positions must have the same length");
    }

    const result: SwerveModulePosition[] = [];
    for (let i = 0; i < start.length; i++) {
      result.push(start[i].interpolate(end[i], t));
    }
    return result;
  }
}
