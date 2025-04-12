import { NatNum } from '../Nat';
import { Num } from '../Num';

/**
 * A class representing the number 2.
 */
export class N2 extends Num implements NatNum<N2> {
  private constructor() {
    super();
  }

  /**
   * The integer this class represents.
   *
   * @return The literal number 2.
   */
  public getNum(): number {
    return 2;
  }

  /** The singleton instance of this class. */
  public static readonly instance = new N2();
}
