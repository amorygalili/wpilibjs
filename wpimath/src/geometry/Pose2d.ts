import { MathUtil } from '../MathUtil';
import { Rotation2d } from './Rotation2d';
import { Translation2d } from './Translation2d';
import { Twist2d } from './Twist2d';

/**
 * Represents a 2D pose containing translational and rotational elements.
 */
export class Pose2d {
  /**
   * A preallocated Pose2d representing the origin.
   *
   * This exists to avoid allocations for common poses.
   */
  public static readonly kZero = new Pose2d();

  private readonly m_translation: Translation2d;
  private readonly m_rotation: Rotation2d;

  /**
   * Constructs a pose at the origin facing toward the positive X axis.
   */
  constructor();

  /**
   * Constructs a pose with the specified translation and rotation.
   *
   * @param translation The translational component of the pose.
   * @param rotation The rotational component of the pose.
   */
  constructor(translation: Translation2d, rotation: Rotation2d);

  /**
   * Constructs a pose with x and y translations instead of a separate Translation2d.
   *
   * @param x The x component of the translational component of the pose.
   * @param y The y component of the translational component of the pose.
   * @param rotation The rotational component of the pose.
   */
  constructor(x: number, y: number, rotation: Rotation2d);

  constructor(
    translationOrX?: Translation2d | number,
    rotationOrY?: Rotation2d | number,
    rotation?: Rotation2d
  ) {
    if (translationOrX === undefined || rotationOrY === undefined) {
      // Default constructor
      this.m_translation = Translation2d.kZero;
      this.m_rotation = Rotation2d.kZero;
    } else if (translationOrX instanceof Translation2d && rotationOrY instanceof Rotation2d) {
      // Translation2d, Rotation2d constructor
      this.m_translation = translationOrX;
      this.m_rotation = rotationOrY;
    } else if (
      typeof translationOrX === 'number' &&
      typeof rotationOrY === 'number' &&
      rotation !== undefined
    ) {
      // x, y, Rotation2d constructor
      this.m_translation = new Translation2d(translationOrX, rotationOrY);
      this.m_rotation = rotation;
    } else {
      throw new Error('Invalid arguments for Pose2d constructor');
    }
  }

  /**
   * Transforms the pose by the given transformation and returns the new transformed pose.
   *
   * [x_new]    [cos, -sin, 0][transform.x]
   * [y_new] += [sin,  cos, 0][transform.y]
   * [t_new]    [  0,    0, 1][transform.t]
   *
   * @param other The transform to transform the pose by.
   * @return The transformed pose.
   */
  public plus(other: Transform2d): Pose2d {
    return this.transformBy(other);
  }

  /**
   * Returns the Transform2d that maps the one pose to another.
   *
   * @param other The initial pose of the transformation.
   * @return The transform that maps the other pose to the current pose.
   */
  public minus(other: Pose2d): Transform2d {
    const pose = this.relativeTo(other);
    return new Transform2d(pose.getTranslation(), pose.getRotation());
  }

  /**
   * Returns the translation component of the transformation.
   *
   * @return The translational component of the pose.
   */
  public getTranslation(): Translation2d {
    return this.m_translation;
  }

  /**
   * Returns the X component of the pose's translation.
   *
   * @return The x component of the pose's translation.
   */
  public getX(): number {
    return this.m_translation.getX();
  }

  /**
   * Alias for getX() to maintain compatibility with tests.
   */
  public get x(): number {
    return this.getX();
  }

  /**
   * Returns the Y component of the pose's translation.
   *
   * @return The y component of the pose's translation.
   */
  public getY(): number {
    return this.m_translation.getY();
  }

  /**
   * Alias for getY() to maintain compatibility with tests.
   */
  public get y(): number {
    return this.getY();
  }

  /**
   * Returns the rotational component of the transformation.
   *
   * @return The rotational component of the pose.
   */
  public getRotation(): Rotation2d {
    return this.m_rotation;
  }

  /**
   * Alias for getRotation() to maintain compatibility with tests.
   */
  public get rotation(): Rotation2d {
    return this.getRotation();
  }

  /**
   * Multiplies the current pose by a scalar.
   *
   * @param scalar The scalar.
   * @return The new scaled Pose2d.
   */
  public times(scalar: number): Pose2d {
    return new Pose2d(
      this.m_translation.times(scalar),
      this.m_rotation.times(scalar)
    );
  }

  /**
   * Transforms the pose by the given transformation and returns the new pose.
   *
   * [x_new]    [cos, -sin, 0][transform.x]
   * [y_new] += [sin,  cos, 0][transform.y]
   * [t_new]    [  0,    0, 1][transform.t]
   *
   * @param other The transform to transform the pose by.
   * @return The transformed pose.
   */
  public transformBy(other: Transform2d): Pose2d {
    // We are rotating the transform's translation by our rotation, then adding it to our translation
    const newTranslation = this.m_translation.plus(
      other.getTranslation().rotateBy(this.m_rotation)
    );
    // We are adding the rotations together
    const newRotation = this.m_rotation.plus(other.getRotation());

    return new Pose2d(newTranslation, newRotation);
  }

  /**
   * Returns the current pose relative to the given pose.
   *
   * This function can often be used for trajectory tracking or pose stabilization algorithms to
   * get the error between the reference and the current pose.
   *
   * @param other The pose that is the origin of the new coordinate frame that the current pose
   *     will be converted into.
   * @return The current pose relative to the new origin pose.
   */
  public relativeTo(other: Pose2d): Pose2d {
    const transform = new Transform2d(other, this);
    return new Pose2d(transform.getTranslation(), transform.getRotation());
  }

  /**
   * Obtain a new Pose2d from a (constant curvature) velocity.
   *
   * See <a href="https://file.tavsys.net/control/controls-engineering-in-frc.pdf">Controls
   * Engineering in the FIRST Robotics Competition</a> section 10.2 "Pose exponential" for a
   * derivation.
   *
   * The twist is a change in pose in the robot's coordinate frame since the previous pose
   * update. When the user runs exp() on the previous known field-relative pose with the argument
   * being the twist, the user will receive the new field-relative pose.
   *
   * "Exp" represents the pose exponential, which is solving a differential equation moving the
   * pose forward in time.
   *
   * @param twist The change in pose in the robot's coordinate frame since the previous pose update.
   *     For example, if a non-holonomic robot moves forward 0.01 meters and changes angle by 0.5
   *     degrees since the previous pose update, the twist would be Twist2d(0.01, 0.0, Math.toRadians(0.5)).
   * @return The new pose of the robot.
   */
  public exp(twist: Twist2d): Pose2d {
    const dx = twist.dx;
    const dy = twist.dy;
    const dtheta = twist.dtheta;

    const sinTheta = Math.sin(dtheta);
    const cosTheta = Math.cos(dtheta);

    let s: number;
    let c: number;
    if (Math.abs(dtheta) < 1E-9) {
      s = 1.0 - 1.0 / 6.0 * dtheta * dtheta;
      c = 0.5 * dtheta;
    } else {
      s = sinTheta / dtheta;
      c = (1 - cosTheta) / dtheta;
    }

    // Calculate the translation part of the transform
    const translation = new Translation2d(dx * s - dy * c, dx * c + dy * s);

    // Calculate the rotation part of the transform
    const rotation = new Rotation2d(cosTheta, sinTheta);

    // Create the transform
    const transform = new Transform2d(translation, rotation);

    // Apply the transform to the current pose
    return this.transformBy(transform);
  }

  /**
   * Returns a Twist2d that maps this pose to the end pose. If c is the output
   * of a.log(b), then a.exp(c) would yield b.
   *
   * @param end The end pose for the transformation.
   * @return The twist that maps this to end.
   */
  public log(end: Pose2d): Twist2d {
    // Get the transform from this pose to the end pose
    const transform = new Transform2d(this, end);

    // Get the rotation component of the transform
    const dtheta = transform.getRotation().getRadians();
    const halfDtheta = dtheta / 2.0;

    // Calculate the scaling factor for the translation component
    const cosMinusOne = transform.getRotation().getCos() - 1;

    let halfThetaByTanOfHalfDtheta: number;
    if (Math.abs(cosMinusOne) < 1E-9) {
      // If the rotation is very small, use a Taylor series approximation
      halfThetaByTanOfHalfDtheta = 1.0 - 1.0 / 12.0 * dtheta * dtheta;
    } else {
      // Otherwise, use the exact formula
      halfThetaByTanOfHalfDtheta = -(halfDtheta * transform.getRotation().getSin()) / cosMinusOne;
    }

    // Calculate the translation component of the twist
    const rotationForTranslation = new Rotation2d(halfThetaByTanOfHalfDtheta, -halfDtheta);
    const scaleFactor = Math.hypot(halfThetaByTanOfHalfDtheta, halfDtheta);
    const translationPart = transform.getTranslation().rotateBy(rotationForTranslation).times(scaleFactor);

    // Return the twist that maps this pose to the end pose
    return new Twist2d(translationPart.getX(), translationPart.getY(), dtheta);
  }

  /**
   * Interpolates between this pose and another pose.
   *
   * @param endValue The end value for the interpolation.
   * @param t The interpolation parameter, in [0, 1].
   * @return The interpolated pose.
   */
  public interpolate(endValue: Pose2d, t: number): Pose2d {
    if (t <= 0) {
      return this;
    } else if (t >= 1) {
      return endValue;
    }

    const twist = this.log(endValue);
    const scaledTwist = new Twist2d(
      twist.dx * t,
      twist.dy * t,
      twist.dtheta * t
    );
    return this.exp(scaledTwist);
  }

  /**
   * Returns whether the pose is equal to another pose.
   *
   * @param obj The other pose.
   * @return Whether the two poses are equal.
   */
  public equals(obj: unknown): boolean {
    if (obj instanceof Pose2d) {
      const other = obj;
      return this.m_translation.equals(other.m_translation) &&
             this.m_rotation.equals(other.m_rotation);
    }
    return false;
  }

  /**
   * Returns a string representation of the pose.
   *
   * @return A string representation of the pose.
   */
  public toString(): string {
    return `Pose2d(Translation: ${this.m_translation}, Rotation: ${this.m_rotation})`;
  }
}

/**
 * Represents a transformation for a Pose2d.
 */
export class Transform2d {
  private readonly m_translation: Translation2d;
  private readonly m_rotation: Rotation2d;

  /**
   * Constructs the transform that maps the initial pose to the final pose.
   *
   * @param initial The initial pose for the transformation.
   * @param final The final pose for the transformation.
   */
  constructor(initial: Pose2d, final: Pose2d);

  /**
   * Constructs a transform with the given translation and rotation components.
   *
   * @param translation Translational component of the transform.
   * @param rotation Rotational component of the transform.
   */
  constructor(translation: Translation2d, rotation: Rotation2d);

  constructor(
    initialOrTranslation: Pose2d | Translation2d,
    finalOrRotation: Pose2d | Rotation2d
  ) {
    if (initialOrTranslation instanceof Pose2d && finalOrRotation instanceof Pose2d) {
      // Pose2d, Pose2d constructor
      const initial = initialOrTranslation;
      const final = finalOrRotation;

      // We are rotating the difference between the translations
      // using a clockwise rotation matrix. This transforms the global
      // delta into a local delta (relative to the initial pose).
      const delta = final.getTranslation().minus(initial.getTranslation());
      const angleDelta = initial.getRotation().unaryMinus();
      this.m_translation = delta.rotateBy(angleDelta);

      this.m_rotation = final.getRotation().minus(initial.getRotation());
    } else if (initialOrTranslation instanceof Translation2d && finalOrRotation instanceof Rotation2d) {
      // Translation2d, Rotation2d constructor
      this.m_translation = initialOrTranslation;
      this.m_rotation = finalOrRotation;
    } else {
      throw new Error('Invalid arguments for Transform2d constructor');
    }
  }

  /**
   * Returns the translation component of the transformation.
   *
   * @return The translational component of the transform.
   */
  public getTranslation(): Translation2d {
    return this.m_translation;
  }

  /**
   * Returns the rotational component of the transformation.
   *
   * @return The rotational component of the transform.
   */
  public getRotation(): Rotation2d {
    return this.m_rotation;
  }

  /**
   * Adds two transformations and returns the sum.
   *
   * @param other The transform to add.
   * @return The sum of the transforms.
   */
  public plus(other: Transform2d): Transform2d {
    // Get the pose that results from applying this transform to the origin
    const firstTransform = new Pose2d().transformBy(this);

    // Get the pose that results from applying the second transform to the result of the first transform
    const secondTransform = firstTransform.transformBy(other);

    // Return the transform that maps the origin to the result of applying both transforms
    return new Transform2d(new Pose2d(), secondTransform);
  }

  /**
   * Returns whether the transform is equal to another transform.
   *
   * @param obj The other transform.
   * @return Whether the two transforms are equal.
   */
  public equals(obj: any): boolean {
    if (obj instanceof Transform2d) {
      const other = obj as Transform2d;
      return this.m_translation.equals(other.m_translation) &&
             this.m_rotation.equals(other.m_rotation);
    }
    return false;
  }

  /**
   * Returns a string representation of the transform.
   *
   * @return A string representation of the transform.
   */
  public toString(): string {
    return `Transform2d(Translation: ${this.m_translation}, Rotation: ${this.m_rotation})`;
  }
}
