import { MathSharedStore } from '../MathSharedStore';
import { MathUsageId } from '../MathUsageId';
import { MathUtil } from '../MathUtil';

/**
 * Implements a PID control loop.
 */
export class PIDController {
  private static instances = 0;

  // Factor for "proportional" control
  private m_kp: number;

  // Factor for "integral" control
  private m_ki: number;

  // Factor for "derivative" control
  private m_kd: number;

  // The error range where "integral" control applies
  private m_iZone = Number.POSITIVE_INFINITY;

  // The period (in seconds) of the loop that calls the controller
  private readonly m_period: number;

  private m_maximumIntegral = 1.0;
  private m_minimumIntegral = -1.0;
  private m_maximumInput = 0;
  private m_minimumInput = 0;

  // Do the endpoints wrap around? e.g. Absolute encoder
  private m_continuous = false;

  // The error at the time of the most recent call to calculate()
  private m_error = 0;
  private m_errorDerivative = 0;

  // The error at the time of the second-most-recent call to calculate() (used to compute velocity)
  private m_prevError = 0;

  // The sum of the errors for use in the integral calc
  private m_totalError = 0;

  // The error that is considered at setpoint.
  private m_errorTolerance = 0.05;
  private m_errorDerivativeTolerance = Number.POSITIVE_INFINITY;

  private m_setpoint = 0;
  private m_measurement = 0;

  private m_haveMeasurement = false;
  private m_haveSetpoint = false;

  /**
   * Allocates a PIDController with the given constants for Kp, Ki, and Kd.
   *
   * @param kp The proportional coefficient. Must be >= 0.
   * @param ki The integral coefficient. Must be >= 0.
   * @param kd The derivative coefficient. Must be >= 0.
   * @param period The period between controller updates in seconds. The default is 0.02 seconds.
   */
  constructor(kp: number, ki: number, kd: number, period: number = 0.02) {
    if (kp < 0) {
      throw new Error("Kp must be a non-negative number!");
    }
    if (ki < 0) {
      throw new Error("Ki must be a non-negative number!");
    }
    if (kd < 0) {
      throw new Error("Kd must be a non-negative number!");
    }
    if (period <= 0) {
      throw new Error("Controller period must be a positive number!");
    }

    this.m_kp = kp;
    this.m_ki = ki;
    this.m_kd = kd;
    this.m_period = period;

    PIDController.instances++;
    MathSharedStore.reportUsage(MathUsageId.kController_PIDController2, PIDController.instances);
  }

  /**
   * Sets the PID Controller gain parameters.
   *
   * Sets the proportional, integral, and differential coefficients.
   *
   * @param kp The proportional coefficient. Must be >= 0.
   * @param ki The integral coefficient. Must be >= 0.
   * @param kd The derivative coefficient. Must be >= 0.
   */
  public setPID(kp: number, ki: number, kd: number): void {
    if (kp < 0) {
      throw new Error("Kp must be a non-negative number!");
    }
    if (ki < 0) {
      throw new Error("Ki must be a non-negative number!");
    }
    if (kd < 0) {
      throw new Error("Kd must be a non-negative number!");
    }

    this.m_kp = kp;
    this.m_ki = ki;
    this.m_kd = kd;
  }

  /**
   * Sets the Proportional coefficient of the PID controller gain.
   *
   * @param kp The proportional coefficient. Must be >= 0.
   */
  public setP(kp: number): void {
    if (kp < 0) {
      throw new Error("Kp must be a non-negative number!");
    }
    this.m_kp = kp;
  }

  /**
   * Sets the Integral coefficient of the PID controller gain.
   *
   * @param ki The integral coefficient. Must be >= 0.
   */
  public setI(ki: number): void {
    if (ki < 0) {
      throw new Error("Ki must be a non-negative number!");
    }
    this.m_ki = ki;
  }

  /**
   * Sets the Differential coefficient of the PID controller gain.
   *
   * @param kd The differential coefficient. Must be >= 0.
   */
  public setD(kd: number): void {
    if (kd < 0) {
      throw new Error("Kd must be a non-negative number!");
    }
    this.m_kd = kd;
  }

  /**
   * Get the Proportional coefficient.
   *
   * @return The proportional coefficient.
   */
  public getP(): number {
    return this.m_kp;
  }

  /**
   * Get the Integral coefficient.
   *
   * @return The integral coefficient.
   */
  public getI(): number {
    return this.m_ki;
  }

  /**
   * Get the Differential coefficient.
   *
   * @return The differential coefficient.
   */
  public getD(): number {
    return this.m_kd;
  }

  /**
   * Returns the period of this controller.
   *
   * @return The period of the controller.
   */
  public getPeriod(): number {
    return this.m_period;
  }

  /**
   * Sets the setpoint for the PIDController.
   *
   * @param setpoint The desired setpoint.
   */
  public setSetpoint(setpoint: number): void {
    this.m_setpoint = setpoint;
    this.m_haveSetpoint = true;

    if (this.m_continuous) {
      const errorBound = (this.m_maximumInput - this.m_minimumInput) / 2.0;
      this.m_error = MathUtil.inputModulus(
        this.m_setpoint - this.m_measurement,
        -errorBound,
        errorBound
      );
    } else {
      this.m_error = this.m_setpoint - this.m_measurement;
    }

    this.m_errorDerivative = (this.m_error - this.m_prevError) / this.m_period;
  }

  /**
   * Returns the current setpoint of the PIDController.
   *
   * @return The current setpoint.
   */
  public getSetpoint(): number {
    return this.m_setpoint;
  }

  /**
   * Returns true if the error is within the tolerance of the setpoint.
   *
   * This will return false until at least one input value has been computed.
   *
   * @return Whether the error is within the acceptable bounds.
   */
  public atSetpoint(): boolean {
    return this.m_haveMeasurement &&
           this.m_haveSetpoint &&
           Math.abs(this.m_error) < this.m_errorTolerance &&
           Math.abs(this.m_errorDerivative) < this.m_errorDerivativeTolerance;
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
    this.m_minimumIntegral = minimumIntegral;
    this.m_maximumIntegral = maximumIntegral;
  }

  /**
   * Sets the error which is considered tolerable for use with atSetpoint().
   *
   * @param errorTolerance The error which is tolerable.
   * @param errorDerivativeTolerance The error derivative which is tolerable.
   */
  public setTolerance(
    errorTolerance: number,
    errorDerivativeTolerance: number = Number.POSITIVE_INFINITY
  ): void {
    this.m_errorTolerance = errorTolerance;
    this.m_errorDerivativeTolerance = errorDerivativeTolerance;
  }

  /**
   * Returns the difference between the setpoint and the measurement.
   *
   * @return The error.
   */
  public getPositionError(): number {
    return this.m_error;
  }

  /**
   * Returns the velocity error.
   *
   * @return The error in velocity.
   */
  public getVelocityError(): number {
    return this.m_errorDerivative;
  }

  /**
   * Returns the next output of the PID controller.
   *
   * @param measurement The current measurement of the process variable.
   * @param setpoint The new setpoint of the controller.
   * @return The next controller output.
   */
  public calculate(measurement: number, setpoint: number): number;

  /**
   * Returns the next output of the PID controller.
   *
   * @param measurement The current measurement of the process variable.
   * @return The next controller output.
   */
  public calculate(measurement: number): number;

  public calculate(measurement: number, setpoint?: number): number {
    if (setpoint !== undefined) {
      this.m_setpoint = setpoint;
      this.m_haveSetpoint = true;
    }

    this.m_measurement = measurement;
    this.m_prevError = this.m_error;
    this.m_haveMeasurement = true;

    if (this.m_continuous) {
      const errorBound = (this.m_maximumInput - this.m_minimumInput) / 2.0;
      this.m_error = MathUtil.inputModulus(
        this.m_setpoint - this.m_measurement,
        -errorBound,
        errorBound
      );
    } else {
      this.m_error = this.m_setpoint - this.m_measurement;
    }

    this.m_errorDerivative = (this.m_error - this.m_prevError) / this.m_period;

    // If the absolute value of the position error is greater than IZone, reset the total error
    if (Math.abs(this.m_error) > this.m_iZone) {
      this.m_totalError = 0;
    } else if (this.m_ki !== 0) {
      this.m_totalError = MathUtil.clamp(
        this.m_totalError + this.m_error * this.m_period,
        this.m_minimumIntegral / this.m_ki,
        this.m_maximumIntegral / this.m_ki
      );
    }

    return this.m_kp * this.m_error + this.m_ki * this.m_totalError + this.m_kd * this.m_errorDerivative;
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
    this.m_continuous = true;
    this.m_minimumInput = minimumInput;
    this.m_maximumInput = maximumInput;
  }

  /**
   * Disables continuous input.
   */
  public disableContinuousInput(): void {
    this.m_continuous = false;
  }

  /**
   * Returns whether continuous input is enabled.
   *
   * @return Whether continuous input is enabled.
   */
  public isContinuousInputEnabled(): boolean {
    return this.m_continuous;
  }

  /**
   * Sets the integrator zone.
   *
   * When the absolute value of the position error is greater than the IZone, the total error will
   * be reset.
   *
   * @param iZone Maximum magnitude of error to allow integral control.
   */
  public setIZone(iZone: number): void {
    if (iZone < 0) {
      throw new Error("IZone must be a non-negative number!");
    }
    this.m_iZone = iZone;
  }

  /**
   * Gets the integrator zone.
   *
   * @return Maximum magnitude of error to allow integral control.
   */
  public getIZone(): number {
    return this.m_iZone;
  }

  /**
   * Resets the previous error and the integral term.
   */
  public reset(): void {
    this.m_error = 0;
    this.m_prevError = 0;
    this.m_totalError = 0;
    this.m_errorDerivative = 0;
    this.m_haveMeasurement = false;
  }
}
