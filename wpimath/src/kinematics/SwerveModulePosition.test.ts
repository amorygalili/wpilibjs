import { Rotation2d } from '../geometry/Rotation2d';
import { SwerveModulePosition } from './SwerveModulePosition';

describe('SwerveModulePosition', () => {
  const kEpsilon = 1e-9;

  describe('constructors', () => {
    it('should create a SwerveModulePosition with zeros for distance and angle', () => {
      const position = new SwerveModulePosition();
      expect(position.distanceMeters).toBeCloseTo(0, 9);
      expect(position.angle.getDegrees()).toBeCloseTo(0, 9);
    });

    it('should create a SwerveModulePosition with the given values', () => {
      const position = new SwerveModulePosition(1.0, Rotation2d.fromDegrees(45.0));
      expect(position.distanceMeters).toBeCloseTo(1.0, 9);
      expect(position.angle.getDegrees()).toBeCloseTo(45.0, 9);
    });
  });

  describe('equals', () => {
    it('should correctly determine equality', () => {
      const a = new SwerveModulePosition(1.0, Rotation2d.fromDegrees(45.0));
      const b = new SwerveModulePosition(1.0, Rotation2d.fromDegrees(45.0));
      const c = new SwerveModulePosition(2.0, Rotation2d.fromDegrees(45.0));
      const d = new SwerveModulePosition(1.0, Rotation2d.fromDegrees(90.0));
      
      expect(a.equals(b)).toBe(true);
      expect(a.equals(c)).toBe(false);
      expect(a.equals(d)).toBe(false);
      expect(a.equals(null)).toBe(false);
      expect(a.equals({})).toBe(false);
    });
  });

  describe('compareTo', () => {
    it('should compare based on distance', () => {
      const a = new SwerveModulePosition(1.0, Rotation2d.fromDegrees(45.0));
      const b = new SwerveModulePosition(2.0, Rotation2d.fromDegrees(45.0));
      
      expect(a.compareTo(b)).toBeLessThan(0);
      expect(b.compareTo(a)).toBeGreaterThan(0);
      expect(a.compareTo(a)).toBe(0);
    });
  });

  describe('toString', () => {
    it('should return a correct string representation', () => {
      const position = new SwerveModulePosition(1.0, Rotation2d.fromDegrees(45.0));
      expect(position.toString()).toBe('SwerveModulePosition(Distance: 1.00 m, Angle: 45.00 deg)');
    });
  });

  describe('copy', () => {
    it('should create a deep copy', () => {
      const original = new SwerveModulePosition(1.0, Rotation2d.fromDegrees(45.0));
      const copy = original.copy();
      
      // Modify the original
      original.distanceMeters = 2.0;
      original.angle = Rotation2d.fromDegrees(90.0);
      
      // The copy should not be affected
      expect(copy.distanceMeters).toBeCloseTo(1.0, 9);
      expect(copy.angle.getDegrees()).toBeCloseTo(45.0, 9);
    });
  });

  describe('interpolate', () => {
    it('should interpolate between two positions correctly', () => {
      const start = new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0));
      const end = new SwerveModulePosition(3.0, Rotation2d.fromDegrees(90.0));
      
      const interpolated = start.interpolate(end, 0.5);
      
      expect(interpolated.distanceMeters).toBeCloseTo(2.0, 9);
      expect(interpolated.angle.getDegrees()).toBeCloseTo(45.0, 9);
    });

    it('should return the start position when t = 0', () => {
      const start = new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0));
      const end = new SwerveModulePosition(3.0, Rotation2d.fromDegrees(90.0));
      
      const interpolated = start.interpolate(end, 0);
      
      expect(interpolated.distanceMeters).toBeCloseTo(start.distanceMeters, 9);
      expect(interpolated.angle.getDegrees()).toBeCloseTo(start.angle.getDegrees(), 9);
    });

    it('should return the end position when t = 1', () => {
      const start = new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0));
      const end = new SwerveModulePosition(3.0, Rotation2d.fromDegrees(90.0));
      
      const interpolated = start.interpolate(end, 1);
      
      expect(interpolated.distanceMeters).toBeCloseTo(end.distanceMeters, 9);
      expect(interpolated.angle.getDegrees()).toBeCloseTo(end.angle.getDegrees(), 9);
    });
  });
});
