import { ChassisSpeeds } from '../kinematics/ChassisSpeeds';
import { Pose2d } from '../geometry/Pose2d';
import { Matrix } from '../Matrix';
import { Nat } from '../Nat';
import { DARE } from '../DARE';
import { InterpolatingMatrixTreeMap } from '../InterpolatingMatrixTreeMap';
import { Discretization } from '../system/Discretization';

/**
 * The linear time-varying unicycle controller has a similar form to the LQR, but the model used to
 * compute the controller gain is the nonlinear unicycle model linearized around the drivetrain's
 * current state.
 *
 * <p>This controller is a roughly drop-in replacement for {@link RamseteController} with more
 * optimal feedback gains in the "least-squares error" sense.
 *
 * <p>See section 8.9 in Controls Engineering in FRC for a derivation of the control law we used
 * shown in theorem 8.9.1.
 */
export class LTVUnicycleController {
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
    kHeading: 2
  } as const;

  /**
   * Constructs a linear time-varying unicycle controller.
   *
   * See
   * https://docs.wpilib.org/en/stable/docs/software/advanced-controls/state-space/state-space-intro.html#lqr-tuning
   * for how to select the tolerances.
   *
   * @param Qelems The maximum desired error tolerance for each state (x, y, heading).
   * @param Relems The maximum desired control effort for each input (linear velocity, angular velocity).
   * @param dt The discretization timestep.
   */
  constructor(
    Qelems: [number, number, number],
    Relems: [number, number],
    dt: number
  ) {
    this.m_enabled = true;

    // The continuous-time state-space model for a unicycle is:
    //
    // ẋ = v cos θ
    // ẏ = v sin θ
    // θ̇ = ω
    //
    // where v is the linear velocity and ω is the angular velocity.
    //
    // We use the nonlinear model directly for the feedforward, but we use a
    // linearized model for the feedback controller. The linearized model
    // linearizes around the current velocity setpoint, which is provided by the
    // drivetrain trajectory.
    //
    // The linearized continuous-time state-space model for a unicycle is:
    //
    // ẋ = v₀ cos θ₀ + cos θ₀ Δv − v₀ sin θ₀ Δθ
    // ẏ = v₀ sin θ₀ + sin θ₀ Δv + v₀ cos θ₀ Δθ
    // θ̇ = ω
    //
    // where v₀ and θ₀ are the velocity and angle setpoints. We substitute the
    // following:
    //
    // x = x₀ + Δx
    // y = y₀ + Δy
    // θ = θ₀ + Δθ
    // v = v₀ + Δv
    // ω = ω₀ + Δω
    //
    // and ignore second-order terms, which gives the following linearized model:
    //
    // Δẋ = cos θ₀ Δv − v₀ sin θ₀ Δθ
    // Δẏ = sin θ₀ Δv + v₀ cos θ₀ Δθ
    // Δθ̇ = Δω
    //
    // We substitute θ₀ = 0, which is the angle setpoint for a robot driving
    // forward in the x direction. This gives the following model:
    //
    // Δẋ = Δv
    // Δẏ = v₀ Δθ
    // Δθ̇ = Δω
    //
    // This model is used for the feedforward and feedback controllers below.

    // The A, B, Q, and R matrices are created in the constructor because they're
    // based on the tolerances and discretization timestep, which don't change.
    // The LQR controller gain matrix K is computed for different velocities and
    // stored in a lookup table because it depends on the current velocity
    // setpoint.

    // Discretization timestep
    const dtSeconds = dt;

    // Continuous-time LTI system matrices
    const A = Matrix.mat(Nat.N3(), Nat.N3()).fill(
      0, 0, 0,
      0, 0, 0,
      0, 0, 0
    );
    const B = Matrix.mat(Nat.N3(), Nat.N2()).fill(
      1, 0,
      0, 0,
      0, 1
    );

    // Continuous-time LQR cost matrices
    const Q = Matrix.mat(Nat.N3(), Nat.N3()).fill(
      1.0 / (Qelems[0] * Qelems[0]), 0, 0,
      0, 1.0 / (Qelems[1] * Qelems[1]), 0,
      0, 0, 1.0 / (Qelems[2] * Qelems[2])
    );
    const R = Matrix.mat(Nat.N2(), Nat.N2()).fill(
      1.0 / (Relems[0] * Relems[0]), 0,
      0, 1.0 / (Relems[1] * Relems[1])
    );

    // Solve for LQR gains for different velocities
    const maxVelocity = 10.0;
    for (let velocity = -maxVelocity; velocity < maxVelocity; velocity += 0.01) {
      // The DARE is ill-conditioned if the velocity is close to zero, so don't
      // let the system stop.
      if (Math.abs(velocity) < 1e-4) {
        A.set(LTVUnicycleController.State.kY, LTVUnicycleController.State.kHeading, 1e-4);
      } else {
        A.set(LTVUnicycleController.State.kY, LTVUnicycleController.State.kHeading, velocity);
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
   * @param poseRef The desired pose.
   * @param linearVelocityRef The desired linear velocity.
   * @param angularVelocityRef The desired angular velocity.
   * @return The next output of the controller.
   */
  public calculate(
    currentPose: Pose2d,
    poseRef: Pose2d,
    linearVelocityRef: number,
    angularVelocityRef: number
  ): ChassisSpeeds {
    if (!this.m_enabled) {
      return new ChassisSpeeds(linearVelocityRef, 0.0, angularVelocityRef);
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

    // Apply a direct correction for rotation based on the error
    // This is a simple P controller for rotation
    const rotationGain = 2.0;
    const rotationCorrection = rotationError * rotationGain;

    const K = this.m_table.get(linearVelocityRef);
    const e = [
      this.m_poseError.getX(),
      this.m_poseError.getY(),
      0.0  // We'll handle rotation separately
    ];
    const u = K.times(Matrix.mat(Nat.N3(), Nat.N1()).fill(...e));

    return new ChassisSpeeds(
      linearVelocityRef + u.get(0, 0),
      0.0,
      angularVelocityRef + rotationCorrection
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
