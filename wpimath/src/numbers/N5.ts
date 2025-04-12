import { NatNum } from '../Nat';
import { Num } from '../Num';

/**
 * A class representing the number 5.
 */
export class N5 extends Num implements NatNum<N5> {
  private constructor() {
    super();
  }

  /**
   * The integer this class represents.
   *
   * @return The literal number 5.
   */
  public getNum(): number {
    return 5;
  }

  /** The singleton instance of this class. */
  public static readonly instance = new N5();
}
