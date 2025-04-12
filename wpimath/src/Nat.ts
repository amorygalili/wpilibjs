import { Num } from './Num';
import { N0 } from './numbers/N0';
import { N1 } from './numbers/N1';
import { N2 } from './numbers/N2';
import { N3 } from './numbers/N3';
import { N4 } from './numbers/N4';
import { N5 } from './numbers/N5';
import { N6 } from './numbers/N6';
import { N7 } from './numbers/N7';
import { N8 } from './numbers/N8';
import { N9 } from './numbers/N9';
import { N10 } from './numbers/N10';

/**
 * A natural number expressed as a TypeScript class.
 * The counterpart to {@link Num} that should be used as a concrete value.
 *
 * @param T The {@link Num} this represents.
 */
export interface NatNum<T extends Num> {
  /**
   * The number this interface represents.
   *
   * @return The number backing this value.
   */
  getNum(): number;
}

/**
 * Static methods for creating Nat instances.
 */
export class Nat {
  /**
   * Returns the Nat instance for 0.
   *
   * @return The Nat instance for 0.
   */
  public static N0(): NatNum<N0> {
    return N0.instance;
  }

  /**
   * Returns the Nat instance for 1.
   *
   * @return The Nat instance for 1.
   */
  public static N1(): NatNum<N1> {
    return N1.instance;
  }

  /**
   * Returns the Nat instance for 2.
   *
   * @return The Nat instance for 2.
   */
  public static N2(): NatNum<N2> {
    return N2.instance;
  }

  /**
   * Returns the Nat instance for 3.
   *
   * @return The Nat instance for 3.
   */
  public static N3(): NatNum<N3> {
    return N3.instance;
  }

  /**
   * Returns the Nat instance for 4.
   *
   * @return The Nat instance for 4.
   */
  public static N4(): NatNum<N4> {
    return N4.instance;
  }

  /**
   * Returns the Nat instance for 5.
   *
   * @return The Nat instance for 5.
   */
  public static N5(): NatNum<N5> {
    return N5.instance;
  }

  /**
   * Returns the Nat instance for 6.
   *
   * @return The Nat instance for 6.
   */
  public static N6(): NatNum<N6> {
    return N6.instance;
  }

  /**
   * Returns the Nat instance for 7.
   *
   * @return The Nat instance for 7.
   */
  public static N7(): NatNum<N7> {
    return N7.instance;
  }

  /**
   * Returns the Nat instance for 8.
   *
   * @return The Nat instance for 8.
   */
  public static N8(): NatNum<N8> {
    return N8.instance;
  }

  /**
   * Returns the Nat instance for 9.
   *
   * @return The Nat instance for 9.
   */
  public static N9(): NatNum<N9> {
    return N9.instance;
  }

  /**
   * Returns the Nat instance for 10.
   *
   * @return The Nat instance for 10.
   */
  public static N10(): NatNum<N10> {
    return N10.instance;
  }
}
