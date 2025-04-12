/**
 * WPIMath usage reporting IDs.
 */
export enum MathUsageId {
  /** DifferentialDriveKinematics. */
  kKinematics_DifferentialDrive,

  /** MecanumDriveKinematics. */
  kKinematics_MecanumDrive,

  /** SwerveDriveKinematics. */
  kKinematics_SwerveDrive,

  /** TrapezoidProfile. */
  kTrajectory_TrapezoidProfile,

  /** LinearFilter. */
  kFilter_Linear,

  /** MedianFilter. */
  kFilter_Median,

  /** DifferentialDriveOdometry. */
  kOdometry_DifferentialDrive,

  /** SwerveDriveOdometry. */
  kOdometry_SwerveDrive,

  /** MecanumDriveOdometry. */
  kOdometry_MecanumDrive,

  /** PIDController. */
  kController_PIDController2,

  /** ProfiledPIDController. */
  kController_ProfiledPIDController,

  /** BangBangController. */
  kController_BangBangController,

  /** PathWeaver Trajectory. */
  kTrajectory_PathWeaver,
}
