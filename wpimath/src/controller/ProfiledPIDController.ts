import { MathSharedStore } from '../MathSharedStore';
import { MathUsageId } from '../MathUsageId';
import { MathUtil } from '../MathUtil';
import { TrapezoidProfile } from '../trajectory/TrapezoidProfile';
import { PIDController } from './PIDController';

/**
 * Implements a PID control loop whose setpoint is constrained by a trapezoid profile.
 * Users should call reset() when they first start running the controller to avoid
 * unwanted behavior.
 */
export class ProfiledPIDController {
  private static instances = 0;

  private m_controller: PIDController;
  private m_minimumInput = 0;
  private m_maximumInput = 0;

  private m_constraints: TrapezoidProfile.Constraints;
  private m_profile: TrapezoidProfile;
  private m_goal = new TrapezoidProfile.State();
  private m_setpoint = new TrapezoidProfile.State();

  /**
   * Allocates a ProfiledPIDController with the given constants for Kp, Ki, and Kd.
   *
   * @param kp The proportional coefficient.
   * @param ki The integral coefficient.
   * @param kd The derivative coefficient.
   * @param constraints Velocity and acceleration constraints for goal.
   * @param period The period between controller updates in seconds. The default is 0.02 seconds.
   */
  constructor(
    kp: number,
    ki: number,
    kd: number,
    constraints: TrapezoidProfile.Constraints,
    period: number = 0.02
  ) {
    this.m_controller = new PIDController(kp, ki, kd, period);
    this.m_constraints = constraints;
    this.m_profile = new TrapezoidProfile(constraints);

    ProfiledPIDController.instances++;
    MathSharedStore.reportUsage(MathUsageId.kController_ProfiledPIDController, ProfiledPIDController.instances);
  }

  /**
   * Sets the PID Controller gain parameters.
   *
   * Sets the proportional, integral, and differential coefficients.
   *
   * @param kp Proportional coefficient
   * @param ki Integral coefficient
   * @param kd Differential coefficient
   */
  public setPID(kp: number, ki: number, kd: number): void {
    this.m_controller.setPID(kp, ki, kd);
  }

  /**
   * Sets the proportional coefficient of the PID controller gain.
   *
   * @param kp proportional coefficient
   */
  public setP(kp: number): void {
    this.m_controller.setP(kp);
  }

  /**
   * Sets the integral coefficient of the PID controller gain.
   *
   * @param ki integral coefficient
   */
  public setI(ki: number): void {
    this.m_controller.setI(ki);
  }

  /**
   * Sets the differential coefficient of the PID controller gain.
   *
   * @param kd differential coefficient
   */
  public setD(kd: number): void {
    this.m_controller.setD(kd);
  }

  /**
   * Gets the proportional coefficient.
   *
   * @return proportional coefficient
   */
  public getP(): number {
    return this.m_controller.getP();
  }

  /**
   * Gets the integral coefficient.
   *
   * @return integral coefficient
   */
  public getI(): number {
    return this.m_controller.getI();
  }

  /**
   * Gets the differential coefficient.
   *
   * @return differential coefficient
   */
  public getD(): number {
    return this.m_controller.getD();
  }

  /**
   * Gets the period of this controller.
   *
   * @return The period of the controller.
   */
  public getPeriod(): number {
    return this.m_controller.getPeriod();
  }

  /**
   * Sets the goal for the ProfiledPIDController.
   *
   * @param goal The desired goal state.
   */
  public setGoal(goal: TrapezoidProfile.State | number): void {
    if (typeof goal === 'number') {
      this.m_goal = new TrapezoidProfile.State(goal, 0);
    } else {
      this.m_goal = goal;
    }
  }

  /**
   * Gets the goal for the ProfiledPIDController.
   *
   * @return The goal.
   */
  public getGoal(): TrapezoidProfile.State {
    return this.m_goal;
  }

  /**
   * Returns true if the error is within the tolerance of the error.
   *
   * This will return false until at least one input value has been computed.
   *
   * @return Whether the error is within the acceptable bounds.
   */
  public atGoal(): boolean {
    return this.atSetpoint() && this.m_goal.equals(this.m_setpoint);
  }

  /**
   * Set velocity and acceleration constraints for goal.
   *
   * @param constraints Velocity and acceleration constraints for goal.
   */
  public setConstraints(constraints: TrapezoidProfile.Constraints): void {
    this.m_constraints = constraints;
    this.m_profile = new TrapezoidProfile(constraints);
  }

  /**
   * Get the current constraints.
   *
   * @return The current constraints.
   */
  public getConstraints(): TrapezoidProfile.Constraints {
    return this.m_constraints;
  }

  /**
   * Returns the current setpoint of the ProfiledPIDController.
   *
   * @return The current setpoint.
   */
  public getSetpoint(): TrapezoidProfile.State {
    return this.m_setpoint;
  }

  /**
   * Returns true if the error is within the tolerance of the error.
   *
   * Currently this just reports on target as the actual value passes through the setpoint.
   * Ideally it should be based on being within a tolerance for some period of time.
   *
   * This will return false until at least one input value has been computed.
   *
   * @return Whether the controller is at the setpoint.
   */
  public atSetpoint(): boolean {
    return this.m_controller.atSetpoint();
  }

  /**
   * Enables continuous input.
   *
   * Rather than using the max and min input range as constraints, it considers them to be the
   * same point and automatically calculates the shortest route to the setpoint.
   *
   * @param minimumInput The minimum value expected from the input.
   * @param maximumInput The maximum value expected from the input.
   */
  public enableContinuousInput(minimumInput: number, maximumInput: number): void {
    this.m_controller.enableContinuousInput(minimumInput, maximumInput);
    this.m_minimumInput = minimumInput;
    this.m_maximumInput = maximumInput;
  }

  /**
   * Disables continuous input.
   */
  public disableContinuousInput(): void {
    this.m_controller.disableContinuousInput();
  }

  /**
   * Returns whether continuous input is enabled.
   *
   * @return Whether continuous input is enabled.
   */
  public isContinuousInputEnabled(): boolean {
    return this.m_controller.isContinuousInputEnabled();
  }

  /**
   * Sets the minimum and maximum values for the integrator.
   *
   * When the cap is reached, the integrator value is added to the controller output rather
   * than the integrator value times the integral gain.
   *
   * @param minimumIntegral The minimum value of the integrator.
   * @param maximumIntegral The maximum value of the integrator.
   */
  public setIntegratorRange(minimumIntegral: number, maximumIntegral: number): void {
    this.m_controller.setIntegratorRange(minimumIntegral, maximumIntegral);
  }

  /**
   * Sets the error which is considered tolerable for use with atSetpoint().
   *
   * @param positionTolerance Position error which is tolerable.
   * @param velocityTolerance Velocity error which is tolerable.
   */
  public setTolerance(positionTolerance: number, velocityTolerance: number = Number.POSITIVE_INFINITY): void {
    this.m_controller.setTolerance(positionTolerance, velocityTolerance);
  }

  /**
   * Returns the difference between the setpoint and the measurement.
   *
   * @return The error.
   */
  public getPositionError(): number {
    return this.m_controller.getPositionError();
  }

  /**
   * Returns the change in error per second.
   *
   * @return The change in error per second.
   */
  public getVelocityError(): number {
    return this.m_controller.getVelocityError();
  }

  /**
   * Returns the next output of the PID controller.
   *
   * @param measurement The current measurement of the process variable.
   * @return The controller's next output.
   */
  public calculate(measurement: number): number;

  /**
   * Returns the next output of the PID controller.
   *
   * @param measurement The current measurement of the process variable.
   * @param goal The new goal of the controller.
   * @return The controller's next output.
   */
  public calculate(measurement: number, goal: TrapezoidProfile.State): number;

  /**
   * Returns the next output of the PIDController.
   *
   * @param measurement The current measurement of the process variable.
   * @param goal The new goal of the controller.
   * @return The controller's next output.
   */
  public calculate(measurement: number, goal: number): number;

  /**
   * Returns the next output of the PID controller.
   *
   * @param measurement The current measurement of the process variable.
   * @param goal The new goal of the controller.
   * @param constraints Velocity and acceleration constraints for goal.
   * @return The controller's next output.
   */
  public calculate(
    measurement: number,
    goal: TrapezoidProfile.State | number,
    constraints?: TrapezoidProfile.Constraints
  ): number;

  public calculate(
    measurement: number,
    goal?: TrapezoidProfile.State | number,
    constraints?: TrapezoidProfile.Constraints
  ): number {
    if (goal !== undefined) {
      if (typeof goal === 'number') {
        this.setGoal(goal);
      } else {
        this.setGoal(goal);
      }
    }

    if (constraints !== undefined) {
      this.setConstraints(constraints);
    }

    if (this.m_controller.isContinuousInputEnabled()) {
      // Get error which is the smallest distance between goal and measurement
      const errorBound = (this.m_maximumInput - this.m_minimumInput) / 2.0;
      const goalMinDistance =
        MathUtil.inputModulus(this.m_goal.position - measurement, -errorBound, errorBound);
      const setpointMinDistance =
        MathUtil.inputModulus(this.m_setpoint.position - measurement, -errorBound, errorBound);

      // Recompute the profile goal with the smallest error, thus giving the shortest path.
      // The goal may be outside the input range after this operation, but that's OK because
      // the controller will still go there and report an error of zero. In other words,
      // the setpoint only needs to be offset from the measurement by the input range modulus;
      // they don't need to be equal.
      this.m_goal.position = goalMinDistance + measurement;
      this.m_setpoint.position = setpointMinDistance + measurement;
    }

    this.m_setpoint = this.m_profile.calculate(this.getPeriod(), this.m_setpoint, this.m_goal);
    return this.m_controller.calculate(measurement, this.m_setpoint.position);
  }

  /**
   * Resets the controller.
   *
   * This resets the position and velocity errors, as well as the integral term.
   *
   * @param measurement The current measured State of the system.
   */
  public reset(measurement: TrapezoidProfile.State | number): void {
    this.m_controller.reset();
    
    if (typeof measurement === 'number') {
      this.m_setpoint = new TrapezoidProfile.State(measurement, 0);
    } else {
      this.m_setpoint = measurement;
    }
  }
}
