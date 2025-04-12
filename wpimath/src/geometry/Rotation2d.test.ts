import { Rotation2d } from './Rotation2d';

describe('Rotation2d', () => {
  const kEpsilon = 1E-9;

  describe('constructors', () => {
    it('should create a default rotation with 0 degrees', () => {
      const rotation = new Rotation2d();
      expect(rotation.getRadians()).toBeCloseTo(0, 9);
      expect(rotation.getDegrees()).toBeCloseTo(0, 9);
      expect(rotation.getCos()).toBeCloseTo(1, 9);
      expect(rotation.getSin()).toBeCloseTo(0, 9);
    });

    it('should create a rotation with the given radian value', () => {
      const rotation = new Rotation2d(Math.PI / 4);
      expect(rotation.getRadians()).toBeCloseTo(Math.PI / 4, 9);
      expect(rotation.getDegrees()).toBeCloseTo(45, 9);
      expect(rotation.getCos()).toBeCloseTo(Math.cos(Math.PI / 4), 9);
      expect(rotation.getSin()).toBeCloseTo(Math.sin(Math.PI / 4), 9);
    });

    it('should create a rotation with the given x and y components', () => {
      const rotation = new Rotation2d(Math.cos(Math.PI / 3), Math.sin(Math.PI / 3));
      expect(rotation.getRadians()).toBeCloseTo(Math.PI / 3, 9);
      expect(rotation.getDegrees()).toBeCloseTo(60, 9);
      expect(rotation.getCos()).toBeCloseTo(Math.cos(Math.PI / 3), 9);
      expect(rotation.getSin()).toBeCloseTo(Math.sin(Math.PI / 3), 9);
    });
  });

  describe('static factory methods', () => {
    it('should create a rotation from radians', () => {
      const rotation = Rotation2d.fromRadians(Math.PI / 6);
      expect(rotation.getRadians()).toBeCloseTo(Math.PI / 6, 9);
      expect(rotation.getDegrees()).toBeCloseTo(30, 9);
    });

    it('should create a rotation from degrees', () => {
      const rotation = Rotation2d.fromDegrees(45);
      expect(rotation.getRadians()).toBeCloseTo(Math.PI / 4, 9);
      expect(rotation.getDegrees()).toBeCloseTo(45, 9);
    });

    it('should create a rotation from rotations', () => {
      const rotation = Rotation2d.fromRotations(0.25);
      expect(rotation.getRadians()).toBeCloseTo(Math.PI / 2, 9);
      expect(rotation.getDegrees()).toBeCloseTo(90, 9);
    });
  });

  describe('operations', () => {
    it('should add rotations correctly', () => {
      const rot1 = Rotation2d.fromDegrees(30);
      const rot2 = Rotation2d.fromDegrees(60);
      const result = rot1.plus(rot2);
      expect(result.getDegrees()).toBeCloseTo(90, 9);
    });

    it('should subtract rotations correctly', () => {
      const rot1 = Rotation2d.fromDegrees(30);
      const rot2 = Rotation2d.fromDegrees(60);
      const result = rot1.minus(rot2);
      expect(result.getDegrees()).toBeCloseTo(-30, 9);
    });

    it('should negate rotations correctly', () => {
      const rot = Rotation2d.fromDegrees(30);
      const result = rot.unaryMinus();
      expect(result.getDegrees()).toBeCloseTo(-30, 9);
    });

    it('should scale rotations correctly', () => {
      const rot = Rotation2d.fromDegrees(30);
      const result = rot.times(2);
      expect(result.getDegrees()).toBeCloseTo(60, 9);
    });

    it('should rotate by another rotation correctly', () => {
      const rot1 = Rotation2d.fromDegrees(30);
      const rot2 = Rotation2d.fromDegrees(60);
      const result = rot1.rotateBy(rot2);
      expect(result.getDegrees()).toBeCloseTo(90, 9);
    });
  });

  describe('interpolation', () => {
    it('should interpolate between rotations correctly', () => {
      const start = Rotation2d.fromDegrees(0);
      const end = Rotation2d.fromDegrees(90);
      
      expect(start.interpolate(end, 0).getDegrees()).toBeCloseTo(0, 9);
      expect(start.interpolate(end, 0.5).getDegrees()).toBeCloseTo(45, 9);
      expect(start.interpolate(end, 1).getDegrees()).toBeCloseTo(90, 9);
      
      // Test clamping
      expect(start.interpolate(end, -1).getDegrees()).toBeCloseTo(0, 9);
      expect(start.interpolate(end, 2).getDegrees()).toBeCloseTo(90, 9);
    });
  });

  describe('equality', () => {
    it('should correctly determine equality', () => {
      const rot1 = Rotation2d.fromDegrees(30);
      const rot2 = Rotation2d.fromDegrees(30);
      const rot3 = Rotation2d.fromDegrees(60);
      
      expect(rot1.equals(rot2)).toBe(true);
      expect(rot1.equals(rot3)).toBe(false);
      expect(rot1.equals(null)).toBe(false);
      expect(rot1.equals({})).toBe(false);
    });
  });

  describe('string representation', () => {
    it('should return a correct string representation', () => {
      const rot = Rotation2d.fromDegrees(30);
      expect(rot.toString()).toBe('Rotation2d(30°)');
    });
  });
});
