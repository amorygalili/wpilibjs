import { DifferentialDriveOdometry } from './DifferentialDriveOdometry';
import { Pose2d } from '../geometry/Pose2d';
import { Rotation2d } from '../geometry/Rotation2d';

describe('DifferentialDriveOdometry', () => {
  const kEpsilon = 1E-9;

  describe('constructors', () => {
    it('should create a DifferentialDriveOdometry with the given values', () => {
      const gyroAngle = Rotation2d.fromDegrees(45);
      const leftDistance = 1.0;
      const rightDistance = 2.0;
      const initialPose = new Pose2d(3.0, 4.0, Rotation2d.fromDegrees(90));

      const odometry = new DifferentialDriveOdometry(gyroAngle, leftDistance, rightDistance, initialPose);

      const pose = odometry.getPoseMeters();
      expect(pose.getX()).toBeCloseTo(initialPose.getX(), 9);
      expect(pose.getY()).toBeCloseTo(initialPose.getY(), 9);
      expect(pose.getRotation().getDegrees()).toBeCloseTo(initialPose.getRotation().getDegrees(), 9);
    });

    it('should create a DifferentialDriveOdometry with default values', () => {
      const gyroAngle = Rotation2d.fromDegrees(45);

      const odometry = new DifferentialDriveOdometry(gyroAngle);

      const pose = odometry.getPoseMeters();
      expect(pose.getX()).toBeCloseTo(0, 9);
      expect(pose.getY()).toBeCloseTo(0, 9);
      expect(pose.getRotation().getDegrees()).toBeCloseTo(0, 9);
    });
  });

  describe('resetPosition', () => {
    it('should reset the position correctly', () => {
      const odometry = new DifferentialDriveOdometry(Rotation2d.kZero);
      const newPose = new Pose2d(3.0, 4.0, Rotation2d.fromDegrees(90));

      odometry.resetPositionWithDistances(Rotation2d.fromDegrees(45), 1.0, 2.0, newPose);

      const pose = odometry.getPoseMeters();
      expect(pose.getX()).toBeCloseTo(newPose.getX(), 9);
      expect(pose.getY()).toBeCloseTo(newPose.getY(), 9);
      expect(pose.getRotation().getDegrees()).toBeCloseTo(newPose.getRotation().getDegrees(), 9);
    });
  });

  describe('update', () => {
    it('should update the position correctly when driving straight', () => {
      const odometry = new DifferentialDriveOdometry(Rotation2d.kZero, 0, 0, Pose2d.kZero);

      // Drive straight 1 meter
      const pose = odometry.updateWithDistances(Rotation2d.kZero, 1.0, 1.0);

      expect(pose.getX()).toBeCloseTo(1.0, 9);
      expect(pose.getY()).toBeCloseTo(0.0, 9);
      expect(pose.getRotation().getDegrees()).toBeCloseTo(0.0, 9);
    });

    it('should update the position correctly when turning in place', () => {
      const odometry = new DifferentialDriveOdometry(Rotation2d.kZero, 0, 0, Pose2d.kZero);

      // Turn 90 degrees (right wheel forward, left wheel backward)
      // The kinematics trackwidth is 1, so we need to move the wheels pi/2 distance
      const distance = Math.PI / 2;
      const pose = odometry.updateWithDistances(Rotation2d.fromDegrees(90), -distance, distance);

      expect(pose.getX()).toBeCloseTo(0.0, 9);
      expect(pose.getY()).toBeCloseTo(0.0, 9);
      expect(pose.getRotation().getDegrees()).toBeCloseTo(90.0, 9);
    });

    it('should update the position correctly when driving in an arc', () => {
      const odometry = new DifferentialDriveOdometry(Rotation2d.kZero, 0, 0, Pose2d.kZero);

      // Drive in a quarter circle arc with radius 1 meter
      // For a differential drive, the inner wheel travels less distance than the outer wheel
      // For a 90 degree turn with radius 1 meter, the arc length is pi/2
      // The inner wheel (left) travels less, the outer wheel (right) travels more
      const innerDistance = Math.PI / 2 * 0.5; // Inner wheel at radius 0.5
      const outerDistance = Math.PI / 2 * 1.5; // Outer wheel at radius 1.5

      const pose = odometry.updateWithDistances(Rotation2d.fromDegrees(90), innerDistance, outerDistance);

      // The robot should end up at (1, 1) with a 90 degree rotation
      expect(pose.getX()).toBeCloseTo(1.0, 1);
      expect(pose.getY()).toBeCloseTo(1.0, 1);
      expect(pose.getRotation().getDegrees()).toBeCloseTo(90.0, 9);
    });
  });
});
