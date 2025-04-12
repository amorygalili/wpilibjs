import { NatNum } from '../Nat';
import { Num } from '../Num';

/**
 * A class representing the number 6.
 */
export class N6 extends Num implements NatNum<N6> {
  private constructor() {
    super();
  }

  /**
   * The integer this class represents.
   *
   * @return The literal number 6.
   */
  public getNum(): number {
    return 6;
  }

  /** The singleton instance of this class. */
  public static readonly instance = new N6();
}
