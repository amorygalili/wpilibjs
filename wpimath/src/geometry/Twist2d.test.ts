import { Twist2d } from './Twist2d';

describe('Twist2d', () => {
  const kEpsilon = 1E-9;

  describe('constructors', () => {
    it('should create a default twist with zero components', () => {
      const twist = new Twist2d();
      expect(twist.dx).toBeCloseTo(0, 9);
      expect(twist.dy).toBeCloseTo(0, 9);
      expect(twist.dtheta).toBeCloseTo(0, 9);
    });

    it('should create a twist with the given components', () => {
      const twist = new Twist2d(1.0, 2.0, 3.0);
      expect(twist.dx).toBeCloseTo(1.0, 9);
      expect(twist.dy).toBeCloseTo(2.0, 9);
      expect(twist.dtheta).toBeCloseTo(3.0, 9);
    });
  });

  describe('equality', () => {
    it('should correctly determine equality', () => {
      const a = new Twist2d(1.0, 2.0, 3.0);
      const b = new Twist2d(1.0, 2.0, 3.0);
      const c = new Twist2d(4.0, 5.0, 6.0);
      
      expect(a.equals(b)).toBe(true);
      expect(a.equals(c)).toBe(false);
      expect(a.equals(null)).toBe(false);
      expect(a.equals({})).toBe(false);
    });
  });

  describe('string representation', () => {
    it('should return a correct string representation', () => {
      const twist = new Twist2d(1.0, 2.0, 3.0);
      expect(twist.toString()).toBe('Twist2d(dX: 1, dY: 2, dTheta: 3)');
    });
  });
});
