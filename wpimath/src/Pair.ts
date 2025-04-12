/**
 * A simple container for storing two values.
 *
 * @param <F> The type of the first value.
 * @param <S> The type of the second value.
 */
export class Pair<F, S> {
  private readonly m_first: F;
  private readonly m_second: S;

  /**
   * Constructs a Pair with the given values.
   *
   * @param first The first value.
   * @param second The second value.
   */
  constructor(first: F, second: S) {
    this.m_first = first;
    this.m_second = second;
  }

  /**
   * Returns the first value.
   *
   * @return The first value.
   */
  public getFirst(): F {
    return this.m_first;
  }

  /**
   * Returns the second value.
   *
   * @return The second value.
   */
  public getSecond(): S {
    return this.m_second;
  }

  /**
   * Returns a string representation of this pair.
   *
   * @return A string representation of this pair.
   */
  public toString(): string {
    return `(${this.m_first}, ${this.m_second})`;
  }
}
