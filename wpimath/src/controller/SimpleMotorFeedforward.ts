/**
 * A simple feedforward controller for a motor.
 *
 * The feedforward is calculated as:
 * u = kS * sgn(v) + kV * v + kA * a
 *
 * Where u is the control effort, v is the velocity, and a is the acceleration.
 */
export class SimpleMotorFeedforward {
  private readonly m_kS: number;
  private readonly m_kV: number;
  private readonly m_kA: number;

  /**
   * Creates a new SimpleMotorFeedforward with the specified gains.
   *
   * @param kS The static gain, in volts.
   * @param kV The velocity gain, in volt seconds per meter.
   * @param kA The acceleration gain, in volt seconds^2 per meter.
   */
  constructor(kS: number, kV: number, kA = 0) {
    this.m_kS = kS;
    this.m_kV = kV;
    this.m_kA = kA;
  }

  /**
   * Calculates the feedforward for the given velocity and acceleration.
   *
   * @param velocity The velocity, in meters per second.
   * @param acceleration The acceleration, in meters per second squared.
   * @return The feedforward, in volts.
   */
  public calculate(velocity: number, acceleration = 0): number {
    return this.m_kS * Math.sign(velocity) + this.m_kV * velocity + this.m_kA * acceleration;
  }

  /**
   * Calculates the maximum achievable velocity given a maximum voltage supply
   * and an acceleration. Useful for ensuring that velocity and acceleration
   * constraints for a trapezoidal profile are simultaneously achievable.
   *
   * @param maxVoltage The maximum voltage that can be supplied to the motor.
   * @param acceleration The acceleration of the motor.
   * @return The maximum achievable velocity in meters per second.
   */
  public getMaxVelocity(maxVoltage: number, acceleration = 0): number {
    // Solve for maximum velocity:
    // maxVoltage = kS + kV * v + kA * a
    // v = (maxVoltage - kS - kA * a) / kV
    return (maxVoltage - this.m_kS - this.m_kA * acceleration) / this.m_kV;
  }

  /**
   * Calculates the maximum achievable acceleration given a maximum voltage
   * supply and a velocity. Useful for ensuring that velocity and acceleration
   * constraints for a trapezoidal profile are simultaneously achievable.
   *
   * @param velocity The velocity of the motor.
   * @param maxVoltage The maximum voltage that can be supplied to the motor.
   * @return The maximum achievable acceleration in meters per second squared.
   */
  public getMaxAcceleration(velocity: number, maxVoltage: number): number {
    // Solve for maximum acceleration:
    // maxVoltage = kS * sgn(v) + kV * v + kA * a
    // a = (maxVoltage - kS * sgn(v) - kV * v) / kA
    return (maxVoltage - this.m_kS * Math.sign(velocity) - this.m_kV * velocity) / this.m_kA;
  }
}
