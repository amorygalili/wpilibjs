import { MecanumDriveWheelSpeeds } from './MecanumDriveWheelSpeeds';

describe('MecanumDriveWheelSpeeds', () => {
  const kEpsilon = 1E-9;

  describe('constructors', () => {
    it('should create a MecanumDriveWheelSpeeds with zeros for all wheel speeds', () => {
      const speeds = new MecanumDriveWheelSpeeds();
      expect(speeds.frontLeftMetersPerSecond).toBeCloseTo(0, 9);
      expect(speeds.frontRightMetersPerSecond).toBeCloseTo(0, 9);
      expect(speeds.rearLeftMetersPerSecond).toBeCloseTo(0, 9);
      expect(speeds.rearRightMetersPerSecond).toBeCloseTo(0, 9);
    });

    it('should create a MecanumDriveWheelSpeeds with the given values', () => {
      const speeds = new MecanumDriveWheelSpeeds(1.0, 2.0, 3.0, 4.0);
      expect(speeds.frontLeftMetersPerSecond).toBeCloseTo(1.0, 9);
      expect(speeds.frontRightMetersPerSecond).toBeCloseTo(2.0, 9);
      expect(speeds.rearLeftMetersPerSecond).toBeCloseTo(3.0, 9);
      expect(speeds.rearRightMetersPerSecond).toBeCloseTo(4.0, 9);
    });
  });

  describe('normalize', () => {
    it('should not change speeds when they are below the maximum', () => {
      const speeds = new MecanumDriveWheelSpeeds(1.0, 2.0, 3.0, 4.0);
      speeds.normalize(5.0);
      
      expect(speeds.frontLeftMetersPerSecond).toBeCloseTo(1.0, 9);
      expect(speeds.frontRightMetersPerSecond).toBeCloseTo(2.0, 9);
      expect(speeds.rearLeftMetersPerSecond).toBeCloseTo(3.0, 9);
      expect(speeds.rearRightMetersPerSecond).toBeCloseTo(4.0, 9);
    });

    it('should scale speeds proportionally when they exceed the maximum', () => {
      const speeds = new MecanumDriveWheelSpeeds(2.0, 4.0, 6.0, 8.0);
      speeds.normalize(4.0);
      
      // The maximum speed is 8.0, so the scaling factor is 4.0 / 8.0 = 0.5
      expect(speeds.frontLeftMetersPerSecond).toBeCloseTo(1.0, 9);
      expect(speeds.frontRightMetersPerSecond).toBeCloseTo(2.0, 9);
      expect(speeds.rearLeftMetersPerSecond).toBeCloseTo(3.0, 9);
      expect(speeds.rearRightMetersPerSecond).toBeCloseTo(4.0, 9);
    });

    it('should handle negative speeds correctly', () => {
      const speeds = new MecanumDriveWheelSpeeds(-2.0, -4.0, -6.0, -8.0);
      speeds.normalize(4.0);
      
      // The maximum speed is 8.0, so the scaling factor is 4.0 / 8.0 = 0.5
      expect(speeds.frontLeftMetersPerSecond).toBeCloseTo(-1.0, 9);
      expect(speeds.frontRightMetersPerSecond).toBeCloseTo(-2.0, 9);
      expect(speeds.rearLeftMetersPerSecond).toBeCloseTo(-3.0, 9);
      expect(speeds.rearRightMetersPerSecond).toBeCloseTo(-4.0, 9);
    });

    it('should handle mixed positive and negative speeds correctly', () => {
      const speeds = new MecanumDriveWheelSpeeds(2.0, -4.0, 6.0, -8.0);
      speeds.normalize(4.0);
      
      // The maximum speed is 8.0, so the scaling factor is 4.0 / 8.0 = 0.5
      expect(speeds.frontLeftMetersPerSecond).toBeCloseTo(1.0, 9);
      expect(speeds.frontRightMetersPerSecond).toBeCloseTo(-2.0, 9);
      expect(speeds.rearLeftMetersPerSecond).toBeCloseTo(3.0, 9);
      expect(speeds.rearRightMetersPerSecond).toBeCloseTo(-4.0, 9);
    });
  });

  describe('desaturate', () => {
    it('should be an alias for normalize', () => {
      const speeds1 = new MecanumDriveWheelSpeeds(2.0, 4.0, 6.0, 8.0);
      const speeds2 = new MecanumDriveWheelSpeeds(2.0, 4.0, 6.0, 8.0);
      
      speeds1.normalize(4.0);
      speeds2.desaturate(4.0);
      
      expect(speeds1.frontLeftMetersPerSecond).toBeCloseTo(speeds2.frontLeftMetersPerSecond, 9);
      expect(speeds1.frontRightMetersPerSecond).toBeCloseTo(speeds2.frontRightMetersPerSecond, 9);
      expect(speeds1.rearLeftMetersPerSecond).toBeCloseTo(speeds2.rearLeftMetersPerSecond, 9);
      expect(speeds1.rearRightMetersPerSecond).toBeCloseTo(speeds2.rearRightMetersPerSecond, 9);
    });
  });
});
