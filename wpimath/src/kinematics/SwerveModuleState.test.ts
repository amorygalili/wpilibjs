import { Rotation2d } from '../geometry/Rotation2d';
import { SwerveModuleState } from './SwerveModuleState';

describe('SwerveModuleState', () => {
  const kEpsilon = 1e-9;

  describe('constructors', () => {
    it('should create a SwerveModuleState with zeros for speed and angle', () => {
      const state = new SwerveModuleState();
      expect(state.speedMetersPerSecond).toBeCloseTo(0, 9);
      expect(state.angle.getDegrees()).toBeCloseTo(0, 9);
    });

    it('should create a SwerveModuleState with the given values', () => {
      const state = new SwerveModuleState(1.0, Rotation2d.fromDegrees(45.0));
      expect(state.speedMetersPerSecond).toBeCloseTo(1.0, 9);
      expect(state.angle.getDegrees()).toBeCloseTo(45.0, 9);
    });
  });

  describe('equals', () => {
    it('should correctly determine equality', () => {
      const a = new SwerveModuleState(1.0, Rotation2d.fromDegrees(45.0));
      const b = new SwerveModuleState(1.0, Rotation2d.fromDegrees(45.0));
      const c = new SwerveModuleState(2.0, Rotation2d.fromDegrees(45.0));
      const d = new SwerveModuleState(1.0, Rotation2d.fromDegrees(90.0));
      
      expect(a.equals(b)).toBe(true);
      expect(a.equals(c)).toBe(false);
      expect(a.equals(d)).toBe(false);
      expect(a.equals(null)).toBe(false);
      expect(a.equals({})).toBe(false);
    });
  });

  describe('compareTo', () => {
    it('should compare based on speed', () => {
      const a = new SwerveModuleState(1.0, Rotation2d.fromDegrees(45.0));
      const b = new SwerveModuleState(2.0, Rotation2d.fromDegrees(45.0));
      
      expect(a.compareTo(b)).toBeLessThan(0);
      expect(b.compareTo(a)).toBeGreaterThan(0);
      expect(a.compareTo(a)).toBe(0);
    });
  });

  describe('toString', () => {
    it('should return a correct string representation', () => {
      const state = new SwerveModuleState(1.0, Rotation2d.fromDegrees(45.0));
      expect(state.toString()).toBe('SwerveModuleState(Speed: 1.00 m/s, Angle: 45.00 deg)');
    });
  });

  describe('optimize', () => {
    it('should not change state when angle difference is less than 90 degrees', () => {
      const state = new SwerveModuleState(1.0, Rotation2d.fromDegrees(45.0));
      const currentAngle = Rotation2d.fromDegrees(0.0);
      
      state.optimize(currentAngle);
      
      expect(state.speedMetersPerSecond).toBeCloseTo(1.0, 9);
      expect(state.angle.getDegrees()).toBeCloseTo(45.0, 9);
    });

    it('should reverse speed and flip angle when angle difference is more than 90 degrees', () => {
      const state = new SwerveModuleState(1.0, Rotation2d.fromDegrees(135.0));
      const currentAngle = Rotation2d.fromDegrees(0.0);
      
      state.optimize(currentAngle);
      
      expect(state.speedMetersPerSecond).toBeCloseTo(-1.0, 9);
      expect(state.angle.getDegrees()).toBeCloseTo(-45.0, 9);
    });

    it('should handle static optimize method correctly', () => {
      const desiredState = new SwerveModuleState(1.0, Rotation2d.fromDegrees(135.0));
      const currentAngle = Rotation2d.fromDegrees(0.0);
      
      const optimizedState = SwerveModuleState.optimize(desiredState, currentAngle);
      
      expect(optimizedState.speedMetersPerSecond).toBeCloseTo(-1.0, 9);
      expect(optimizedState.angle.getDegrees()).toBeCloseTo(-45.0, 9);
      
      // Original state should be unchanged
      expect(desiredState.speedMetersPerSecond).toBeCloseTo(1.0, 9);
      expect(desiredState.angle.getDegrees()).toBeCloseTo(135.0, 9);
    });
  });

  describe('cosineScale', () => {
    it('should scale speed by cosine of angle error', () => {
      const state = new SwerveModuleState(1.0, Rotation2d.fromDegrees(60.0));
      const currentAngle = Rotation2d.fromDegrees(0.0);
      
      state.cosineScale(currentAngle);
      
      // cos(60°) = 0.5
      expect(state.speedMetersPerSecond).toBeCloseTo(0.5, 9);
      expect(state.angle.getDegrees()).toBeCloseTo(60.0, 9);
    });

    it('should handle zero angle difference correctly', () => {
      const state = new SwerveModuleState(1.0, Rotation2d.fromDegrees(0.0));
      const currentAngle = Rotation2d.fromDegrees(0.0);
      
      state.cosineScale(currentAngle);
      
      // cos(0°) = 1.0
      expect(state.speedMetersPerSecond).toBeCloseTo(1.0, 9);
      expect(state.angle.getDegrees()).toBeCloseTo(0.0, 9);
    });

    it('should handle 90 degree angle difference correctly', () => {
      const state = new SwerveModuleState(1.0, Rotation2d.fromDegrees(90.0));
      const currentAngle = Rotation2d.fromDegrees(0.0);
      
      state.cosineScale(currentAngle);
      
      // cos(90°) = 0.0
      expect(state.speedMetersPerSecond).toBeCloseTo(0.0, 9);
      expect(state.angle.getDegrees()).toBeCloseTo(90.0, 9);
    });
  });
});
