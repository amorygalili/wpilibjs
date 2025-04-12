import { MathUtil } from './MathUtil';

describe('MathUtil', () => {
  describe('clamp', () => {
    it('should clamp values within range', () => {
      expect(MathUtil.clamp(5, 0, 10)).toBe(5);
      expect(MathUtil.clamp(-5, 0, 10)).toBe(0);
      expect(MathUtil.clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('applyDeadband', () => {
    it('should apply deadband correctly', () => {
      // Within deadband
      expect(MathUtil.applyDeadband(0.1, 0.2)).toBe(0);

      // Outside deadband, default max magnitude
      expect(MathUtil.applyDeadband(0.5, 0.2)).toBeCloseTo(0.375);
      expect(MathUtil.applyDeadband(-0.5, 0.2)).toBeCloseTo(-0.375);

      // Outside deadband, custom max magnitude
      const result = MathUtil.applyDeadband(0.5, 0.2, 2.0);
      expect(result).toBeCloseTo(0.333, 2);

      // Infinite max magnitude
      expect(MathUtil.applyDeadband(0.5, 0.2, Infinity)).toBe(0.3);
    });
  });

  describe('inputModulus', () => {
    it('should wrap values correctly', () => {
      expect(MathUtil.inputModulus(5, 0, 10)).toBe(5);
      expect(MathUtil.inputModulus(11, 0, 10)).toBe(1);
      expect(MathUtil.inputModulus(-1, 0, 10)).toBe(9);
      expect(MathUtil.inputModulus(370, 0, 360)).toBe(10);
    });
  });

  describe('angleModulus', () => {
    it('should wrap angles to -π to π', () => {
      expect(MathUtil.angleModulus(0)).toBeCloseTo(0);
      expect(MathUtil.angleModulus(Math.PI)).toBeCloseTo(Math.PI);
      expect(MathUtil.angleModulus(-Math.PI)).toBeCloseTo(-Math.PI);
      expect(MathUtil.angleModulus(3 * Math.PI)).toBeCloseTo(-Math.PI);
      expect(MathUtil.angleModulus(-3 * Math.PI)).toBeCloseTo(-Math.PI);
      expect(MathUtil.angleModulus(Math.PI / 2)).toBeCloseTo(Math.PI / 2);
    });
  });

  describe('interpolate', () => {
    it('should interpolate values correctly', () => {
      expect(MathUtil.interpolate(0, 10, 0)).toBe(0);
      expect(MathUtil.interpolate(0, 10, 1)).toBe(10);
      expect(MathUtil.interpolate(0, 10, 0.5)).toBe(5);

      // Test clamping
      expect(MathUtil.interpolate(0, 10, -1)).toBe(0);
      expect(MathUtil.interpolate(0, 10, 2)).toBe(10);
    });
  });

  describe('isNear', () => {
    it('should check if values are near each other', () => {
      expect(MathUtil.isNear(5, 5, 0.1)).toBe(true);
      expect(MathUtil.isNear(5, 5.05, 0.1)).toBe(true);
      expect(MathUtil.isNear(5, 5.2, 0.1)).toBe(false);

      // Test negative tolerance
      expect(() => MathUtil.isNear(5, 5, -0.1)).toThrow();
    });
  });

  describe('isNearContinuous', () => {
    it('should check if values are near each other with wrapping', () => {
      // Normal case
      expect(MathUtil.isNearContinuous(5, 5, 0.1, 0, 10)).toBe(true);
      expect(MathUtil.isNearContinuous(5, 5.05, 0.1, 0, 10)).toBe(true);
      expect(MathUtil.isNearContinuous(5, 5.2, 0.1, 0, 10)).toBe(false);

      // Wrapping case
      expect(MathUtil.isNearContinuous(1, 9, 3, 0, 10)).toBe(true);
      expect(MathUtil.isNearContinuous(359, 2, 5, 0, 360)).toBe(true);
      expect(MathUtil.isNearContinuous(359, 10, 5, 0, 360)).toBe(false);

      // Test negative tolerance
      expect(() => MathUtil.isNearContinuous(5, 5, -0.1, 0, 10)).toThrow();
    });
  });
});
