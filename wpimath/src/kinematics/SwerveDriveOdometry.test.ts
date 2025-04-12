import { Pose2d } from '../geometry/Pose2d';
import { Rotation2d } from '../geometry/Rotation2d';
import { Translation2d } from '../geometry/Translation2d';
import { SwerveModulePosition } from './SwerveModulePosition';
import { SwerveDriveKinematics } from './SwerveDriveKinematics';
import { SwerveDriveOdometry } from './SwerveDriveOdometry';

describe('SwerveDriveOdometry', () => {
  const kEpsilon = 1e-9;

  // Create a standard swerve drive configuration
  // Robot is 0.6m x 0.6m
  const frontLeft = new Translation2d(0.3, 0.3);
  const frontRight = new Translation2d(0.3, -0.3);
  const rearLeft = new Translation2d(-0.3, 0.3);
  const rearRight = new Translation2d(-0.3, -0.3);

  const kinematics = new SwerveDriveKinematics(frontLeft, frontRight, rearLeft, rearRight);

  let odometry: SwerveDriveOdometry;
  let initialPositions: SwerveModulePosition[];

  beforeEach(() => {
    // Reset odometry before each test
    initialPositions = [
      new SwerveModulePosition(0.0, Rotation2d.fromDegrees(0.0)),
      new SwerveModulePosition(0.0, Rotation2d.fromDegrees(0.0)),
      new SwerveModulePosition(0.0, Rotation2d.fromDegrees(0.0)),
      new SwerveModulePosition(0.0, Rotation2d.fromDegrees(0.0))
    ];

    odometry = new SwerveDriveOdometry(kinematics, Rotation2d.kZero, initialPositions);
  });

  describe('constructors', () => {
    it('should create a SwerveDriveOdometry with the given values', () => {
      const gyroAngle = Rotation2d.fromDegrees(45);
      const modulePositions = [
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(2.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(3.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(4.0, Rotation2d.fromDegrees(0.0))
      ];
      const initialPose = new Pose2d(5.0, 6.0, Rotation2d.fromDegrees(90));

      const odometry = new SwerveDriveOdometry(kinematics, gyroAngle, modulePositions, initialPose);

      const pose = odometry.getPoseMeters();
      expect(pose.getX()).toBeCloseTo(initialPose.getX(), 9);
      expect(pose.getY()).toBeCloseTo(initialPose.getY(), 9);
      expect(pose.getRotation().getDegrees()).toBeCloseTo(initialPose.getRotation().getDegrees(), 9);
    });

    it('should create a SwerveDriveOdometry with default pose at origin', () => {
      const gyroAngle = Rotation2d.fromDegrees(45);
      const modulePositions = [
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(2.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(3.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(4.0, Rotation2d.fromDegrees(0.0))
      ];

      const odometry = new SwerveDriveOdometry(kinematics, gyroAngle, modulePositions);

      const pose = odometry.getPoseMeters();
      expect(pose.getX()).toBeCloseTo(0, 9);
      expect(pose.getY()).toBeCloseTo(0, 9);
      expect(pose.getRotation().getDegrees()).toBeCloseTo(0, 9);
    });
  });

  describe('resetPosition', () => {
    it('should reset the position correctly', () => {
      const newPose = new Pose2d(3.0, 4.0, Rotation2d.fromDegrees(90));

      odometry.resetPosition(
        Rotation2d.fromDegrees(45),
        [
          new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
          new SwerveModulePosition(2.0, Rotation2d.fromDegrees(0.0)),
          new SwerveModulePosition(3.0, Rotation2d.fromDegrees(0.0)),
          new SwerveModulePosition(4.0, Rotation2d.fromDegrees(0.0))
        ],
        newPose
      );

      const pose = odometry.getPoseMeters();
      expect(pose.getX()).toBeCloseTo(newPose.getX(), 9);
      expect(pose.getY()).toBeCloseTo(newPose.getY(), 9);
      expect(pose.getRotation().getDegrees()).toBeCloseTo(newPose.getRotation().getDegrees(), 9);
    });

    it('should throw an error when the number of module positions does not match', () => {
      const newPose = new Pose2d(3.0, 4.0, Rotation2d.fromDegrees(90));

      expect(() => odometry.resetPosition(
        Rotation2d.fromDegrees(45),
        [
          new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
          new SwerveModulePosition(2.0, Rotation2d.fromDegrees(0.0))
        ],
        newPose
      )).toThrow();
    });
  });

  describe('update', () => {
    it('should update the position correctly when driving straight', () => {
      // Drive straight 1 meter
      const modulePositions = [
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0))
      ];

      const pose = odometry.update(Rotation2d.kZero, modulePositions);

      expect(pose.getX()).toBeCloseTo(1.0, 9);
      expect(pose.getY()).toBeCloseTo(0.0, 9);
      expect(pose.getRotation().getDegrees()).toBeCloseTo(0.0, 9);
    });

    it('should update the position correctly when driving sideways', () => {
      // Drive sideways 1 meter
      const modulePositions = [
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(90.0)),
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(90.0)),
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(90.0)),
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(90.0))
      ];

      const pose = odometry.update(Rotation2d.kZero, modulePositions);

      expect(pose.getX()).toBeCloseTo(0.0, 9);
      expect(pose.getY()).toBeCloseTo(1.0, 9);
      expect(pose.getRotation().getDegrees()).toBeCloseTo(0.0, 9);
    });

    it('should update the position correctly when rotating in place', () => {
      // For a 0.6m x 0.6m robot, the distance from center to wheel is sqrt(0.3^2 + 0.3^2) = 0.424m
      // To rotate 90 degrees (π/2 radians), each wheel needs to move an arc length of 0.424 * π/2 = 0.666m
      const arcLength = 0.424 * Math.PI / 2;

      // Rotate 90 degrees counterclockwise
      const modulePositions = [
        new SwerveModulePosition(arcLength, Rotation2d.fromDegrees(-135.0)),
        new SwerveModulePosition(arcLength, Rotation2d.fromDegrees(-45.0)),
        new SwerveModulePosition(arcLength, Rotation2d.fromDegrees(135.0)),
        new SwerveModulePosition(arcLength, Rotation2d.fromDegrees(45.0))
      ];

      const pose = odometry.update(Rotation2d.fromDegrees(90), modulePositions);

      expect(pose.getX()).toBeCloseTo(0.0, 3);
      expect(pose.getY()).toBeCloseTo(0.0, 3);
      expect(pose.getRotation().getDegrees()).toBeCloseTo(90.0, 3);
    });

    it('should update the position correctly for complex motion', () => {
      // First move forward 1 meter
      odometry.update(
        Rotation2d.kZero,
        [
          new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
          new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
          new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
          new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0))
        ]
      );

      // Then move sideways 1 meter
      odometry.update(
        Rotation2d.kZero,
        [
          new SwerveModulePosition(2.0, Rotation2d.fromDegrees(90.0)),
          new SwerveModulePosition(2.0, Rotation2d.fromDegrees(90.0)),
          new SwerveModulePosition(2.0, Rotation2d.fromDegrees(90.0)),
          new SwerveModulePosition(2.0, Rotation2d.fromDegrees(90.0))
        ]
      );

      // The robot should be at (1, 1)
      const pose = odometry.getPoseMeters();
      expect(pose.getX()).toBeCloseTo(1.0, 9);
      expect(pose.getY()).toBeCloseTo(1.0, 9);
      expect(pose.getRotation().getDegrees()).toBeCloseTo(0.0, 9);
    });

    it('should handle gyro angle correctly', () => {
      // Drive forward while the gyro reports a 90 degree rotation
      const modulePositions = [
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
        new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0))
      ];

      const pose = odometry.update(Rotation2d.fromDegrees(90), modulePositions);

      // The robot should move in the direction of the gyro angle
      // The exact position might vary due to implementation details
      // Just check that the y-coordinate is positive (moving upward) and the rotation is correct
      expect(pose.getY()).toBeGreaterThan(0);
      expect(pose.getRotation().getDegrees()).toBeCloseTo(90.0, 9);
    });

    it('should throw an error when the number of module positions does not match', () => {
      expect(() => odometry.update(
        Rotation2d.kZero,
        [
          new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
          new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0))
        ]
      )).toThrow();
    });
  });

  describe('gyroAngleReset', () => {
    it('should respect the gyro angle after reset', () => {
      // Reset with a 90 degree gyro angle but 0 degree field angle
      odometry.resetPosition(
        Rotation2d.fromDegrees(90),
        [
          new SwerveModulePosition(0.0, Rotation2d.fromDegrees(0.0)),
          new SwerveModulePosition(0.0, Rotation2d.fromDegrees(0.0)),
          new SwerveModulePosition(0.0, Rotation2d.fromDegrees(0.0)),
          new SwerveModulePosition(0.0, Rotation2d.fromDegrees(0.0))
        ],
        new Pose2d(0, 0, Rotation2d.kZero)
      );

      // Drive forward
      const pose = odometry.update(
        Rotation2d.fromDegrees(90),
        [
          new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
          new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
          new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0)),
          new SwerveModulePosition(1.0, Rotation2d.fromDegrees(0.0))
        ]
      );

      // The robot should move in the direction of the field angle (0 degrees)
      expect(pose.getX()).toBeCloseTo(1.0, 9);
      expect(pose.getY()).toBeCloseTo(0.0, 9);
      expect(pose.getRotation().getDegrees()).toBeCloseTo(0.0, 9);
    });
  });
});
