import { Pose2d, Transform2d } from './Pose2d';
import { Rotation2d } from './Rotation2d';
import { Translation2d } from './Translation2d';
import { Twist2d } from './Twist2d';

describe('Pose2d', () => {
  const kEpsilon = 1E-9;

  describe('constructors', () => {
    it('should create a default pose at the origin', () => {
      const pose = new Pose2d();
      expect(pose.getX()).toBeCloseTo(0, 9);
      expect(pose.getY()).toBeCloseTo(0, 9);
      expect(pose.getRotation().getRadians()).toBeCloseTo(0, 9);
    });

    it('should create a pose with the given translation and rotation', () => {
      const translation = new Translation2d(3, 4);
      const rotation = Rotation2d.fromDegrees(45);
      const pose = new Pose2d(translation, rotation);

      expect(pose.getTranslation()).toBe(translation);
      expect(pose.getRotation()).toBe(rotation);
      expect(pose.getX()).toBeCloseTo(3, 9);
      expect(pose.getY()).toBeCloseTo(4, 9);
      expect(pose.getRotation().getDegrees()).toBeCloseTo(45, 9);
    });

    it('should create a pose with the given x, y, and rotation', () => {
      const rotation = Rotation2d.fromDegrees(45);
      const pose = new Pose2d(3, 4, rotation);

      expect(pose.getX()).toBeCloseTo(3, 9);
      expect(pose.getY()).toBeCloseTo(4, 9);
      expect(pose.getRotation()).toBe(rotation);
    });
  });

  describe('transformations', () => {
    it('should transform a pose by a transform', () => {
      const initial = new Pose2d(5, 5, Rotation2d.fromDegrees(45));
      const transform = new Transform2d(new Translation2d(5, 5), Rotation2d.fromDegrees(5));

      const transformed = initial.transformBy(transform);

      expect(transformed.getX()).toBeCloseTo(5, 3);
      expect(transformed.getY()).toBeCloseTo(12.071, 3);
      expect(transformed.getRotation().getDegrees()).toBeCloseTo(50, 9);
    });

    it('should calculate the transform between two poses', () => {
      const initial = new Pose2d(0, 0, Rotation2d.fromDegrees(0));
      const end = new Pose2d(5, 5, Rotation2d.fromDegrees(90));

      const transform = end.minus(initial);

      expect(transform.getTranslation().getX()).toBeCloseTo(5, 9);
      expect(transform.getTranslation().getY()).toBeCloseTo(5, 9);
      expect(transform.getRotation().getDegrees()).toBeCloseTo(90, 9);
    });

    it('should calculate a pose relative to another pose', () => {
      const initial = new Pose2d(10, 10, Rotation2d.fromDegrees(45));
      const end = new Pose2d(15, 15, Rotation2d.fromDegrees(90));

      const relative = end.relativeTo(initial);

      expect(relative.getX()).toBeCloseTo(7.071, 3);
      expect(relative.getY()).toBeCloseTo(0, 3);
      expect(relative.getRotation().getDegrees()).toBeCloseTo(45, 9);
    });
  });

  describe('exp and log', () => {
    it('should calculate the pose exponential', () => {
      const pose = new Pose2d(1, 2, Rotation2d.fromDegrees(45));
      const twist = new Twist2d(1, 2, Math.PI / 4);

      const newPose = pose.exp(twist);

      expect(newPose.getX()).toBeCloseTo(-0.428, 3);
      expect(newPose.getY()).toBeCloseTo(3.646, 3);
      expect(newPose.getRotation().getDegrees()).toBeCloseTo(90, 9);
    });

    it('should calculate the pose logarithm', () => {
      const initial = new Pose2d(1, 2, Rotation2d.fromDegrees(45));
      const end = new Pose2d(2, 3, Rotation2d.fromDegrees(90));

      const twist = initial.log(end);

      expect(twist.dx).toBeCloseTo(1.341, 3);
      expect(twist.dy).toBeCloseTo(-0.555, 3);
      expect(twist.dtheta).toBeCloseTo(Math.PI / 4, 9);
    });

    it('should be reversible (exp(log(p)) = p)', () => {
      const initial = new Pose2d(1, 2, Rotation2d.fromDegrees(45));
      const end = new Pose2d(2, 3, Rotation2d.fromDegrees(90));

      const twist = initial.log(end);
      const reconstructed = initial.exp(twist);

      expect(reconstructed.getX()).toBeCloseTo(end.getX(), 3);
      expect(reconstructed.getY()).toBeCloseTo(end.getY(), 3);
      expect(reconstructed.getRotation().getDegrees()).toBeCloseTo(end.getRotation().getDegrees(), 3);
    });
  });

  describe('interpolation', () => {
    it('should interpolate between two poses', () => {
      const a = new Pose2d(0, 0, Rotation2d.fromDegrees(0));
      const b = new Pose2d(10, 10, Rotation2d.fromDegrees(90));

      const interp1 = a.interpolate(b, 0);
      expect(interp1.getX()).toBeCloseTo(0, 9);
      expect(interp1.getY()).toBeCloseTo(0, 9);
      expect(interp1.getRotation().getDegrees()).toBeCloseTo(0, 9);

      const interp2 = a.interpolate(b, 0.5);
      expect(interp2.getX()).toBeCloseTo(7.071, 3);
      expect(interp2.getY()).toBeCloseTo(2.929, 3);
      expect(interp2.getRotation().getDegrees()).toBeCloseTo(45, 9);

      const interp3 = a.interpolate(b, 1);
      expect(interp3.getX()).toBeCloseTo(10, 9);
      expect(interp3.getY()).toBeCloseTo(10, 9);
      expect(interp3.getRotation().getDegrees()).toBeCloseTo(90, 9);
    });
  });

  describe('equality', () => {
    it('should correctly determine equality', () => {
      const a = new Pose2d(1, 2, Rotation2d.fromDegrees(45));
      const b = new Pose2d(1, 2, Rotation2d.fromDegrees(45));
      const c = new Pose2d(3, 4, Rotation2d.fromDegrees(90));

      expect(a.equals(b)).toBe(true);
      expect(a.equals(c)).toBe(false);
      expect(a.equals(null)).toBe(false);
      expect(a.equals({})).toBe(false);
    });
  });

  describe('string representation', () => {
    it('should return a correct string representation', () => {
      const pose = new Pose2d(1, 2, Rotation2d.fromDegrees(45));
      expect(pose.toString()).toBe('Pose2d(Translation: Translation2d(X: 1, Y: 2), Rotation: Rotation2d(45°))');
    });
  });
});

describe('Transform2d', () => {
  const kEpsilon = 1E-9;

  describe('constructors', () => {
    it('should create a transform from initial and final poses', () => {
      const initial = new Pose2d(1, 2, Rotation2d.fromDegrees(45));
      const end = new Pose2d(5, 10, Rotation2d.fromDegrees(90));

      const transform = new Transform2d(initial, end);

      expect(transform.getTranslation().getX()).toBeCloseTo(8.485, 3);
      expect(transform.getTranslation().getY()).toBeCloseTo(2.828, 3);
      expect(transform.getRotation().getDegrees()).toBeCloseTo(45, 9);
    });

    it('should create a transform with the given translation and rotation', () => {
      const translation = new Translation2d(3, 4);
      const rotation = Rotation2d.fromDegrees(45);

      const transform = new Transform2d(translation, rotation);

      expect(transform.getTranslation()).toBe(translation);
      expect(transform.getRotation()).toBe(rotation);
    });
  });

  describe('operations', () => {
    it('should add two transforms', () => {
      const a = new Transform2d(new Translation2d(1, 2), Rotation2d.fromDegrees(45));
      const b = new Transform2d(new Translation2d(3, 4), Rotation2d.fromDegrees(45));

      const sum = a.plus(b);

      expect(sum.getTranslation().getX()).toBeCloseTo(0.293, 3);
      expect(sum.getTranslation().getY()).toBeCloseTo(6.950, 3);
      expect(sum.getRotation().getDegrees()).toBeCloseTo(90, 9);
    });
  });

  describe('equality', () => {
    it('should correctly determine equality', () => {
      const a = new Transform2d(new Translation2d(1, 2), Rotation2d.fromDegrees(45));
      const b = new Transform2d(new Translation2d(1, 2), Rotation2d.fromDegrees(45));
      const c = new Transform2d(new Translation2d(3, 4), Rotation2d.fromDegrees(90));

      expect(a.equals(b)).toBe(true);
      expect(a.equals(c)).toBe(false);
      expect(a.equals(null)).toBe(false);
      expect(a.equals({})).toBe(false);
    });
  });

  describe('string representation', () => {
    it('should return a correct string representation', () => {
      const transform = new Transform2d(new Translation2d(1, 2), Rotation2d.fromDegrees(45));
      expect(transform.toString()).toBe('Transform2d(Translation: Translation2d(X: 1, Y: 2), Rotation: Rotation2d(45°))');
    });
  });
});
