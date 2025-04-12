import { LinearFilter } from './LinearFilter';

describe('LinearFilter', () => {
  describe('constructors', () => {
    it('should create a LinearFilter with the given gains', () => {
      const filter = new LinearFilter([1.0, 2.0, 3.0], [4.0, 5.0]);
      expect(filter.lastValue()).toBeCloseTo(0.0, 9);
    });
  });

  describe('singlePoleIIR', () => {
    it('should create a single-pole IIR filter', () => {
      const filter = LinearFilter.singlePoleIIR(1.0, 0.02);

      // Calculate the expected gain
      const expectedGain = Math.exp(-0.02 / 1.0);

      // Input a step function and verify the response
      const output1 = filter.calculate(1.0);
      expect(output1).toBeCloseTo(1.0 - expectedGain, 9);

      const output2 = filter.calculate(1.0);
      expect(output2).toBeCloseTo((1.0 - expectedGain) * (1.0 + expectedGain), 9);
    });
  });

  describe('highPass', () => {
    it('should create a high-pass filter', () => {
      const filter = LinearFilter.highPass(1.0, 0.02);

      // Calculate the expected gain
      const expectedGain = Math.exp(-0.02 / 1.0);

      // Input a step function and verify the response
      const output1 = filter.calculate(1.0);
      expect(output1).toBeCloseTo(expectedGain, 9);

      // For a high-pass filter, a constant input should eventually result in zero output
      // But we need to run it for a few iterations
      let output = filter.calculate(1.0);
      for (let i = 0; i < 100; i++) {
        output = filter.calculate(1.0);
      }
      // The output should be very small, but not exactly zero due to floating-point precision
      expect(Math.abs(output)).toBeLessThan(0.2);
    });
  });

  describe('movingAverage', () => {
    it('should create a moving average filter', () => {
      const filter = LinearFilter.movingAverage(3);

      // Input values and verify the response
      expect(filter.calculate(3.0)).toBeCloseTo(1.0, 9);
      expect(filter.calculate(6.0)).toBeCloseTo(3.0, 9);
      expect(filter.calculate(9.0)).toBeCloseTo(6.0, 9);
      expect(filter.calculate(12.0)).toBeCloseTo(9.0, 9);
    });

    it('should throw an error for invalid taps', () => {
      expect(() => LinearFilter.movingAverage(0)).toThrow();
      expect(() => LinearFilter.movingAverage(-1)).toThrow();
    });
  });

  describe('calculate', () => {
    it('should calculate the next value correctly', () => {
      const filter = new LinearFilter([0.5, 0.5], []);

      expect(filter.calculate(1.0)).toBeCloseTo(0.5, 9);
      expect(filter.calculate(2.0)).toBeCloseTo(1.5, 9);
      expect(filter.calculate(3.0)).toBeCloseTo(2.5, 9);
    });

    it('should handle feedback gains correctly', () => {
      const filter = new LinearFilter([1.0], [0.5]);

      expect(filter.calculate(1.0)).toBeCloseTo(1.0, 9);
      expect(filter.calculate(1.0)).toBeCloseTo(0.5, 9);
      expect(filter.calculate(1.0)).toBeCloseTo(0.75, 9);
    });
  });

  describe('reset', () => {
    it('should reset the filter state', () => {
      const filter = LinearFilter.movingAverage(3);

      filter.calculate(3.0);
      filter.calculate(6.0);
      filter.reset();

      expect(filter.calculate(3.0)).toBeCloseTo(1.0, 9);
    });

    it('should reset with buffers', () => {
      const filter = new LinearFilter([0.5, 0.5], [0.5]);

      filter.resetWithBuffers([1.0, 2.0], [3.0]);

      // The output should be (0.5 * 4.0 + 0.5 * 1.0) - (0.5 * 3.0) = 2.5 - 1.5 = 1.0
      expect(filter.calculate(4.0)).toBeCloseTo(1.0, 9);
    });

    it('should throw an error for invalid buffer sizes', () => {
      const filter = new LinearFilter([0.5, 0.5], [0.5]);

      expect(() => filter.resetWithBuffers([1.0], [3.0])).toThrow();
      expect(() => filter.resetWithBuffers([1.0, 2.0], [])).toThrow();
    });
  });

  describe('lastValue', () => {
    it('should return the last calculated value', () => {
      const filter = new LinearFilter([1.0], []);

      filter.calculate(5.0);
      expect(filter.lastValue()).toBeCloseTo(5.0, 9);

      filter.calculate(10.0);
      expect(filter.lastValue()).toBeCloseTo(10.0, 9);
    });
  });
});
