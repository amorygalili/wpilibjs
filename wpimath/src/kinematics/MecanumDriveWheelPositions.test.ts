import { MecanumDriveWheelPositions } from './MecanumDriveWheelPositions';

describe('MecanumDriveWheelPositions', () => {
  const kEpsilon = 1E-9;

  describe('constructors', () => {
    it('should create a MecanumDriveWheelPositions with zeros for all wheel positions', () => {
      const positions = new MecanumDriveWheelPositions();
      expect(positions.frontLeftMeters).toBeCloseTo(0, 9);
      expect(positions.frontRightMeters).toBeCloseTo(0, 9);
      expect(positions.rearLeftMeters).toBeCloseTo(0, 9);
      expect(positions.rearRightMeters).toBeCloseTo(0, 9);
    });

    it('should create a MecanumDriveWheelPositions with the given values', () => {
      const positions = new MecanumDriveWheelPositions(1.0, 2.0, 3.0, 4.0);
      expect(positions.frontLeftMeters).toBeCloseTo(1.0, 9);
      expect(positions.frontRightMeters).toBeCloseTo(2.0, 9);
      expect(positions.rearLeftMeters).toBeCloseTo(3.0, 9);
      expect(positions.rearRightMeters).toBeCloseTo(4.0, 9);
    });
  });

  describe('equals', () => {
    it('should correctly determine equality', () => {
      const a = new MecanumDriveWheelPositions(1.0, 2.0, 3.0, 4.0);
      const b = new MecanumDriveWheelPositions(1.0, 2.0, 3.0, 4.0);
      const c = new MecanumDriveWheelPositions(5.0, 6.0, 7.0, 8.0);
      
      expect(a.equals(b)).toBe(true);
      expect(a.equals(c)).toBe(false);
      expect(a.equals(null)).toBe(false);
      expect(a.equals({})).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return a correct string representation', () => {
      const positions = new MecanumDriveWheelPositions(1.0, 2.0, 3.0, 4.0);
      expect(positions.toString()).toBe('MecanumDriveWheelPositions(Front Left: 1.00 m, Front Right: 2.00 m, Rear Left: 3.00 m, Rear Right: 4.00 m)');
    });
  });

  describe('interpolate', () => {
    it('should interpolate between two positions correctly', () => {
      const start = new MecanumDriveWheelPositions(1.0, 2.0, 3.0, 4.0);
      const end = new MecanumDriveWheelPositions(5.0, 6.0, 7.0, 8.0);
      
      const interpolated = start.interpolate(end, 0.5);
      
      expect(interpolated.frontLeftMeters).toBeCloseTo(3.0, 9);
      expect(interpolated.frontRightMeters).toBeCloseTo(4.0, 9);
      expect(interpolated.rearLeftMeters).toBeCloseTo(5.0, 9);
      expect(interpolated.rearRightMeters).toBeCloseTo(6.0, 9);
    });

    it('should return the start position when t = 0', () => {
      const start = new MecanumDriveWheelPositions(1.0, 2.0, 3.0, 4.0);
      const end = new MecanumDriveWheelPositions(5.0, 6.0, 7.0, 8.0);
      
      const interpolated = start.interpolate(end, 0);
      
      expect(interpolated.frontLeftMeters).toBeCloseTo(start.frontLeftMeters, 9);
      expect(interpolated.frontRightMeters).toBeCloseTo(start.frontRightMeters, 9);
      expect(interpolated.rearLeftMeters).toBeCloseTo(start.rearLeftMeters, 9);
      expect(interpolated.rearRightMeters).toBeCloseTo(start.rearRightMeters, 9);
    });

    it('should return the end position when t = 1', () => {
      const start = new MecanumDriveWheelPositions(1.0, 2.0, 3.0, 4.0);
      const end = new MecanumDriveWheelPositions(5.0, 6.0, 7.0, 8.0);
      
      const interpolated = start.interpolate(end, 1);
      
      expect(interpolated.frontLeftMeters).toBeCloseTo(end.frontLeftMeters, 9);
      expect(interpolated.frontRightMeters).toBeCloseTo(end.frontRightMeters, 9);
      expect(interpolated.rearLeftMeters).toBeCloseTo(end.rearLeftMeters, 9);
      expect(interpolated.rearRightMeters).toBeCloseTo(end.rearRightMeters, 9);
    });
  });
});
