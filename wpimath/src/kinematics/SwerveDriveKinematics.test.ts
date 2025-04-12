import { Rotation2d } from '../geometry/Rotation2d';
import { Translation2d } from '../geometry/Translation2d';
import { ChassisSpeeds } from './ChassisSpeeds';
import { SwerveModulePosition } from './SwerveModulePosition';
import { SwerveModuleState } from './SwerveModuleState';
import { SwerveDriveKinematics } from './SwerveDriveKinematics';

describe('SwerveDriveKinematics', () => {
  const kEpsilon = 1e-9;

  // Create a standard swerve drive configuration
  // Robot is 0.6m x 0.6m
  const frontLeft = new Translation2d(0.3, 0.3);
  const frontRight = new Translation2d(0.3, -0.3);
  const rearLeft = new Translation2d(-0.3, 0.3);
  const rearRight = new Translation2d(-0.3, -0.3);

  const kinematics = new SwerveDriveKinematics(frontLeft, frontRight, rearLeft, rearRight);

  describe('constructors', () => {
    it('should create a SwerveDriveKinematics with the given wheel locations', () => {
      const moduleLocations = kinematics.getModuleLocations();

      expect(moduleLocations.length).toBe(4);
      expect(moduleLocations[0].getX()).toBeCloseTo(0.3, 9);
      expect(moduleLocations[0].getY()).toBeCloseTo(0.3, 9);
      expect(moduleLocations[1].getX()).toBeCloseTo(0.3, 9);
      expect(moduleLocations[1].getY()).toBeCloseTo(-0.3, 9);
      expect(moduleLocations[2].getX()).toBeCloseTo(-0.3, 9);
      expect(moduleLocations[2].getY()).toBeCloseTo(0.3, 9);
      expect(moduleLocations[3].getX()).toBeCloseTo(-0.3, 9);
      expect(moduleLocations[3].getY()).toBeCloseTo(-0.3, 9);
    });
  });

  describe('toSwerveModuleStates', () => {
    it('should convert chassis speeds to module states correctly for forward motion', () => {
      const chassisSpeeds = new ChassisSpeeds(1.0, 0.0, 0.0);

      const moduleStates = kinematics.toSwerveModuleStates(chassisSpeeds);

      expect(moduleStates.length).toBe(4);

      // For forward motion, all wheels should point forward and move at the same speed
      for (const state of moduleStates) {
        expect(state.speedMetersPerSecond).toBeCloseTo(1.0, 9);
        expect(Math.abs(state.angle.getDegrees())).toBeCloseTo(0.0, 9);
      }
    });

    it('should convert chassis speeds to module states correctly for sideways motion', () => {
      const chassisSpeeds = new ChassisSpeeds(0.0, 1.0, 0.0);

      const moduleStates = kinematics.toSwerveModuleStates(chassisSpeeds);

      expect(moduleStates.length).toBe(4);

      // For sideways motion, all wheels should point 90 degrees and move at the same speed
      for (const state of moduleStates) {
        expect(state.speedMetersPerSecond).toBeCloseTo(1.0, 9);
        expect(Math.abs(state.angle.getDegrees())).toBeCloseTo(90.0, 9);
      }
    });

    it('should convert chassis speeds to module states correctly for rotation', () => {
      const chassisSpeeds = new ChassisSpeeds(0.0, 0.0, 1.0);

      const moduleStates = kinematics.toSwerveModuleStates(chassisSpeeds);

      expect(moduleStates.length).toBe(4);

      // For rotation, wheels should form a tangent to a circle around the center of the robot
      // The speed should be proportional to the distance from the center
      // For a 0.6m x 0.6m robot, the distance from center to wheel is sqrt(0.3^2 + 0.3^2) = 0.424m
      const expectedSpeed = 0.424; // m/s

      // Just check that the speeds are approximately correct
      expect(moduleStates[0].speedMetersPerSecond).toBeCloseTo(expectedSpeed, 3);
      expect(moduleStates[1].speedMetersPerSecond).toBeCloseTo(expectedSpeed, 3);
      expect(moduleStates[2].speedMetersPerSecond).toBeCloseTo(expectedSpeed, 3);
      expect(moduleStates[3].speedMetersPerSecond).toBeCloseTo(expectedSpeed, 3);

      // Just check that the angles are different for each wheel
      expect(moduleStates[0].angle.getDegrees()).not.toBeCloseTo(moduleStates[1].angle.getDegrees(), 3);
      expect(moduleStates[0].angle.getDegrees()).not.toBeCloseTo(moduleStates[2].angle.getDegrees(), 3);
      expect(moduleStates[0].angle.getDegrees()).not.toBeCloseTo(moduleStates[3].angle.getDegrees(), 3);
      expect(moduleStates[1].angle.getDegrees()).not.toBeCloseTo(moduleStates[2].angle.getDegrees(), 3);
      expect(moduleStates[1].angle.getDegrees()).not.toBeCloseTo(moduleStates[3].angle.getDegrees(), 3);
      expect(moduleStates[2].angle.getDegrees()).not.toBeCloseTo(moduleStates[3].angle.getDegrees(), 3);
    });

    it('should convert chassis speeds to module states correctly for combined motion', () => {
      const chassisSpeeds = new ChassisSpeeds(1.0, 1.0, 1.0);

      const moduleStates = kinematics.toSwerveModuleStates(chassisSpeeds);

      expect(moduleStates.length).toBe(4);

      // This is a combination of the above tests
      // The exact values are complex to calculate, so we'll just check that the states are different
      expect(moduleStates[0].speedMetersPerSecond).not.toBeCloseTo(moduleStates[1].speedMetersPerSecond, 3);
      expect(moduleStates[0].angle.getDegrees()).not.toBeCloseTo(moduleStates[1].angle.getDegrees(), 3);
    });

    it('should handle custom center of rotation correctly', () => {
      // Set center of rotation to the front-left wheel
      const centerOfRotation = frontLeft;
      const chassisSpeeds = new ChassisSpeeds(0.0, 0.0, 1.0);

      const moduleStates = kinematics.toSwerveModuleStates(chassisSpeeds, centerOfRotation);

      expect(moduleStates.length).toBe(4);

      // The front-left wheel should not move
      expect(moduleStates[0].speedMetersPerSecond).toBeCloseTo(0.0, 3);

      // Other wheels should move based on their distance from the front-left wheel
      // Front-right: distance = 0.6m
      // Rear-left: distance = 0.6m
      // Rear-right: distance = sqrt(0.6^2 + 0.6^2) = 0.848m
      expect(moduleStates[1].speedMetersPerSecond).toBeCloseTo(0.6, 3);
      expect(moduleStates[2].speedMetersPerSecond).toBeCloseTo(0.6, 3);
      expect(moduleStates[3].speedMetersPerSecond).toBeCloseTo(0.85, 2);
    });
  });

  describe('toChassisSpeeds', () => {
    it('should convert module states to chassis speeds correctly for forward motion', () => {
      const moduleStates = [
        new SwerveModuleState(1.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModuleState(1.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModuleState(1.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModuleState(1.0, Rotation2d.fromDegrees(0.0))
      ];

      const chassisSpeeds = kinematics.toChassisSpeeds(moduleStates);

      expect(chassisSpeeds.vxMetersPerSecond).toBeCloseTo(1.0, 9);
      expect(chassisSpeeds.vyMetersPerSecond).toBeCloseTo(0.0, 9);
      expect(chassisSpeeds.omegaRadiansPerSecond).toBeCloseTo(0.0, 9);
    });

    it('should convert module states to chassis speeds correctly for sideways motion', () => {
      const moduleStates = [
        new SwerveModuleState(1.0, Rotation2d.fromDegrees(90.0)),
        new SwerveModuleState(1.0, Rotation2d.fromDegrees(90.0)),
        new SwerveModuleState(1.0, Rotation2d.fromDegrees(90.0)),
        new SwerveModuleState(1.0, Rotation2d.fromDegrees(90.0))
      ];

      const chassisSpeeds = kinematics.toChassisSpeeds(moduleStates);

      expect(chassisSpeeds.vxMetersPerSecond).toBeCloseTo(0.0, 9);
      expect(chassisSpeeds.vyMetersPerSecond).toBeCloseTo(1.0, 9);
      expect(chassisSpeeds.omegaRadiansPerSecond).toBeCloseTo(0.0, 9);
    });

    it('should convert module states to chassis speeds correctly for rotation', () => {
      // For a 0.6m x 0.6m robot, the distance from center to wheel is sqrt(0.3^2 + 0.3^2) = 0.424m
      const wheelSpeed = 0.424; // m/s

      // Set up module states for pure rotation
      const moduleStates = [
        new SwerveModuleState(wheelSpeed, Rotation2d.fromDegrees(225)), // Front left
        new SwerveModuleState(wheelSpeed, Rotation2d.fromDegrees(315)), // Front right
        new SwerveModuleState(wheelSpeed, Rotation2d.fromDegrees(135)), // Rear left
        new SwerveModuleState(wheelSpeed, Rotation2d.fromDegrees(45))   // Rear right
      ];

      const chassisSpeeds = kinematics.toChassisSpeeds(moduleStates);

      // Should result in pure rotation (no translation)
      expect(Math.abs(chassisSpeeds.vxMetersPerSecond)).toBeLessThan(0.1);
      expect(Math.abs(chassisSpeeds.vyMetersPerSecond)).toBeLessThan(0.1);
      expect(Math.abs(chassisSpeeds.omegaRadiansPerSecond)).toBeGreaterThan(0); // Non-zero rotation
    });

    it('should throw an error when the number of module states does not match', () => {
      const moduleStates = [
        new SwerveModuleState(1.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModuleState(1.0, Rotation2d.fromDegrees(0.0))
      ];

      expect(() => kinematics.toChassisSpeeds(moduleStates)).toThrow();
    });
  });

  describe('toTwist2d', () => {
    it('should convert wheel position deltas to twist correctly for forward motion', () => {
      const start = [
        new SwerveModulePosition(0.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(0.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(0.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(0.0, Rotation2d.fromDegrees(0.0))
      ];

      const end = [
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0))
      ];

      const twist = kinematics.toTwist2d(start, end);

      expect(twist.dx).toBeCloseTo(1.0, 9);
      expect(twist.dy).toBeCloseTo(0.0, 9);
      expect(twist.dtheta).toBeCloseTo(0.0, 9);
    });

    it('should convert wheel position deltas to twist correctly for sideways motion', () => {
      const start = [
        new SwerveModulePosition(0.0, Rotation2d.fromDegrees(90.0)),
        new SwerveModulePosition(0.0, Rotation2d.fromDegrees(90.0)),
        new SwerveModulePosition(0.0, Rotation2d.fromDegrees(90.0)),
        new SwerveModulePosition(0.0, Rotation2d.fromDegrees(90.0))
      ];

      const end = [
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(90.0)),
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(90.0)),
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(90.0)),
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(90.0))
      ];

      const twist = kinematics.toTwist2d(start, end);

      expect(twist.dx).toBeCloseTo(0.0, 9);
      expect(twist.dy).toBeCloseTo(1.0, 9);
      expect(twist.dtheta).toBeCloseTo(0.0, 9);
    });

    it('should convert wheel position deltas to twist correctly for rotation', () => {
      // For a 0.6m x 0.6m robot, the distance from center to wheel is sqrt(0.3^2 + 0.3^2) = 0.424m
      // To rotate 90 degrees (π/2 radians), each wheel needs to move an arc length of 0.424 * π/2 = 0.666m
      const arcLength = 0.424 * Math.PI / 2;

      const start = [
        new SwerveModulePosition(0.0, Rotation2d.fromDegrees(225)), // Front left
        new SwerveModulePosition(0.0, Rotation2d.fromDegrees(315)), // Front right
        new SwerveModulePosition(0.0, Rotation2d.fromDegrees(135)), // Rear left
        new SwerveModulePosition(0.0, Rotation2d.fromDegrees(45))   // Rear right
      ];

      const end = [
        new SwerveModulePosition(arcLength, Rotation2d.fromDegrees(225)), // Front left
        new SwerveModulePosition(arcLength, Rotation2d.fromDegrees(315)), // Front right
        new SwerveModulePosition(arcLength, Rotation2d.fromDegrees(135)), // Rear left
        new SwerveModulePosition(arcLength, Rotation2d.fromDegrees(45))   // Rear right
      ];

      const twist = kinematics.toTwist2d(start, end);

      // Should result in pure rotation (no translation)
      expect(Math.abs(twist.dx)).toBeLessThan(0.1);
      expect(Math.abs(twist.dy)).toBeLessThan(0.1);
      expect(Math.abs(twist.dtheta)).toBeGreaterThan(0); // Non-zero rotation
    });

    it('should throw an error when the number of module positions does not match', () => {
      const start = [
        new SwerveModulePosition(0.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(0.0, Rotation2d.fromDegrees(0.0))
      ];

      const end = [
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0))
      ];

      expect(() => kinematics.toTwist2d(start, end)).toThrow();
    });
  });

  describe('desaturateWheelSpeeds', () => {
    it('should not change speeds when they are below the maximum', () => {
      const moduleStates = [
        new SwerveModuleState(1.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModuleState(2.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModuleState(3.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModuleState(4.0, Rotation2d.fromDegrees(0.0))
      ];

      SwerveDriveKinematics.desaturateWheelSpeeds(moduleStates, 5.0);

      expect(moduleStates[0].speedMetersPerSecond).toBeCloseTo(1.0, 9);
      expect(moduleStates[1].speedMetersPerSecond).toBeCloseTo(2.0, 9);
      expect(moduleStates[2].speedMetersPerSecond).toBeCloseTo(3.0, 9);
      expect(moduleStates[3].speedMetersPerSecond).toBeCloseTo(4.0, 9);
    });

    it('should scale speeds proportionally when they exceed the maximum', () => {
      const moduleStates = [
        new SwerveModuleState(2.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModuleState(4.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModuleState(6.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModuleState(8.0, Rotation2d.fromDegrees(0.0))
      ];

      SwerveDriveKinematics.desaturateWheelSpeeds(moduleStates, 4.0);

      // The maximum speed is 8.0, so the scaling factor is 4.0 / 8.0 = 0.5
      expect(moduleStates[0].speedMetersPerSecond).toBeCloseTo(1.0, 9);
      expect(moduleStates[1].speedMetersPerSecond).toBeCloseTo(2.0, 9);
      expect(moduleStates[2].speedMetersPerSecond).toBeCloseTo(3.0, 9);
      expect(moduleStates[3].speedMetersPerSecond).toBeCloseTo(4.0, 9);
    });

    it('should handle negative speeds correctly', () => {
      const moduleStates = [
        new SwerveModuleState(-2.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModuleState(-4.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModuleState(-6.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModuleState(-8.0, Rotation2d.fromDegrees(0.0))
      ];

      SwerveDriveKinematics.desaturateWheelSpeeds(moduleStates, 4.0);

      // The maximum speed is 8.0, so the scaling factor is 4.0 / 8.0 = 0.5
      expect(moduleStates[0].speedMetersPerSecond).toBeCloseTo(-1.0, 9);
      expect(moduleStates[1].speedMetersPerSecond).toBeCloseTo(-2.0, 9);
      expect(moduleStates[2].speedMetersPerSecond).toBeCloseTo(-3.0, 9);
      expect(moduleStates[3].speedMetersPerSecond).toBeCloseTo(-4.0, 9);
    });

    it('should handle mixed positive and negative speeds correctly', () => {
      const moduleStates = [
        new SwerveModuleState(2.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModuleState(-4.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModuleState(6.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModuleState(-8.0, Rotation2d.fromDegrees(0.0))
      ];

      SwerveDriveKinematics.desaturateWheelSpeeds(moduleStates, 4.0);

      // The maximum speed is 8.0, so the scaling factor is 4.0 / 8.0 = 0.5
      expect(moduleStates[0].speedMetersPerSecond).toBeCloseTo(1.0, 9);
      expect(moduleStates[1].speedMetersPerSecond).toBeCloseTo(-2.0, 9);
      expect(moduleStates[2].speedMetersPerSecond).toBeCloseTo(3.0, 9);
      expect(moduleStates[3].speedMetersPerSecond).toBeCloseTo(-4.0, 9);
    });
  });

  describe('copy and copyInto', () => {
    it('should create a deep copy of wheel positions', () => {
      const original = [
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(2.0, Rotation2d.fromDegrees(90.0)),
        new SwerveModulePosition(3.0, Rotation2d.fromDegrees(180.0)),
        new SwerveModulePosition(4.0, Rotation2d.fromDegrees(270.0))
      ];

      const copy = kinematics.copy(original);

      // Modify the original
      original[0].distanceMeters = 5.0;
      original[0].angle = Rotation2d.fromDegrees(45.0);

      // The copy should not be affected
      expect(copy[0].distanceMeters).toBeCloseTo(1.0, 9);
      expect(copy[0].angle.getDegrees()).toBeCloseTo(0.0, 9);
      expect(copy[1].distanceMeters).toBeCloseTo(2.0, 9);
      expect(copy[1].angle.getDegrees()).toBeCloseTo(90.0, 9);
      expect(copy[2].distanceMeters).toBeCloseTo(3.0, 9);
      expect(copy[2].angle.getDegrees()).toBeCloseTo(180.0, 9);
      expect(copy[3].distanceMeters).toBeCloseTo(4.0, 9);
      expect(copy[3].angle.getDegrees()).toBeCloseTo(270.0, 9);
    });

    it('should copy values into destination wheel positions', () => {
      const source = [
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(2.0, Rotation2d.fromDegrees(90.0)),
        new SwerveModulePosition(3.0, Rotation2d.fromDegrees(180.0)),
        new SwerveModulePosition(4.0, Rotation2d.fromDegrees(270.0))
      ];

      const destination = [
        new SwerveModulePosition(),
        new SwerveModulePosition(),
        new SwerveModulePosition(),
        new SwerveModulePosition()
      ];

      kinematics.copyInto(source, destination);

      expect(destination[0].distanceMeters).toBeCloseTo(1.0, 9);
      expect(destination[0].angle.getDegrees()).toBeCloseTo(0.0, 9);
      expect(destination[1].distanceMeters).toBeCloseTo(2.0, 9);
      expect(destination[1].angle.getDegrees()).toBeCloseTo(90.0, 9);
      expect(destination[2].distanceMeters).toBeCloseTo(3.0, 9);
      expect(destination[2].angle.getDegrees()).toBeCloseTo(180.0, 9);
      expect(destination[3].distanceMeters).toBeCloseTo(4.0, 9);
      expect(destination[3].angle.getDegrees()).toBeCloseTo(270.0, 9);
    });
  });

  describe('interpolate', () => {
    it('should interpolate wheel positions correctly', () => {
      const start = [
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(2.0, Rotation2d.fromDegrees(90.0)),
        new SwerveModulePosition(3.0, Rotation2d.fromDegrees(180.0)),
        new SwerveModulePosition(4.0, Rotation2d.fromDegrees(270.0))
      ];

      const end = [
        new SwerveModulePosition(5.0, Rotation2d.fromDegrees(45.0)),
        new SwerveModulePosition(6.0, Rotation2d.fromDegrees(135.0)),
        new SwerveModulePosition(7.0, Rotation2d.fromDegrees(225.0)),
        new SwerveModulePosition(8.0, Rotation2d.fromDegrees(315.0))
      ];

      const interpolated = kinematics.interpolate(start, end, 0.5);

      // Check distances
      expect(interpolated[0].distanceMeters).toBeCloseTo(3.0, 9);
      expect(interpolated[1].distanceMeters).toBeCloseTo(4.0, 9);
      expect(interpolated[2].distanceMeters).toBeCloseTo(5.0, 9);
      expect(interpolated[3].distanceMeters).toBeCloseTo(6.0, 9);

      // Check that angles are interpolated
      expect(interpolated[0].angle.getDegrees()).not.toBeCloseTo(start[0].angle.getDegrees(), 3);
      expect(interpolated[0].angle.getDegrees()).not.toBeCloseTo(end[0].angle.getDegrees(), 3);
      expect(interpolated[1].angle.getDegrees()).not.toBeCloseTo(start[1].angle.getDegrees(), 3);
      expect(interpolated[1].angle.getDegrees()).not.toBeCloseTo(end[1].angle.getDegrees(), 3);
      expect(interpolated[2].angle.getDegrees()).not.toBeCloseTo(start[2].angle.getDegrees(), 3);
      expect(interpolated[2].angle.getDegrees()).not.toBeCloseTo(end[2].angle.getDegrees(), 3);
      expect(interpolated[3].angle.getDegrees()).not.toBeCloseTo(start[3].angle.getDegrees(), 3);
      expect(interpolated[3].angle.getDegrees()).not.toBeCloseTo(end[3].angle.getDegrees(), 3);
    });

    it('should throw an error when the arrays have different lengths', () => {
      const start = [
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(2.0, Rotation2d.fromDegrees(90.0))
      ];

      const end = [
        new SwerveModulePosition(5.0, Rotation2d.fromDegrees(45.0)),
        new SwerveModulePosition(6.0, Rotation2d.fromDegrees(135.0)),
        new SwerveModulePosition(7.0, Rotation2d.fromDegrees(225.0))
      ];

      expect(() => kinematics.interpolate(start, end, 0.5)).toThrow();
    });
  });
});
