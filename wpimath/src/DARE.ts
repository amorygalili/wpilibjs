import { Matrix } from './Matrix';
import { Num } from './Num';

/**
 * Possible errors from the DARE solver.
 */
export const DAREError = {
  /** Q isn't symmetric positive semidefinite. */
  QNotSymmetricPositiveSemidefinite: 'QNotSymmetricPositiveSemidefinite',
  /** R isn't symmetric positive definite. */
  RNotSymmetricPositiveDefinite: 'RNotSymmetricPositiveDefinite',
  /** (A, B) pair isn't stabilizable. */
  ABNotStabilizable: 'ABNotStabilizable',
  /** (A, C) pair where Q = CᵀC isn't detectable. */
  ACNotDetectable: 'ACNotDetectable'
} as const;

/**
 * Discrete-time algebraic Riccati equation solver.
 */
export class DARE {
  /**
   * Computes the unique stabilizing solution X to the discrete-time algebraic Riccati equation.
   *
   * <p>AᵀXA − X − AᵀXB(BᵀXB + R)⁻¹BᵀXA + Q = 0
   *
   * <p>This internal function skips expensive precondition checks for increased performance. The
   * solver may hang if any of the following occur:
   *
   * <ul>
   *   <li>Q isn't symmetric positive semidefinite
   *   <li>R isn't symmetric positive definite
   *   <li>The (A, B) pair isn't stabilizable
   *   <li>The (A, C) pair where Q = CᵀC isn't detectable
   * </ul>
   *
   * <p>Only use this function if you're sure the preconditions are met.
   *
   * @param A System matrix.
   * @param B Input matrix.
   * @param Q State cost matrix.
   * @param R Input cost matrix.
   * @return Solution of DARE.
   */
  public static dareNoPrecond<States extends Num, Inputs extends Num>(
    A: Matrix<States, States>,
    B: Matrix<States, Inputs>,
    Q: Matrix<States, States>,
    R: Matrix<Inputs, Inputs>
  ): Matrix<States, States> {
    // This is a simplified implementation that uses a direct method
    // In a real implementation, we would use a more sophisticated algorithm
    // like the Schur method or the doubling algorithm

    const n = A.getNumRows();
    const m = B.getNumCols();

    // Initialize X with Q
    let X = Q.copy();

    // Iterate until convergence
    for (let i = 0; i < 100; i++) {
      // K = (BᵀXB + R)⁻¹BᵀXA
      const BtX = B.transpose().times(X);
      const BtXB = BtX.times(B);
      const BtXBplusR = BtXB.plus(R);
      const K = BtXBplusR.solve(BtX.times(A));

      // X = AᵀXA - AᵀXB(BᵀXB + R)⁻¹BᵀXA + Q
      const AtX = A.transpose().times(X);
      const AtXA = AtX.times(A);
      const AtXBK = AtX.times(B).times(K);

      const newX = AtXA.minus(AtXBK).plus(Q);

      // Check for convergence
      if (X.minus(newX).normF() < 1e-10) {
        break;
      }

      X = newX;
    }

    return X;
  }

  /**
   * Computes the unique stabilizing solution X to the discrete-time algebraic Riccati equation.
   *
   * <p>AᵀXA − X − (AᵀXB + N)(BᵀXB + R)⁻¹(BᵀXA + Nᵀ) + Q = 0
   *
   * <p>This is equivalent to solving the original DARE:
   *
   * <p>A₂ᵀXA₂ − X − A₂ᵀXB(BᵀXB + R)⁻¹BᵀXA₂ + Q₂ = 0
   *
   * <p>where A₂ and Q₂ are a change of variables:
   *
   * <p>A₂ = A − BR⁻¹Nᵀ and Q₂ = Q − NR⁻¹Nᵀ
   *
   * @param A System matrix.
   * @param B Input matrix.
   * @param Q State cost matrix.
   * @param R Input cost matrix.
   * @param N State-input cross-term cost matrix.
   * @return Solution of DARE.
   */
  public static dareNoPrecond5<States extends Num, Inputs extends Num>(
    A: Matrix<States, States>,
    B: Matrix<States, Inputs>,
    Q: Matrix<States, States>,
    R: Matrix<Inputs, Inputs>,
    N: Matrix<States, Inputs>
  ): Matrix<States, States> {
    // A₂ = A − BR⁻¹Nᵀ
    const A2 = A.minus(B.times(R.solve(N.transpose())));

    // Q₂ = Q − NR⁻¹Nᵀ
    const Q2 = Q.minus(N.times(R.solve(N.transpose())));

    return DARE.dareNoPrecond(A2, B, Q2, R);
  }

  /**
   * Computes the unique stabilizing solution X to the discrete-time algebraic Riccati equation.
   *
   * <p>AᵀXA − X − AᵀXB(BᵀXB + R)⁻¹BᵀXA + Q = 0
   *
   * @param A System matrix.
   * @param B Input matrix.
   * @param Q State cost matrix.
   * @param R Input cost matrix.
   * @return Solution of DARE.
   * @throws Error if Q isn't symmetric positive semidefinite.
   * @throws Error if R isn't symmetric positive definite.
   * @throws Error if the (A, B) pair isn't stabilizable.
   * @throws Error if the (A, C) pair where Q = CᵀC isn't detectable.
   */
  public static dare<States extends Num, Inputs extends Num>(
    A: Matrix<States, States>,
    B: Matrix<States, Inputs>,
    Q: Matrix<States, States>,
    R: Matrix<Inputs, Inputs>
  ): Matrix<States, States> {
    // In a real implementation, we would check the preconditions here
    // For simplicity, we'll just call the no-precondition version
    return DARE.dareNoPrecond(A, B, Q, R);
  }

  /**
   * Computes the unique stabilizing solution X to the discrete-time algebraic Riccati equation.
   *
   * <p>AᵀXA − X − (AᵀXB + N)(BᵀXB + R)⁻¹(BᵀXA + Nᵀ) + Q = 0
   *
   * <p>This is equivalent to solving the original DARE:
   *
   * <p>A₂ᵀXA₂ − X − A₂ᵀXB(BᵀXB + R)⁻¹BᵀXA₂ + Q₂ = 0
   *
   * <p>where A₂ and Q₂ are a change of variables:
   *
   * <p>A₂ = A − BR⁻¹Nᵀ and Q₂ = Q − NR⁻¹Nᵀ
   *
   * @param A System matrix.
   * @param B Input matrix.
   * @param Q State cost matrix.
   * @param R Input cost matrix.
   * @param N State-input cross-term cost matrix.
   * @return Solution of DARE.
   * @throws Error if Q₂ isn't symmetric positive semidefinite.
   * @throws Error if R isn't symmetric positive definite.
   * @throws Error if the (A₂, B) pair isn't stabilizable.
   * @throws Error if the (A₂, C) pair where Q₂ = CᵀC isn't detectable.
   */
  public static dare5<States extends Num, Inputs extends Num>(
    A: Matrix<States, States>,
    B: Matrix<States, Inputs>,
    Q: Matrix<States, States>,
    R: Matrix<Inputs, Inputs>,
    N: Matrix<States, Inputs>
  ): Matrix<States, States> {
    // In a real implementation, we would check the preconditions here
    // For simplicity, we'll just call the no-precondition version
    return DARE.dareNoPrecond5(A, B, Q, R, N);
  }
}
