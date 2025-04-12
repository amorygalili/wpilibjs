import { NatNum } from '../Nat';
import { Num } from '../Num';

/**
 * A class representing the number 7.
 */
export class N7 extends Num implements NatNum<N7> {
  private constructor() {
    super();
  }

  /**
   * The integer this class represents.
   *
   * @return The literal number 7.
   */
  public getNum(): number {
    return 7;
  }

  /** The singleton instance of this class. */
  public static readonly instance = new N7();
}
