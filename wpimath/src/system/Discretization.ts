import { Matrix } from '../Matrix';
import { Num } from '../Num';
import { Pair } from '../Pair';
import { NatNum } from '../Nat';

/**
 * Discretization helper functions.
 */
export class Discretization {
  /**
   * Discretizes the given continuous A matrix.
   *
   * @param contA Continuous system matrix.
   * @param dtSeconds Discretization timestep.
   * @return the discrete matrix system.
   */
  public static discretizeA<States extends Num>(
    contA: Matrix<States, States>,
    dtSeconds: number
  ): Matrix<States, States> {
    // A_d = eᴬᵀ
    return contA.times(dtSeconds as number).exp();
  }

  /**
   * Discretizes the given continuous A and B matrices.
   *
   * @param contA Continuous system matrix.
   * @param contB Continuous input matrix.
   * @param dtSeconds Discretization timestep.
   * @return a Pair representing discA and diskB.
   */
  public static discretizeAB<States extends Num, Inputs extends Num>(
    contA: Matrix<States, States>,
    contB: Matrix<States, Inputs>,
    dtSeconds: number
  ): Pair<Matrix<States, States>, Matrix<States, Inputs>> {
    const states = contA.getNumRows();
    const inputs = contB.getNumCols();

    // M = [A  B]
    //     [0  0]
    const M = Matrix.mat((states + inputs) as unknown as NatNum<any>, (states + inputs) as unknown as NatNum<any>);
    M.assignBlock(0, 0, contA);
    M.assignBlock(0, contA.getNumCols(), contB);

    //  ϕ = eᴹᵀ = [A_d  B_d]
    //            [ 0    I ]
    const phi = M.times(dtSeconds as number).exp();

    const discA = Matrix.mat(states as unknown as NatNum<any>, states as unknown as NatNum<any>);
    discA.extractFrom(0, 0, phi);

    const discB = Matrix.mat(states as unknown as NatNum<any>, inputs as unknown as NatNum<any>);
    discB.extractFrom(0, contB.getNumRows(), phi);

    return new Pair<Matrix<States, States>, Matrix<States, Inputs>>(discA, discB);
  }

  /**
   * Discretizes the given continuous A and Q matrices.
   *
   * @param contA Continuous system matrix.
   * @param contQ Continuous process noise covariance matrix.
   * @param dtSeconds Discretization timestep.
   * @return a pair representing the discrete system matrix and process noise covariance matrix.
   */
  public static discretizeAQ<States extends Num>(
    contA: Matrix<States, States>,
    contQ: Matrix<States, States>,
    dtSeconds: number
  ): Pair<Matrix<States, States>, Matrix<States, States>> {
    const states = contA.getNumRows();

    // Make continuous Q symmetric if it isn't already
    let symmetricQ = contQ.plus(contQ.transpose()).div(2.0);

    // M = [−A  Q ]
    //     [ 0  Aᵀ]
    const M = Matrix.mat((2 * states) as unknown as NatNum<any>, (2 * states) as unknown as NatNum<any>);
    M.assignBlock(0, 0, contA.times(-1.0));
    M.assignBlock(0, states, symmetricQ);
    M.assignBlock(states, 0, Matrix.mat(states as unknown as NatNum<any>, states as unknown as NatNum<any>));
    M.assignBlock(states, states, contA.transpose());

    // ϕ = eᴹᵀ = [−A_d  A_d⁻¹Q_d]
    //           [ 0      A_dᵀ  ]
    const phi = M.times(dtSeconds as number).exp();

    // ϕ₁₂ = A_d⁻¹Q_d
    const phi12 = phi.block<States, States>(0, states, states, states);

    // ϕ₂₂ = A_dᵀ
    const phi22 = phi.block<States, States>(states, states, states, states);

    const discA = phi22.transpose();

    const discQAsym = discA.times(phi12);

    // Make discrete Q symmetric if it isn't already
    const discQ = discQAsym.plus(discQAsym.transpose()).div(2.0);

    return new Pair<Matrix<States, States>, Matrix<States, States>>(discA, discQ);
  }

  /**
   * Returns a discretized version of the provided continuous measurement noise covariance matrix.
   * Note that dt=0.0 divides R by zero.
   *
   * @param contR Continuous measurement noise covariance matrix.
   * @param dtSeconds Discretization timestep.
   * @return Discretized version of the provided continuous measurement noise covariance matrix.
   */
  public static discretizeR<O extends Num>(
    contR: Matrix<O, O>,
    dtSeconds: number
  ): Matrix<O, O> {
    // R_d = 1/T R
    return contR.div(dtSeconds);
  }
}
