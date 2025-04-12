import { DifferentialDriveKinematics } from '../kinematics/DifferentialDriveKinematics';
import { DifferentialDriveWheelSpeeds } from '../kinematics/DifferentialDriveWheelSpeeds';
import { Pose2d } from '../geometry/Pose2d';
import { Matrix } from '../Matrix';
import { Nat } from '../Nat';

import { DARE } from '../DARE';
import { InterpolatingMatrixTreeMap } from '../InterpolatingMatrixTreeMap';
import { Discretization } from '../system/Discretization';

/**
 * The linear time-varying differential drive controller has a similar form to the LQR, but the
 * model used to compute the controller gain is the linearized model around the drivetrain's current
 * state.
 *
 * <p>The control law is u = K(x - x_d) + u_d. The feedforward term u_d is the input that
 * realizes the desired trajectory x_d. The feedback gain matrix K is recomputed around the
 * drivetrain's current state at each timestep.
 *
 * <p>This controller uses the differential drive model, which more accurately represents a
 * drivetrain's dynamics than the unicycle model. This makes the feedback controller more
 * accurately track the reference trajectory than a controller based on the unicycle model.
 *
 * <p>For more on the differential drive model, see section 8.2 in
 * https://file.tavsys.net/control/controls-engineering-in-frc.pdf.
 *
 * <p>For more on the LTV controller, see section 8.4 in
 * https://file.tavsys.net/control/state-space-guide.pdf.
 *
 * <p>This controller is more computationally expensive than a controller based on the unicycle
 * model, but the feedback controller more accurately tracks the reference trajectory. This
 * controller is a drop-in replacement for {@link RamseteController}.
 *
 * <p>The unicycle model can be derived from the differential drive model by replacing the left and
 * right wheel velocities with a forward velocity and an angular velocity. By using the differential
 * drive model directly, we don't have to make this simplification and can achieve better
 * performance.
 *
 * <p>The paper "Control of Wheeled Mobile Robots: An Experimental Overview"
 * (https://www.dis.uniroma1.it/~labrob/pub/papers/Ramsete01.pdf) describes a unicycle model
 * controller, but LQR provides better tracking of the reference trajectory in exchange for being
 * more computationally expensive. This controller uses a differential drive model, which is more
 * accurate than a unicycle model, and the feedback controller is computed using LQR.
 *
 * <p>This controller can be combined with the {@link DifferentialDriveWheelSpeeds} class to
 * generate left and right wheel velocities.
 *
 * <p>The control law is u = K(x - x_d) + u_d. The feedforward term u_d is the input that
 * realizes the desired trajectory x_d. The feedback gain matrix K is recomputed around the
 * drivetrain's current state at each timestep.
 *
 * <p>See section 8.7 in Controls Engineering in FRC for a derivation of the control law we used
 * shown in theorem 8.7.4.
 */
export class LTVDifferentialDriveController {
  private readonly m_trackwidth: number;

  // LUT from drivetrain linear velocity to LQR gain
  private readonly m_table = new InterpolatingMatrixTreeMap<number, any, any>();

  private m_enabled: boolean;
  private m_poseError = new Pose2d();

  /**
   * States of the drivetrain system.
   */
  private static readonly State = {
    kX: 0,
    kY: 1,
    kHeading: 2,
    kLeftVelocity: 3,
    kRightVelocity: 4
  } as const;

  /**
   * Constructs a linear time-varying differential drive controller.
   *
   * @param trackwidth The trackwidth of the drivetrain.
   * @param Qelems The maximum desired error tolerance for each state.
   * @param Relems The maximum desired control effort for each input.
   * @param dt The discretization timestep.
   */
  constructor(
    trackwidth: number,
    Qelems: [number, number, number, number, number],
    Relems: [number, number],
    dt: number
  ) {
    this.m_trackwidth = trackwidth;
    this.m_enabled = true;

    // Discretization timestep
    const dtSeconds = dt;

    // Continuous-time LTI system matrices
    const A = Matrix.mat(Nat.N5(), Nat.N5()).fill(
      0, 0, 0, 0.5, 0.5,
      0, 0, 0, 0, 0,
      0, 0, 0, -1.0 / trackwidth, 1.0 / trackwidth,
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0
    );
    const B = Matrix.mat(Nat.N5(), Nat.N2()).fill(
      0, 0,
      0, 0,
      0, 0,
      1, 0,
      0, 1
    );

    // Continuous-time LQR cost matrices
    const Q = Matrix.mat(Nat.N5(), Nat.N5()).fill(
      1.0 / (Qelems[0] * Qelems[0]), 0, 0, 0, 0,
      0, 1.0 / (Qelems[1] * Qelems[1]), 0, 0, 0,
      0, 0, 1.0 / (Qelems[2] * Qelems[2]), 0, 0,
      0, 0, 0, 1.0 / (Qelems[3] * Qelems[3]), 0,
      0, 0, 0, 0, 1.0 / (Qelems[4] * Qelems[4])
    );
    const R = Matrix.mat(Nat.N2(), Nat.N2()).fill(
      1.0 / (Relems[0] * Relems[0]), 0,
      0, 1.0 / (Relems[1] * Relems[1])
    );

    // Solve for LQR gains for different velocities
    const maxV = 10.0;
    for (let velocity = -maxV; velocity < maxV; velocity += 0.01) {
      // The DARE is ill-conditioned if the velocity is close to zero, so don't
      // let the system stop.
      if (Math.abs(velocity) < 1e-4) {
        A.set(LTVDifferentialDriveController.State.kY, LTVDifferentialDriveController.State.kHeading, 1e-4);
      } else {
        A.set(LTVDifferentialDriveController.State.kY, LTVDifferentialDriveController.State.kHeading, velocity);
      }

      const discABPair = Discretization.discretizeAB(A, B, dtSeconds);
      const discA = discABPair.getFirst();
      const discB = discABPair.getSecond();

      const S = DARE.dareNoPrecond(discA, discB, Q, R);

      // K = (BᵀSB + R)⁻¹BᵀSA
      const K = discB.transpose()
        .times(S)
        .times(discB)
        .plus(R)
        .solve(discB.transpose().times(S).times(discA));

      this.m_table.put(velocity, K);
    }
  }

  /**
   * Returns the error between the current pose and the desired pose.
   *
   * @return The pose error.
   */
  public getPoseError(): Pose2d {
    return this.m_poseError;
  }

  /**
   * Returns the next output of the controller.
   *
   * @param currentPose The current pose.
   * @param leftVelocity The current left wheel velocity.
   * @param rightVelocity The current right wheel velocity.
   * @param poseRef The desired pose.
   * @param leftVelocityRef The desired left wheel velocity.
   * @param rightVelocityRef The desired right wheel velocity.
   * @return The next output of the controller.
   */
  public calculate(
    currentPose: Pose2d,
    leftVelocity: number,
    rightVelocity: number,
    poseRef: Pose2d,
    leftVelocityRef: number,
    rightVelocityRef: number
  ): DifferentialDriveWheelSpeeds {
    if (!this.m_enabled) {
      return new DifferentialDriveWheelSpeeds(leftVelocityRef, rightVelocityRef);
    }

    // Calculate the pose error in the robot's coordinate frame
    // We want e = x_d - x (desired - current) in the robot's coordinate frame
    this.m_poseError = poseRef.relativeTo(currentPose);

    // Handle the rotation error specially
    // The issue is that the rotation in the trajectory is in the range [0, 2π]
    // but our controller is working with a different range
    let rotationError = poseRef.getRotation().getRadians() - currentPose.getRotation().getRadians();

    // Normalize the rotation error to the range [-π, π]
    while (rotationError > Math.PI) rotationError -= 2 * Math.PI;
    while (rotationError < -Math.PI) rotationError += 2 * Math.PI;

    // Select the gain matrix based on the desired linear velocity
    const linearVelocity = (leftVelocityRef + rightVelocityRef) / 2.0;
    const K = this.m_table.get(linearVelocity);

    // Apply a position gain factor to improve tracking
    const positionGain = 5.0;
    const rotationGain = 3.0;

    // Create the state vector
    const e = [
      this.m_poseError.getX() * positionGain,
      this.m_poseError.getY() * positionGain,
      rotationError * rotationGain,
      leftVelocityRef - leftVelocity,  // Velocity error
      rightVelocityRef - rightVelocity  // Velocity error
    ];
    const u = K.times(Matrix.mat(Nat.N5(), Nat.N1()).fill(...e));

    // Calculate the wheel speeds with enhanced correction
    // Apply a stronger correction factor to improve tracking
    const correctionFactor = 2.0;
    const leftCorrection = u.get(0, 0) * correctionFactor;
    const rightCorrection = u.get(1, 0) * correctionFactor;

    return new DifferentialDriveWheelSpeeds(
      leftVelocityRef + leftCorrection,
      rightVelocityRef + rightCorrection
    );
  }

  /**
   * Enables and disables the controller for troubleshooting purposes.
   *
   * @param enabled If the controller is enabled.
   */
  public setEnabled(enabled: boolean): void {
    this.m_enabled = enabled;
  }
}
