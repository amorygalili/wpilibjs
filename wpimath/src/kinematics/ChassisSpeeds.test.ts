import { ChassisSpeeds } from './ChassisSpeeds';
import { Rotation2d } from '../geometry/Rotation2d';
import { Twist2d } from '../geometry/Twist2d';

describe('ChassisSpeeds', () => {
  const kEpsilon = 1E-9;

  describe('constructors', () => {
    it('should create a ChassisSpeeds with zeros for vx, vy, and omega', () => {
      const speeds = new ChassisSpeeds();
      expect(speeds.vxMetersPerSecond).toBeCloseTo(0, 9);
      expect(speeds.vyMetersPerSecond).toBeCloseTo(0, 9);
      expect(speeds.omegaRadiansPerSecond).toBeCloseTo(0, 9);
    });

    it('should create a ChassisSpeeds with the given values', () => {
      const speeds = new ChassisSpeeds(1.0, 2.0, 3.0);
      expect(speeds.vxMetersPerSecond).toBeCloseTo(1.0, 9);
      expect(speeds.vyMetersPerSecond).toBeCloseTo(2.0, 9);
      expect(speeds.omegaRadiansPerSecond).toBeCloseTo(3.0, 9);
    });
  });

  describe('toTwist2d', () => {
    it('should convert to a Twist2d correctly', () => {
      const speeds = new ChassisSpeeds(1.0, 2.0, 3.0);
      const dt = 0.5;
      const twist = speeds.toTwist2d(dt);

      expect(twist.dx).toBeCloseTo(0.5, 9);
      expect(twist.dy).toBeCloseTo(1.0, 9);
      expect(twist.dtheta).toBeCloseTo(1.5, 9);
    });
  });

  describe('discretize', () => {
    it('should discretize a continuous-time chassis speed correctly', () => {
      const vx = 1.0;
      const vy = 0.5;
      const omega = Math.PI / 2.0;
      const dt = 0.01;

      const discretized = ChassisSpeeds.discretize(vx, vy, omega, dt);

      // Create a twist that represents the continuous chassis speeds applied for dt seconds
      const continuous = new Twist2d(vx * dt, vy * dt, omega * dt);

      // Create a twist that represents the discretized chassis speeds applied for dt seconds
      const discrete = new Twist2d(
        discretized.vxMetersPerSecond * dt,
        discretized.vyMetersPerSecond * dt,
        discretized.omegaRadiansPerSecond * dt
      );

      // The difference between the two should be small
      expect(Math.abs(continuous.dx - discrete.dx)).toBeLessThan(1e-4);
      expect(Math.abs(continuous.dy - discrete.dy)).toBeLessThan(1e-4);
      expect(Math.abs(continuous.dtheta - discrete.dtheta)).toBeLessThan(1e-4);
    });

    it('should discretize a ChassisSpeeds object correctly', () => {
      const speeds = new ChassisSpeeds(1.0, 0.5, Math.PI / 2.0);
      const dt = 0.01;

      const discretized = ChassisSpeeds.discretize(speeds, dt);

      // Create a twist that represents the continuous chassis speeds applied for dt seconds
      const continuous = new Twist2d(
        speeds.vxMetersPerSecond * dt,
        speeds.vyMetersPerSecond * dt,
        speeds.omegaRadiansPerSecond * dt
      );

      // Create a twist that represents the discretized chassis speeds applied for dt seconds
      const discrete = new Twist2d(
        discretized.vxMetersPerSecond * dt,
        discretized.vyMetersPerSecond * dt,
        discretized.omegaRadiansPerSecond * dt
      );

      // The difference between the two should be small
      expect(Math.abs(continuous.dx - discrete.dx)).toBeLessThan(1e-4);
      expect(Math.abs(continuous.dy - discrete.dy)).toBeLessThan(1e-4);
      expect(Math.abs(continuous.dtheta - discrete.dtheta)).toBeLessThan(1e-4);
    });

    it('should handle both overloads of discretize correctly', () => {
      const vx = 1.0;
      const vy = 0.5;
      const omega = Math.PI / 2.0;
      const dt = 0.01;

      // Call with individual parameters
      const discretized1 = ChassisSpeeds.discretize(vx, vy, omega, dt);

      // Call with a ChassisSpeeds object
      const speeds = new ChassisSpeeds(vx, vy, omega);
      const discretized2 = ChassisSpeeds.discretize(speeds, dt);

      // Both should give the same result
      expect(discretized1.vxMetersPerSecond).toBeCloseTo(discretized2.vxMetersPerSecond, 9);
      expect(discretized1.vyMetersPerSecond).toBeCloseTo(discretized2.vyMetersPerSecond, 9);
      expect(discretized1.omegaRadiansPerSecond).toBeCloseTo(discretized2.omegaRadiansPerSecond, 9);
    });
  });

  describe('fromFieldRelativeSpeeds', () => {
    it('should convert field-relative speeds to robot-relative speeds correctly', () => {
      const vx = 1.0;
      const vy = 0.0;
      const omega = 0.5;
      const robotAngle = new Rotation2d(Math.PI / 2.0);

      const robotRelative = ChassisSpeeds.fromFieldRelativeSpeeds(vx, vy, omega, robotAngle);

      // When the robot is rotated 90 degrees, the field-relative +x becomes robot-relative +y
      expect(robotRelative.vxMetersPerSecond).toBeCloseTo(0.0, 9);
      expect(robotRelative.vyMetersPerSecond).toBeCloseTo(-1.0, 9);
      expect(robotRelative.omegaRadiansPerSecond).toBeCloseTo(0.5, 9);
    });
  });

  describe('fromRobotRelativeSpeeds', () => {
    it('should convert robot-relative speeds to field-relative speeds correctly', () => {
      const vx = 1.0;
      const vy = 0.0;
      const omega = 0.5;
      const robotAngle = new Rotation2d(Math.PI / 2.0);

      const fieldRelative = ChassisSpeeds.fromRobotRelativeSpeeds(vx, vy, omega, robotAngle);

      // When the robot is rotated 90 degrees, the robot-relative +x becomes field-relative -y
      expect(fieldRelative.vxMetersPerSecond).toBeCloseTo(0.0, 9);
      expect(fieldRelative.vyMetersPerSecond).toBeCloseTo(1.0, 9);
      expect(fieldRelative.omegaRadiansPerSecond).toBeCloseTo(0.5, 9);
    });
  });
});
