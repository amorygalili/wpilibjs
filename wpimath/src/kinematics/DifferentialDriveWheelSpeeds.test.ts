import { DifferentialDriveWheelSpeeds } from './DifferentialDriveWheelSpeeds';

describe('DifferentialDriveWheelSpeeds', () => {
  const kEpsilon = 1E-9;

  describe('constructors', () => {
    it('should create a DifferentialDriveWheelSpeeds with zeros for left and right speeds', () => {
      const speeds = new DifferentialDriveWheelSpeeds();
      expect(speeds.leftMetersPerSecond).toBeCloseTo(0, 9);
      expect(speeds.rightMetersPerSecond).toBeCloseTo(0, 9);
    });

    it('should create a DifferentialDriveWheelSpeeds with the given values', () => {
      const speeds = new DifferentialDriveWheelSpeeds(1.0, 2.0);
      expect(speeds.leftMetersPerSecond).toBeCloseTo(1.0, 9);
      expect(speeds.rightMetersPerSecond).toBeCloseTo(2.0, 9);
    });
  });

  describe('normalize', () => {
    it('should not change speeds when they are below the maximum', () => {
      const speeds = new DifferentialDriveWheelSpeeds(1.0, 2.0);
      speeds.normalize(3.0);
      
      expect(speeds.leftMetersPerSecond).toBeCloseTo(1.0, 9);
      expect(speeds.rightMetersPerSecond).toBeCloseTo(2.0, 9);
    });

    it('should scale speeds proportionally when they exceed the maximum', () => {
      const speeds = new DifferentialDriveWheelSpeeds(3.0, 4.0);
      speeds.normalize(2.0);
      
      // The maximum speed is 4.0, so the scaling factor is 2.0 / 4.0 = 0.5
      expect(speeds.leftMetersPerSecond).toBeCloseTo(1.5, 9);
      expect(speeds.rightMetersPerSecond).toBeCloseTo(2.0, 9);
    });

    it('should handle negative speeds correctly', () => {
      const speeds = new DifferentialDriveWheelSpeeds(-3.0, -4.0);
      speeds.normalize(2.0);
      
      // The maximum speed is 4.0, so the scaling factor is 2.0 / 4.0 = 0.5
      expect(speeds.leftMetersPerSecond).toBeCloseTo(-1.5, 9);
      expect(speeds.rightMetersPerSecond).toBeCloseTo(-2.0, 9);
    });

    it('should handle mixed positive and negative speeds correctly', () => {
      const speeds = new DifferentialDriveWheelSpeeds(3.0, -4.0);
      speeds.normalize(2.0);
      
      // The maximum speed is 4.0, so the scaling factor is 2.0 / 4.0 = 0.5
      expect(speeds.leftMetersPerSecond).toBeCloseTo(1.5, 9);
      expect(speeds.rightMetersPerSecond).toBeCloseTo(-2.0, 9);
    });
  });
});
