import { SlewRateLimiter } from './SlewRateLimiter';
import { MathSharedStore } from '../MathSharedStore';

describe('SlewRateLimiter', () => {
  // Mock the timestamp function to have deterministic behavior
  let currentTime = 0;
  const mockTimestamp = jest.fn().mockImplementation(() => currentTime);
  
  beforeEach(() => {
    currentTime = 0;
    jest.spyOn(MathSharedStore, 'getTimestamp').mockImplementation(mockTimestamp);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructors', () => {
    it('should create a SlewRateLimiter with the given rate limits', () => {
      const limiter = new SlewRateLimiter(1.0, -1.0);
      expect(limiter.lastValue()).toBeCloseTo(0.0, 9);
    });

    it('should create a SlewRateLimiter with the given rate limits and initial value', () => {
      const limiter = new SlewRateLimiter(1.0, -1.0, 5.0);
      expect(limiter.lastValue()).toBeCloseTo(5.0, 9);
    });

    it('should create a SlewRateLimiter with symmetric limits', () => {
      const limiter = SlewRateLimiter.withSymmetricLimit(2.0);
      expect(limiter.lastValue()).toBeCloseTo(0.0, 9);
    });
  });

  describe('calculate', () => {
    it('should limit positive rate of change', () => {
      const limiter = new SlewRateLimiter(1.0, -1.0);
      
      // Advance time by 0.5 seconds
      currentTime += 0.5;
      
      // Try to change from 0 to 10, but should be limited to 0.5
      expect(limiter.calculate(10.0)).toBeCloseTo(0.5, 9);
      
      // Advance time by 0.5 seconds
      currentTime += 0.5;
      
      // Should now be at 1.0
      expect(limiter.calculate(10.0)).toBeCloseTo(1.0, 9);
    });

    it('should limit negative rate of change', () => {
      const limiter = new SlewRateLimiter(1.0, -1.0, 10.0);
      
      // Advance time by 0.5 seconds
      currentTime += 0.5;
      
      // Try to change from 10 to 0, but should be limited to 9.5
      expect(limiter.calculate(0.0)).toBeCloseTo(9.5, 9);
      
      // Advance time by 0.5 seconds
      currentTime += 0.5;
      
      // Should now be at 9.0
      expect(limiter.calculate(0.0)).toBeCloseTo(9.0, 9);
    });

    it('should not limit when rate is within limits', () => {
      const limiter = new SlewRateLimiter(10.0, -10.0);
      
      // Advance time by 0.5 seconds
      currentTime += 0.5;
      
      // Change from 0 to 1, which is within the rate limit
      expect(limiter.calculate(1.0)).toBeCloseTo(1.0, 9);
    });

    it('should handle asymmetric rate limits', () => {
      const limiter = new SlewRateLimiter(2.0, -1.0, 5.0);
      
      // Advance time by 0.5 seconds
      currentTime += 0.5;
      
      // Try to increase by 2, should be limited to 1
      expect(limiter.calculate(10.0)).toBeCloseTo(6.0, 9);
      
      // Advance time by 0.5 seconds
      currentTime += 0.5;
      
      // Try to decrease by 10, should be limited to 0.5
      expect(limiter.calculate(0.0)).toBeCloseTo(5.5, 9);
    });
  });

  describe('reset', () => {
    it('should reset the limiter to the specified value', () => {
      const limiter = new SlewRateLimiter(1.0, -1.0);
      
      // Advance time and calculate
      currentTime += 0.5;
      limiter.calculate(10.0);
      
      // Reset to a new value
      limiter.reset(5.0);
      expect(limiter.lastValue()).toBeCloseTo(5.0, 9);
      
      // Advance time and calculate again
      currentTime += 0.5;
      expect(limiter.calculate(10.0)).toBeCloseTo(5.5, 9);
    });
  });

  describe('lastValue', () => {
    it('should return the last calculated value', () => {
      const limiter = new SlewRateLimiter(1.0, -1.0);
      
      // Advance time and calculate
      currentTime += 0.5;
      limiter.calculate(10.0);
      
      expect(limiter.lastValue()).toBeCloseTo(0.5, 9);
    });
  });
});
