import { NatNum } from '../Nat';
import { Num } from '../Num';

/**
 * A class representing the number 3.
 */
export class N3 extends Num implements NatNum<N3> {
  private constructor() {
    super();
  }

  /**
   * The integer this class represents.
   *
   * @return The literal number 3.
   */
  public getNum(): number {
    return 3;
  }

  /** The singleton instance of this class. */
  public static readonly instance = new N3();
}
