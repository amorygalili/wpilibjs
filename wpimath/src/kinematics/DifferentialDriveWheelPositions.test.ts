import { DifferentialDriveWheelPositions } from './DifferentialDriveWheelPositions';

describe('DifferentialDriveWheelPositions', () => {
  const kEpsilon = 1E-9;

  describe('constructors', () => {
    it('should create a DifferentialDriveWheelPositions with zeros for left and right positions', () => {
      const positions = new DifferentialDriveWheelPositions();
      expect(positions.leftMeters).toBeCloseTo(0, 9);
      expect(positions.rightMeters).toBeCloseTo(0, 9);
    });

    it('should create a DifferentialDriveWheelPositions with the given values', () => {
      const positions = new DifferentialDriveWheelPositions(1.0, 2.0);
      expect(positions.leftMeters).toBeCloseTo(1.0, 9);
      expect(positions.rightMeters).toBeCloseTo(2.0, 9);
    });
  });

  describe('equals', () => {
    it('should correctly determine equality', () => {
      const a = new DifferentialDriveWheelPositions(1.0, 2.0);
      const b = new DifferentialDriveWheelPositions(1.0, 2.0);
      const c = new DifferentialDriveWheelPositions(3.0, 4.0);
      
      expect(a.equals(b)).toBe(true);
      expect(a.equals(c)).toBe(false);
      expect(a.equals(null)).toBe(false);
      expect(a.equals({})).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return a correct string representation', () => {
      const positions = new DifferentialDriveWheelPositions(1.0, 2.0);
      expect(positions.toString()).toBe('DifferentialDriveWheelPositions(Left: 1.00 m, Right: 2.00 m)');
    });
  });

  describe('interpolate', () => {
    it('should interpolate between two positions correctly', () => {
      const start = new DifferentialDriveWheelPositions(1.0, 2.0);
      const end = new DifferentialDriveWheelPositions(3.0, 4.0);
      
      const interpolated = start.interpolate(end, 0.5);
      
      expect(interpolated.leftMeters).toBeCloseTo(2.0, 9);
      expect(interpolated.rightMeters).toBeCloseTo(3.0, 9);
    });

    it('should return the start position when t = 0', () => {
      const start = new DifferentialDriveWheelPositions(1.0, 2.0);
      const end = new DifferentialDriveWheelPositions(3.0, 4.0);
      
      const interpolated = start.interpolate(end, 0);
      
      expect(interpolated.leftMeters).toBeCloseTo(start.leftMeters, 9);
      expect(interpolated.rightMeters).toBeCloseTo(start.rightMeters, 9);
    });

    it('should return the end position when t = 1', () => {
      const start = new DifferentialDriveWheelPositions(1.0, 2.0);
      const end = new DifferentialDriveWheelPositions(3.0, 4.0);
      
      const interpolated = start.interpolate(end, 1);
      
      expect(interpolated.leftMeters).toBeCloseTo(end.leftMeters, 9);
      expect(interpolated.rightMeters).toBeCloseTo(end.rightMeters, 9);
    });
  });
});
