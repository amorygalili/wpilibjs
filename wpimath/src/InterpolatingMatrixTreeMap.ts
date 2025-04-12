import { Matrix } from './Matrix';
import { Num } from './Num';
import { NatNum } from './Nat';

/**
 * Interpolating Tree Maps are used to get values at points that are not defined by making a guess
 * from points that are defined. This uses linear interpolation.
 *
 * @param K Key type.
 * @param R Number of matrix rows.
 * @param C Number of matrix columns.
 */
export class InterpolatingMatrixTreeMap<K extends number, R extends Num, C extends Num> {
  private readonly m_map = new Map<K, Matrix<R, C>>();
  private readonly m_sortedKeys: K[] = [];

  /** Default constructor. */
  constructor() {}

  /**
   * Inserts a key-value pair.
   *
   * @param key The key.
   * @param value The value.
   */
  public put(key: K, value: Matrix<R, C>): void {
    this.m_map.set(key, value);

    // Update sorted keys
    if (!this.m_sortedKeys.includes(key)) {
      this.m_sortedKeys.push(key);
      this.m_sortedKeys.sort((a, b) => a - b);
    }
  }

  /**
   * Returns the value associated with a given key.
   *
   * <p>If there's no matching key, the value returned will be a linear interpolation between the
   * keys before and after the provided one.
   *
   * @param key The key.
   * @return The value associated with the given key.
   */
  public get(key: K): Matrix<R, C> {
    const val = this.m_map.get(key);
    if (val === undefined) {
      // Find ceiling and floor keys
      const ceilingKeyIndex = this.m_sortedKeys.findIndex(k => k >= key);

      let ceilingKey: K | undefined;
      let floorKey: K | undefined;

      if (ceilingKeyIndex !== -1) {
        ceilingKey = this.m_sortedKeys[ceilingKeyIndex];
        if (ceilingKeyIndex > 0) {
          floorKey = this.m_sortedKeys[ceilingKeyIndex - 1];
        }
      } else if (this.m_sortedKeys.length > 0) {
        // If no ceiling key, use the last key as floor
        floorKey = this.m_sortedKeys[this.m_sortedKeys.length - 1];
      }

      if (ceilingKey === undefined && floorKey === undefined) {
        throw new Error('No values in map');
      }
      if (ceilingKey === undefined) {
        return this.m_map.get(floorKey!)!;
      }
      if (floorKey === undefined) {
        return this.m_map.get(ceilingKey)!;
      }

      const floor = this.m_map.get(floorKey)!;
      const ceiling = this.m_map.get(ceilingKey)!;

      return this.interpolate(floor, ceiling, this.inverseInterpolate(ceilingKey, key, floorKey));
    } else {
      return val;
    }
  }

  /**
   * Return the value interpolated between val1 and val2 by the interpolant d.
   *
   * @param val1 The lower part of the interpolation range.
   * @param val2 The upper part of the interpolation range.
   * @param d The interpolant in the range [0, 1].
   * @return The interpolated value.
   */
  public interpolate(val1: Matrix<R, C>, val2: Matrix<R, C>, d: number): Matrix<R, C> {
    const dydx = val2.minus(val1);
    return dydx.times(d as number).plus(val1);
  }

  /**
   * Return where within interpolation range [0, 1] q is between down and up.
   *
   * @param up Upper part of interpolation range.
   * @param q Query.
   * @param down Lower part of interpolation range.
   * @return Interpolant in range [0, 1].
   */
  public inverseInterpolate(up: K, q: K, down: K): number {
    const upperToLower = up - down;
    if (upperToLower <= 0) {
      return 0.0;
    }
    const queryToLower = q - down;
    if (queryToLower <= 0) {
      return 0.0;
    }
    return queryToLower / upperToLower;
  }
}
