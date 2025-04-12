import { Rotation2d } from './Rotation2d';
import { Translation2d } from './Translation2d';

describe('Translation2d', () => {
  const kEpsilon = 1E-9;

  describe('constructors', () => {
    it('should create a default translation with zero components', () => {
      const translation = new Translation2d();
      expect(translation.getX()).toBeCloseTo(0, 9);
      expect(translation.getY()).toBeCloseTo(0, 9);
    });

    it('should create a translation with the given x and y components', () => {
      const translation = new Translation2d(3, 4);
      expect(translation.getX()).toBeCloseTo(3, 9);
      expect(translation.getY()).toBeCloseTo(4, 9);
    });

    it('should create a translation with the given distance and angle', () => {
      const translation = new Translation2d(5, Rotation2d.fromDegrees(53.13));
      expect(translation.getX()).toBeCloseTo(3, 2);
      expect(translation.getY()).toBeCloseTo(4, 2);
    });
  });

  describe('distance', () => {
    it('should calculate the distance between two translations', () => {
      const a = new Translation2d(1, 2);
      const b = new Translation2d(4, 6);
      expect(a.getDistance(b)).toBeCloseTo(5, 9);
    });
  });

  describe('norm', () => {
    it('should calculate the norm of a translation', () => {
      const translation = new Translation2d(3, 4);
      expect(translation.getNorm()).toBeCloseTo(5, 9);
    });
  });

  describe('angle', () => {
    it('should calculate the angle of a translation', () => {
      const translation = new Translation2d(3, 4);
      expect(translation.getAngle().getDegrees()).toBeCloseTo(53.13, 2);
    });
  });

  describe('rotation', () => {
    it('should rotate a translation by a rotation', () => {
      const translation = new Translation2d(2, 0);
      const rotated = translation.rotateBy(Rotation2d.fromDegrees(90));
      expect(rotated.getX()).toBeCloseTo(0, 9);
      expect(rotated.getY()).toBeCloseTo(2, 9);
    });
  });

  describe('addition', () => {
    it('should add two translations', () => {
      const a = new Translation2d(1, 2);
      const b = new Translation2d(3, 4);
      const sum = a.plus(b);
      expect(sum.getX()).toBeCloseTo(4, 9);
      expect(sum.getY()).toBeCloseTo(6, 9);
    });
  });

  describe('subtraction', () => {
    it('should subtract two translations', () => {
      const a = new Translation2d(5, 7);
      const b = new Translation2d(2, 3);
      const diff = a.minus(b);
      expect(diff.getX()).toBeCloseTo(3, 9);
      expect(diff.getY()).toBeCloseTo(4, 9);
    });
  });

  describe('unary minus', () => {
    it('should negate a translation', () => {
      const translation = new Translation2d(3, 4);
      const negated = translation.unaryMinus();
      expect(negated.getX()).toBeCloseTo(-3, 9);
      expect(negated.getY()).toBeCloseTo(-4, 9);
    });
  });

  describe('scalar multiplication', () => {
    it('should multiply a translation by a scalar', () => {
      const translation = new Translation2d(3, 4);
      const scaled = translation.times(2);
      expect(scaled.getX()).toBeCloseTo(6, 9);
      expect(scaled.getY()).toBeCloseTo(8, 9);
    });
  });

  describe('scalar division', () => {
    it('should divide a translation by a scalar', () => {
      const translation = new Translation2d(6, 8);
      const scaled = translation.div(2);
      expect(scaled.getX()).toBeCloseTo(3, 9);
      expect(scaled.getY()).toBeCloseTo(4, 9);
    });
  });

  describe('nearest', () => {
    it('should find the nearest translation from a list', () => {
      const origin = new Translation2d();
      const a = new Translation2d(1, 1);
      const b = new Translation2d(2, 2);
      const c = new Translation2d(3, 3);

      expect(origin.nearest([a, b, c])).toBe(a);
      expect(c.nearest([a, b, origin])).toBe(b);
    });
  });

  describe('interpolation', () => {
    it('should interpolate between two translations', () => {
      const a = new Translation2d(0, 0);
      const b = new Translation2d(10, 10);

      const interp1 = a.interpolate(b, 0);
      expect(interp1.getX()).toBeCloseTo(0, 9);
      expect(interp1.getY()).toBeCloseTo(0, 9);

      const interp2 = a.interpolate(b, 0.5);
      expect(interp2.getX()).toBeCloseTo(5, 9);
      expect(interp2.getY()).toBeCloseTo(5, 9);

      const interp3 = a.interpolate(b, 1);
      expect(interp3.getX()).toBeCloseTo(10, 9);
      expect(interp3.getY()).toBeCloseTo(10, 9);
    });
  });

  describe('equality', () => {
    it('should correctly determine equality', () => {
      const a = new Translation2d(3, 4);
      const b = new Translation2d(3, 4);
      const c = new Translation2d(5, 6);

      expect(a.equals(b)).toBe(true);
      expect(a.equals(c)).toBe(false);
      expect(a.equals(null)).toBe(false);
      expect(a.equals({})).toBe(false);
    });
  });

  describe('string representation', () => {
    it('should return a correct string representation', () => {
      const translation = new Translation2d(3, 4);
      expect(translation.toString()).toBe('Translation2d(X: 3, Y: 4)');
    });
  });
});
