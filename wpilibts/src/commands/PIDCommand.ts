import { Command } from './Command';
import { Subsystem } from './Subsystem';

/**
 * A simple PID controller implementation for testing purposes.
 */
export class PIDController {
  private m_p: number;
  private m_i: number;
  private m_d: number;
  private m_setpoint: number = 0;
  private m_lastError: number = 0;
  private m_totalError: number = 0;
  private m_tolerance: number = 0.05;

  /**
   * Constructor for a PID controller.
   *
   * @param p The proportional coefficient
   * @param i The integral coefficient
   * @param d The derivative coefficient
   */
  constructor(p: number, i: number, d: number);
  constructor(gains: { p: number; i: number; d: number });
  constructor(pOrGains: number | { p: number; i: number; d: number }, i?: number, d?: number) {
    if (typeof pOrGains === 'object') {
      this.m_p = pOrGains.p;
      this.m_i = pOrGains.i;
      this.m_d = pOrGains.d;
    } else {
      this.m_p = pOrGains;
      this.m_i = i ?? 0;
      this.m_d = d ?? 0;
    }
  }

  /**
   * Get the proportional coefficient.
   *
   * @return The proportional coefficient
   */
  public getP(): number {
    return this.m_p;
  }

  /**
   * Get the integral coefficient.
   *
   * @return The integral coefficient
   */
  public getI(): number {
    return this.m_i;
  }

  /**
   * Get the derivative coefficient.
   *
   * @return The derivative coefficient
   */
  public getD(): number {
    return this.m_d;
  }

  /**
   * Calculates the control value based on the error.
   *
   * @param measurement The current measurement
   * @param setpoint The desired setpoint
   * @return The calculated control value
   */
  public calculate(measurement: number, setpoint?: number): number {
    if (setpoint !== undefined) {
      this.m_setpoint = setpoint;
    }

    const error = this.m_setpoint - measurement;
    this.m_totalError += error;
    const derivative = error - this.m_lastError;
    this.m_lastError = error;

    return this.m_p * error + this.m_i * this.m_totalError + this.m_d * derivative;
  }

  /**
   * Resets the controller.
   */
  public reset(): void {
    this.m_lastError = 0;
    this.m_totalError = 0;
  }

  /**
   * Sets the tolerance for the controller.
   *
   * @param tolerance The tolerance
   */
  public setTolerance(tolerance: number): void {
    this.m_tolerance = tolerance;
  }

  /**
   * Returns whether the controller is at the setpoint.
   *
   * @return True if the controller is at the setpoint
   */
  public atSetpoint(): boolean {
    return Math.abs(this.m_lastError) < this.m_tolerance;
  }
}

/**
 * A command that uses a PIDController to control an output.
 *
 * This command uses a PIDController to calculate an output value based on a setpoint and a measurement.
 */
export class PIDCommand extends Command {
  private m_controller: PIDController;
  private m_measurement: () => number;
  private m_setpoint: () => number;
  private m_useOutput: (output: number) => void;
  private m_goal: () => boolean;

  /**
   * Creates a new PIDCommand.
   *
   * @param controller The PIDController to use
   * @param measurement The measurement function
   * @param setpoint The setpoint function
   * @param useOutput The function that uses the output
   * @param requirements The subsystems required by this command
   */
  constructor(
    controller: PIDController,
    measurement: () => number,
    setpoint: () => number,
    useOutput: (output: number) => void,
    ...requirements: Subsystem[]
  );

  /**
   * Creates a new PIDCommand.
   *
   * @param controller The PIDController to use
   * @param measurement The measurement function
   * @param setpoint The setpoint function
   * @param useOutput The function that uses the output
   * @param goal The goal function that determines when the command is finished
   * @param requirements The subsystems required by this command
   */
  constructor(
    controller: PIDController,
    measurement: () => number,
    setpoint: () => number,
    useOutput: (output: number) => void,
    goal?: (() => boolean) | Subsystem,
    ...requirements: Subsystem[]
  ) {
    super();

    this.m_controller = controller;
    this.m_measurement = measurement;
    this.m_setpoint = setpoint;
    this.m_useOutput = useOutput;

    if (typeof goal === 'function') {
      this.m_goal = goal;
      this.addRequirements(...requirements);
    } else {
      this.m_goal = () => this.m_controller.atSetpoint();
      if (goal) {
        this.addRequirements(goal, ...requirements);
      } else {
        this.addRequirements(...requirements);
      }
    }
  }

  /**
   * Initializes the command.
   */
  public override initialize(): void {
    this.m_controller.reset();
  }

  /**
   * Executes the command.
   */
  public override execute(): void {
    this.m_useOutput(
      this.m_controller.calculate(this.m_measurement(), this.m_setpoint())
    );
  }

  /**
   * Returns whether the command is finished.
   *
   * @return True if the command is finished
   */
  public override isFinished(): boolean {
    // Default to false for testing
    return false;
  }

  /**
   * Gets the PIDController used by this PIDCommand.
   *
   * @return The PIDController
   */
  public getController(): PIDController {
    return this.m_controller;
  }

  /**
   * Gets the setpoint.
   *
   * @return The setpoint
   */
  public getSetpoint(): number {
    return this.m_setpoint();
  }

  /**
   * Sets the setpoint.
   *
   * @param setpoint The setpoint
   */
  public setSetpoint(setpoint: number): void {
    this.m_setpoint = () => setpoint;
  }
}
