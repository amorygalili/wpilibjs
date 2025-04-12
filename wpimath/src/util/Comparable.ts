/**
 * Interface for objects that can be compared to each other.
 */
export interface Comparable<T> {
  /**
   * Compares this object with the specified object for order.
   *
   * @param other The object to be compared.
   * @return A negative integer, zero, or a positive integer as this object is less than, equal to, or greater than the specified object.
   */
  compareTo(other: T): number;
}
