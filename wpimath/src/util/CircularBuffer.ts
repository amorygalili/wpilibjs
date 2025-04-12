/**
 * This is a simple circular buffer implementation for storing values of type T.
 */
export class CircularBuffer<T> {
  private m_data: T[];
  private m_front = 0;
  private m_length = 0;
  private m_capacity: number;

  /**
   * Create a new CircularBuffer with the provided capacity.
   *
   * @param capacity The capacity of the buffer.
   */
  constructor(capacity: number) {
    this.m_capacity = capacity;
    this.m_data = new Array<T>(capacity);
  }

  /**
   * Add an element to the front of the buffer.
   *
   * @param value The value to add to the buffer.
   */
  public addFirst(value: T): void {
    if (this.m_length < this.m_capacity) {
      this.m_front = this.decrementFront();
      this.m_data[this.m_front] = value;
      this.m_length++;
    } else {
      this.m_front = this.decrementFront();
      this.m_data[this.m_front] = value;
    }
  }

  /**
   * Add an element to the back of the buffer.
   *
   * @param value The value to add to the buffer.
   */
  public addLast(value: T): void {
    if (this.m_length < this.m_capacity) {
      this.m_data[(this.m_front + this.m_length) % this.m_capacity] = value;
      this.m_length++;
    } else {
      this.m_data[this.m_front] = value;
      this.m_front = this.incrementFront();
    }
  }

  /**
   * Get the element at the front of the buffer.
   *
   * @return The element at the front of the buffer.
   */
  public getFirst(): T {
    return this.m_data[this.m_front];
  }

  /**
   * Get the element at the back of the buffer.
   *
   * @return The element at the back of the buffer.
   */
  public getLast(): T {
    return this.m_data[(this.m_front + this.m_length - 1) % this.m_capacity];
  }

  /**
   * Get the element at the specified index of the buffer.
   *
   * @param index The index of the element to get.
   * @return The element at the specified index.
   */
  public get(index: number): T {
    if (index >= this.m_length) {
      throw new Error(`Index ${index} out of bounds for length ${this.m_length}`);
    }
    return this.m_data[(this.m_front + index) % this.m_capacity];
  }

  /**
   * Set the element at the specified index of the buffer.
   *
   * @param index The index of the element to set.
   * @param value The value to set.
   */
  public set(index: number, value: T): void {
    if (index >= this.m_length) {
      throw new Error(`Index ${index} out of bounds for length ${this.m_length}`);
    }
    this.m_data[(this.m_front + index) % this.m_capacity] = value;
  }

  /**
   * Get the size of the buffer.
   *
   * @return The size of the buffer.
   */
  public size(): number {
    return this.m_length;
  }

  /**
   * Get the capacity of the buffer.
   *
   * @return The capacity of the buffer.
   */
  public capacity(): number {
    return this.m_capacity;
  }

  /**
   * Clear the buffer.
   */
  public clear(): void {
    this.m_front = 0;
    this.m_length = 0;
  }

  /**
   * Check if the buffer is empty.
   *
   * @return True if the buffer is empty, false otherwise.
   */
  public isEmpty(): boolean {
    return this.m_length === 0;
  }

  /**
   * Check if the buffer is full.
   *
   * @return True if the buffer is full, false otherwise.
   */
  public isFull(): boolean {
    return this.m_length === this.m_capacity;
  }

  /**
   * Increment the front of the buffer.
   *
   * @return The new front of the buffer.
   */
  private incrementFront(): number {
    return (this.m_front + 1) % this.m_capacity;
  }

  /**
   * Decrement the front of the buffer.
   *
   * @return The new front of the buffer.
   */
  private decrementFront(): number {
    return (this.m_front + this.m_capacity - 1) % this.m_capacity;
  }
}
