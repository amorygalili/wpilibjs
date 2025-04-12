import { NatNum } from '../Nat';
import { Num } from '../Num';

/**
 * A class representing the number 0.
 */
export class N0 extends Num implements NatNum<N0> {
  private constructor() {
    super();
  }

  /**
   * The integer this class represents.
   *
   * @return The literal number 0.
   */
  public getNum(): number {
    return 0;
  }

  /** The singleton instance of this class. */
  public static readonly instance = new N0();
}
