import { NatNum } from '../Nat';
import { Num } from '../Num';

/**
 * A class representing the number 1.
 */
export class N1 extends Num implements NatNum<N1> {
  private constructor() {
    super();
  }

  /**
   * The integer this class represents.
   *
   * @return The literal number 1.
   */
  public getNum(): number {
    return 1;
  }

  /** The singleton instance of this class. */
  public static readonly instance = new N1();
}
