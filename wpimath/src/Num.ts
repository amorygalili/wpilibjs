/**
 * A number expressed as a TypeScript class.
 */
export abstract class Num {
  /**
   * The number this is backing.
   *
   * @return The number represented by this class.
   */
  public abstract getNum(): number;
}
