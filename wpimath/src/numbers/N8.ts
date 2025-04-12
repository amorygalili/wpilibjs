import { NatNum } from '../Nat';
import { Num } from '../Num';

/**
 * A class representing the number 8.
 */
export class N8 extends Num implements NatNum<N8> {
  private constructor() {
    super();
  }

  /**
   * The integer this class represents.
   *
   * @return The literal number 8.
   */
  public getNum(): number {
    return 8;
  }

  /** The singleton instance of this class. */
  public static readonly instance = new N8();
}
