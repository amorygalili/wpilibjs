import { CircularBuffer } from './CircularBuffer';

describe('CircularBuffer', () => {
  describe('constructors', () => {
    it('should create a CircularBuffer with the given capacity', () => {
      const buffer = new CircularBuffer<number>(5);
      expect(buffer.capacity()).toBe(5);
      expect(buffer.size()).toBe(0);
      expect(buffer.isEmpty()).toBe(true);
      expect(buffer.isFull()).toBe(false);
    });
  });

  describe('addFirst', () => {
    it('should add elements to the front of the buffer', () => {
      const buffer = new CircularBuffer<number>(3);
      
      buffer.addFirst(1);
      expect(buffer.getFirst()).toBe(1);
      expect(buffer.getLast()).toBe(1);
      expect(buffer.size()).toBe(1);
      
      buffer.addFirst(2);
      expect(buffer.getFirst()).toBe(2);
      expect(buffer.getLast()).toBe(1);
      expect(buffer.size()).toBe(2);
      
      buffer.addFirst(3);
      expect(buffer.getFirst()).toBe(3);
      expect(buffer.getLast()).toBe(1);
      expect(buffer.size()).toBe(3);
      
      // Buffer is now full
      expect(buffer.isFull()).toBe(true);
      
      // Adding another element should overwrite the oldest element
      buffer.addFirst(4);
      expect(buffer.getFirst()).toBe(4);
      expect(buffer.getLast()).toBe(2);
      expect(buffer.size()).toBe(3);
    });
  });

  describe('addLast', () => {
    it('should add elements to the back of the buffer', () => {
      const buffer = new CircularBuffer<number>(3);
      
      buffer.addLast(1);
      expect(buffer.getFirst()).toBe(1);
      expect(buffer.getLast()).toBe(1);
      expect(buffer.size()).toBe(1);
      
      buffer.addLast(2);
      expect(buffer.getFirst()).toBe(1);
      expect(buffer.getLast()).toBe(2);
      expect(buffer.size()).toBe(2);
      
      buffer.addLast(3);
      expect(buffer.getFirst()).toBe(1);
      expect(buffer.getLast()).toBe(3);
      expect(buffer.size()).toBe(3);
      
      // Buffer is now full
      expect(buffer.isFull()).toBe(true);
      
      // Adding another element should overwrite the oldest element
      buffer.addLast(4);
      expect(buffer.getFirst()).toBe(2);
      expect(buffer.getLast()).toBe(4);
      expect(buffer.size()).toBe(3);
    });
  });

  describe('get and set', () => {
    it('should get and set elements at specific indices', () => {
      const buffer = new CircularBuffer<number>(3);
      
      buffer.addLast(1);
      buffer.addLast(2);
      buffer.addLast(3);
      
      expect(buffer.get(0)).toBe(1);
      expect(buffer.get(1)).toBe(2);
      expect(buffer.get(2)).toBe(3);
      
      buffer.set(1, 5);
      expect(buffer.get(1)).toBe(5);
      
      // Index out of bounds
      expect(() => buffer.get(3)).toThrow();
      expect(() => buffer.set(3, 6)).toThrow();
    });
  });

  describe('clear', () => {
    it('should clear the buffer', () => {
      const buffer = new CircularBuffer<number>(3);
      
      buffer.addLast(1);
      buffer.addLast(2);
      
      buffer.clear();
      
      expect(buffer.size()).toBe(0);
      expect(buffer.isEmpty()).toBe(true);
    });
  });

  describe('mixed operations', () => {
    it('should handle mixed addFirst and addLast operations', () => {
      const buffer = new CircularBuffer<number>(5);
      
      buffer.addLast(1);
      buffer.addLast(2);
      buffer.addFirst(3);
      buffer.addLast(4);
      buffer.addFirst(5);
      
      expect(buffer.size()).toBe(5);
      expect(buffer.isFull()).toBe(true);
      
      expect(buffer.getFirst()).toBe(5);
      expect(buffer.getLast()).toBe(4);
      expect(buffer.get(1)).toBe(3);
      expect(buffer.get(2)).toBe(1);
      expect(buffer.get(3)).toBe(2);
    });
  });
});
