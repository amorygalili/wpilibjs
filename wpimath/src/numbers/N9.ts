import { NatNum } from '../Nat';
import { Num } from '../Num';

/**
 * A class representing the number 9.
 */
export class N9 extends Num implements NatNum<N9> {
  private constructor() {
    super();
  }

  /**
   * The integer this class represents.
   *
   * @return The literal number 9.
   */
  public getNum(): number {
    return 9;
  }

  /** The singleton instance of this class. */
  public static readonly instance = new N9();
}
