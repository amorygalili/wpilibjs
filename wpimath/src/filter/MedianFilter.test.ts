import { MedianFilter } from './MedianFilter';

describe('MedianFilter', () => {
  describe('constructors', () => {
    it('should create a MedianFilter with the given window size', () => {
      const filter = new MedianFilter(5);
      expect(filter.lastValue()).toBeCloseTo(0.0, 9);
    });

    it('should throw an error for invalid window size', () => {
      expect(() => new MedianFilter(0)).toThrow();
      expect(() => new MedianFilter(-1)).toThrow();
    });
  });

  describe('calculate', () => {
    it('should calculate the median correctly for odd window size', () => {
      const filter = new MedianFilter(3);

      // First value is just returned
      expect(filter.calculate(3.0)).toBeCloseTo(3.0, 9);

      // Second value is the median of [3.0, 1.0]
      expect(filter.calculate(1.0)).toBeCloseTo(2.0, 9);

      // Third value is the median of [3.0, 1.0, 2.0]
      expect(filter.calculate(2.0)).toBeCloseTo(2.0, 9);

      // Fourth value replaces the oldest, so median of [1.0, 2.0, 5.0]
      expect(filter.calculate(5.0)).toBeCloseTo(2.0, 9);

      // Fifth value replaces the oldest, so median of [2.0, 5.0, 4.0]
      expect(filter.calculate(4.0)).toBeCloseTo(4.0, 9);
    });

    it('should calculate the median correctly for even window size', () => {
      const filter = new MedianFilter(4);

      // First value is just returned
      expect(filter.calculate(3.0)).toBeCloseTo(3.0, 9);

      // Second value is the median of [3.0, 1.0]
      expect(filter.calculate(1.0)).toBeCloseTo(2.0, 9);

      // Third value is the median of [3.0, 1.0, 2.0]
      expect(filter.calculate(2.0)).toBeCloseTo(2.0, 9);

      // Fourth value is the median of [3.0, 1.0, 2.0, 5.0]
      expect(filter.calculate(5.0)).toBeCloseTo(2.5, 9);

      // Fifth value replaces the oldest, so median of [1.0, 2.0, 5.0, 4.0]
      expect(filter.calculate(4.0)).toBeCloseTo(3.0, 9);
    });

    it('should handle outliers correctly', () => {
      const filter = new MedianFilter(5);

      filter.calculate(1.0);
      filter.calculate(2.0);
      filter.calculate(3.0);
      filter.calculate(4.0);

      // Add an outlier
      expect(filter.calculate(100.0)).toBeCloseTo(3.0, 9);

      // Add another outlier
      expect(filter.calculate(200.0)).toBeCloseTo(4.0, 9);
    });
  });

  describe('reset', () => {
    it('should reset the filter', () => {
      const filter = new MedianFilter(3);

      filter.calculate(1.0);
      filter.calculate(2.0);
      filter.calculate(3.0);

      filter.reset();

      expect(filter.lastValue()).toBeCloseTo(0.0, 9);
      expect(filter.calculate(5.0)).toBeCloseTo(5.0, 9);
    });
  });

  describe('lastValue', () => {
    it('should return the last calculated value', () => {
      const filter = new MedianFilter(3);

      filter.calculate(1.0);
      expect(filter.lastValue()).toBeCloseTo(1.0, 9);

      filter.calculate(2.0);
      expect(filter.lastValue()).toBeCloseTo(1.5, 9);
    });
  });
});
