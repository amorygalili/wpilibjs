import { NatNum } from '../Nat';
import { Num } from '../Num';

/**
 * A class representing the number 4.
 */
export class N4 extends Num implements NatNum<N4> {
  private constructor() {
    super();
  }

  /**
   * The integer this class represents.
   *
   * @return The literal number 4.
   */
  public getNum(): number {
    return 4;
  }

  /** The singleton instance of this class. */
  public static readonly instance = new N4();
}
