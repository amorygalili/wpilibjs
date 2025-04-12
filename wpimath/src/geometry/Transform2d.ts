import { Pose2d } from './Pose2d';
import { Rotation2d } from './Rotation2d';
import { Translation2d } from './Translation2d';

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

  /**
   * Constructs a transform with x and y translations instead of a separate Translation2d.
   *
   * @param x The x component of the translational component of the transform.
   * @param y The y component of the translational component of the transform.
   * @param rotation The rotational component of the transform.
   */
  constructor(x: number, y: number, rotation: Rotation2d);

  constructor(
    initialOrTranslationOrX: Pose2d | Translation2d | number,
    finalOrRotationOrY: Pose2d | Rotation2d | number,
    rotation?: Rotation2d
  ) {
    if (initialOrTranslationOrX instanceof Pose2d && finalOrRotationOrY instanceof Pose2d) {
      // Transform from initial pose to final pose
      const initial = initialOrTranslationOrX;
      const final = finalOrRotationOrY;

      // We are rotating the difference between the translations
      // using a clockwise rotation matrix. This transforms the global
      // delta into a local delta (relative to the initial pose).
      this.m_translation = final
        .getTranslation()
        .minus(initial.getTranslation())
        .rotateBy(initial.getRotation().unaryMinus());

      this.m_rotation = final.getRotation().minus(initial.getRotation());
    } else if (initialOrTranslationOrX instanceof Translation2d && finalOrRotationOrY instanceof Rotation2d) {
      // Transform from translation and rotation
      this.m_translation = initialOrTranslationOrX;
      this.m_rotation = finalOrRotationOrY;
    } else if (
      typeof initialOrTranslationOrX === 'number' &&
      typeof finalOrRotationOrY === 'number' &&
      rotation instanceof Rotation2d
    ) {
      // Transform from x, y, and rotation
      this.m_translation = new Translation2d(initialOrTranslationOrX, finalOrRotationOrY);
      this.m_rotation = rotation;
    } else {
      // Default constructor - identity transform
      this.m_translation = Translation2d.kZero;
      this.m_rotation = Rotation2d.kZero;
    }
  }

  /**
   * Returns the translation component of the transformation.
   *
   * @return Reference to the translational component of the transform.
   */
  public getTranslation(): Translation2d {
    return this.m_translation;
  }

  /**
   * Returns the rotational component of the transformation.
   *
   * @return Reference to the rotational component of the transform.
   */
  public getRotation(): Rotation2d {
    return this.m_rotation;
  }

  /**
   * Invert the transformation. This is useful for undoing a transformation.
   *
   * @return The inverted transformation.
   */
  public inverse(): Transform2d {
    // We are rotating the difference between the translations
    // using a clockwise rotation matrix. This transforms the global
    // delta into a local delta (relative to the initial pose).
    return new Transform2d(
      this.getTranslation().unaryMinus().rotateBy(this.getRotation().unaryMinus()),
      this.getRotation().unaryMinus()
    );
  }

  /**
   * Composes two transformations.
   *
   * @param other The transform to compose with this one.
   * @return The composition of the two transformations.
   */
  public plus(other: Transform2d): Transform2d {
    // We are rotating the transformation's translation by our rotation, then adding it to our translation
    return new Transform2d(
      this.m_translation.plus(other.m_translation.rotateBy(this.m_rotation)),
      this.m_rotation.plus(other.m_rotation)
    );
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
