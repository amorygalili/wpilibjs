import { NatNum } from '../Nat';
import { Num } from '../Num';

/**
 * A class representing the number 10.
 */
export class N10 extends Num implements NatNum<N10> {
  private constructor() {
    super();
  }

  /**
   * The integer this class represents.
   *
   * @return The literal number 10.
   */
  public getNum(): number {
    return 10;
  }

  /** The singleton instance of this class. */
  public static readonly instance = new N10();
}
