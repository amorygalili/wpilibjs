import { DifferentialDriveKinematics } from './DifferentialDriveKinematics';
import { ChassisSpeeds } from './ChassisSpeeds';
import { DifferentialDriveWheelSpeeds } from './DifferentialDriveWheelSpeeds';

describe('DifferentialDriveKinematics', () => {
  const kEpsilon = 1E-9;
  const kTrackWidth = 0.5;

  describe('constructors', () => {
    it('should create a DifferentialDriveKinematics with the given track width', () => {
      const kinematics = new DifferentialDriveKinematics(kTrackWidth);
      expect(kinematics.getTrackWidthMeters()).toBeCloseTo(kTrackWidth, 9);
    });
  });

  describe('toWheelSpeeds', () => {
    it('should convert chassis speeds to wheel speeds correctly for forward motion', () => {
      const kinematics = new DifferentialDriveKinematics(kTrackWidth);
      const chassisSpeeds = new ChassisSpeeds(1.0, 0.0, 0.0);
      
      const wheelSpeeds = kinematics.toWheelSpeeds(chassisSpeeds);
      
      expect(wheelSpeeds.leftMetersPerSecond).toBeCloseTo(1.0, 9);
      expect(wheelSpeeds.rightMetersPerSecond).toBeCloseTo(1.0, 9);
    });

    it('should convert chassis speeds to wheel speeds correctly for rotation', () => {
      const kinematics = new DifferentialDriveKinematics(kTrackWidth);
      const chassisSpeeds = new ChassisSpeeds(0.0, 0.0, 2.0);
      
      const wheelSpeeds = kinematics.toWheelSpeeds(chassisSpeeds);
      
      expect(wheelSpeeds.leftMetersPerSecond).toBeCloseTo(-0.5, 9);
      expect(wheelSpeeds.rightMetersPerSecond).toBeCloseTo(0.5, 9);
    });

    it('should convert chassis speeds to wheel speeds correctly for combined motion', () => {
      const kinematics = new DifferentialDriveKinematics(kTrackWidth);
      const chassisSpeeds = new ChassisSpeeds(1.0, 0.0, 2.0);
      
      const wheelSpeeds = kinematics.toWheelSpeeds(chassisSpeeds);
      
      expect(wheelSpeeds.leftMetersPerSecond).toBeCloseTo(0.5, 9);
      expect(wheelSpeeds.rightMetersPerSecond).toBeCloseTo(1.5, 9);
    });
  });

  describe('toChassisSpeeds', () => {
    it('should convert wheel speeds to chassis speeds correctly for forward motion', () => {
      const kinematics = new DifferentialDriveKinematics(kTrackWidth);
      const wheelSpeeds = new DifferentialDriveWheelSpeeds(1.0, 1.0);
      
      const chassisSpeeds = kinematics.toChassisSpeeds(wheelSpeeds);
      
      expect(chassisSpeeds.vxMetersPerSecond).toBeCloseTo(1.0, 9);
      expect(chassisSpeeds.vyMetersPerSecond).toBeCloseTo(0.0, 9);
      expect(chassisSpeeds.omegaRadiansPerSecond).toBeCloseTo(0.0, 9);
    });

    it('should convert wheel speeds to chassis speeds correctly for rotation', () => {
      const kinematics = new DifferentialDriveKinematics(kTrackWidth);
      const wheelSpeeds = new DifferentialDriveWheelSpeeds(-0.5, 0.5);
      
      const chassisSpeeds = kinematics.toChassisSpeeds(wheelSpeeds);
      
      expect(chassisSpeeds.vxMetersPerSecond).toBeCloseTo(0.0, 9);
      expect(chassisSpeeds.vyMetersPerSecond).toBeCloseTo(0.0, 9);
      expect(chassisSpeeds.omegaRadiansPerSecond).toBeCloseTo(2.0, 9);
    });

    it('should convert wheel speeds to chassis speeds correctly for combined motion', () => {
      const kinematics = new DifferentialDriveKinematics(kTrackWidth);
      const wheelSpeeds = new DifferentialDriveWheelSpeeds(0.5, 1.5);
      
      const chassisSpeeds = kinematics.toChassisSpeeds(wheelSpeeds);
      
      expect(chassisSpeeds.vxMetersPerSecond).toBeCloseTo(1.0, 9);
      expect(chassisSpeeds.vyMetersPerSecond).toBeCloseTo(0.0, 9);
      expect(chassisSpeeds.omegaRadiansPerSecond).toBeCloseTo(2.0, 9);
    });
  });

  describe('roundtrip', () => {
    it('should convert chassis speeds to wheel speeds and back correctly', () => {
      const kinematics = new DifferentialDriveKinematics(kTrackWidth);
      const originalChassisSpeeds = new ChassisSpeeds(1.0, 0.0, 2.0);
      
      const wheelSpeeds = kinematics.toWheelSpeeds(originalChassisSpeeds);
      const newChassisSpeeds = kinematics.toChassisSpeeds(wheelSpeeds);
      
      expect(newChassisSpeeds.vxMetersPerSecond).toBeCloseTo(originalChassisSpeeds.vxMetersPerSecond, 9);
      expect(newChassisSpeeds.vyMetersPerSecond).toBeCloseTo(originalChassisSpeeds.vyMetersPerSecond, 9);
      expect(newChassisSpeeds.omegaRadiansPerSecond).toBeCloseTo(originalChassisSpeeds.omegaRadiansPerSecond, 9);
    });
  });
});
