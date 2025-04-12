/**
 * A trapezoid-shaped velocity profile.
 *
 * While this class can be used for a profiled movement from start to finish,
 * the intended usage is to filter a reference's dynamics based on trapezoidal
 * velocity constraints. To compute the reference obeying this constraint, do
 * the following.
 *
 * Initialization:
 * ```typescript
 * const constraints = new TrapezoidProfile.Constraints(kMaxV, kMaxA);
 * let previousProfiledReference = new TrapezoidProfile.State(initialReference, 0.0);
 * const profile = new TrapezoidProfile(constraints);
 * ```
 *
 * Run on update:
 * ```typescript
 * previousProfiledReference = profile.calculate(
 *   timeSincePreviousUpdate,
 *   previousProfiledReference,
 *   unprofiledReference
 * );
 * ```
 *
 * where `unprofiledReference` is free to change between calls. Note that when the unprofiled
 * reference is within the constraints, `calculate()` returns the unprofiled reference unchanged.
 *
 * Otherwise, a timer can be started to provide monotonic values for `calculate()` and to
 * determine when the profile has completed via `isFinished()`.
 */
export class TrapezoidProfile {
  // The direction of the profile, either 1 for forwards or -1 for inverted
  private m_direction = 1;

  private readonly m_constraints: TrapezoidProfile.Constraints;
  private m_current: TrapezoidProfile.State = new TrapezoidProfile.State();

  private m_endAccel = 0;
  private m_endFullSpeed = 0;
  private m_endDecel = 0;

  /**
   * Constructs a TrapezoidProfile.
   *
   * @param constraints The velocity and acceleration constraints for the profile.
   */
  constructor(constraints: TrapezoidProfile.Constraints) {
    this.m_constraints = constraints;
  }

  /**
   * Calculates the position and velocity for the profile at a time t where the current state is at
   * time t = 0.
   *
   * @param t How long to advance from the current state toward the desired state.
   * @param current The current state.
   * @param goal The desired state when the profile is complete.
   * @return The position and velocity of the profile at time t.
   */
  public calculate(
    t: number,
    current: TrapezoidProfile.State,
    goal: TrapezoidProfile.State
  ): TrapezoidProfile.State {
    this.m_direction = TrapezoidProfile.shouldFlipAcceleration(current, goal) ? -1 : 1;
    this.m_current = TrapezoidProfile.direct(current, this.m_direction);
    goal = TrapezoidProfile.direct(goal, this.m_direction);

    if (this.m_current.velocity > this.m_constraints.maxVelocity) {
      this.m_current.velocity = this.m_constraints.maxVelocity;
    }

    // Deal with a possibly truncated motion profile (with nonzero initial or
    // final velocity) by calculating the parameters as if the profile began and
    // ended at zero velocity
    let cutoffBegin = 0;
    let cutoffDistBegin = 0;

    if (this.m_current.velocity > 0) {
      cutoffBegin = this.m_current.velocity / this.m_constraints.maxAcceleration;
      cutoffDistBegin =
        cutoffBegin * this.m_current.velocity / 2.0;
    }

    let cutoffEnd = 0;
    let cutoffDistEnd = 0;

    if (goal.velocity > 0) {
      cutoffEnd = goal.velocity / this.m_constraints.maxAcceleration;
      cutoffDistEnd = cutoffEnd * goal.velocity / 2.0;
    }

    // Now we can calculate the parameters as if it was a full trapezoid instead
    // of a truncated one
    const fullTrapezoidDist =
      cutoffDistBegin + (goal.position - this.m_current.position) + cutoffDistEnd;
    const accelerationTime =
      this.m_constraints.maxVelocity / this.m_constraints.maxAcceleration;

    let fullSpeedDist =
      fullTrapezoidDist -
      accelerationTime * accelerationTime * this.m_constraints.maxAcceleration;

    // Handle the case where the profile never reaches full speed
    if (fullSpeedDist < 0) {
      const accelerationTime = Math.sqrt(fullTrapezoidDist / this.m_constraints.maxAcceleration);
      this.m_endAccel = accelerationTime - cutoffBegin;
      this.m_endFullSpeed = this.m_endAccel;
      this.m_endDecel = this.m_endAccel + cutoffEnd;
    } else {
      fullSpeedDist = fullSpeedDist / this.m_constraints.maxVelocity;
      this.m_endAccel = accelerationTime - cutoffBegin;
      this.m_endFullSpeed = this.m_endAccel + fullSpeedDist;
      this.m_endDecel = this.m_endFullSpeed + accelerationTime - cutoffEnd;
    }

    if (t < 0) {
      return this.m_current;
    } else if (t < this.m_endAccel) {
      return this.accelerate(t);
    } else if (t < this.m_endFullSpeed) {
      return this.cruise(t);
    } else if (t <= this.m_endDecel) {
      return this.decelerate(t);
    } else {
      // If we're past the end of the profile, return the goal state
      // Make a copy to avoid modifying the original goal
      return new TrapezoidProfile.State(goal.position, goal.velocity);
    }
  }

  private accelerate(t: number): TrapezoidProfile.State {
    const result = new TrapezoidProfile.State(this.m_current.position, this.m_current.velocity);
    result.velocity += t * this.m_constraints.maxAcceleration;
    result.position +=
      (this.m_current.velocity + t * this.m_constraints.maxAcceleration / 2.0) * t;
    return TrapezoidProfile.direct(result, this.m_direction);
  }

  private cruise(t: number): TrapezoidProfile.State {
    const result = new TrapezoidProfile.State(this.m_current.position, this.m_current.velocity);
    result.velocity = this.m_constraints.maxVelocity;
    result.position +=
      (this.m_current.velocity +
        this.m_endAccel * this.m_constraints.maxAcceleration / 2.0) *
        this.m_endAccel +
      this.m_constraints.maxVelocity * (t - this.m_endAccel);
    return TrapezoidProfile.direct(result, this.m_direction);
  }

  private decelerate(t: number): TrapezoidProfile.State {
    const result = new TrapezoidProfile.State();
    const timeLeft = this.m_endDecel - t;

    result.velocity = timeLeft * this.m_constraints.maxAcceleration;
    result.position =
      this.m_current.position +
      (this.m_current.velocity +
        this.m_endAccel * this.m_constraints.maxAcceleration / 2.0) *
        this.m_endAccel +
      this.m_constraints.maxVelocity * (this.m_endFullSpeed - this.m_endAccel) +
      (this.m_constraints.maxVelocity + result.velocity / 2.0) *
        (t - this.m_endFullSpeed);

    // If we're very close to the goal, just return it to avoid floating point errors
    if (Math.abs(timeLeft) < 1e-6) {
      return TrapezoidProfile.direct(new TrapezoidProfile.State(0, 0), this.m_direction);
    }

    return TrapezoidProfile.direct(result, this.m_direction);
  }

  /**
   * Returns the time left until a target distance in the profile is reached.
   *
   * @param target The target distance.
   * @return The time left until a target distance in the profile is reached.
   */
  public timeLeftUntil(target: number): number {
    const position = this.m_current.position * this.m_direction;
    target *= this.m_direction;

    if (target < position || Math.abs(target - position) < 1e-6) {
      return 0;
    }

    const endAccel = this.m_endAccel * this.m_direction;
    const endFullSpeed = this.m_endFullSpeed * this.m_direction;

    if (target <= this.accelerate(endAccel).position * this.m_direction) {
      const velocitySquared =
        this.m_current.velocity * this.m_current.velocity +
        2 * this.m_constraints.maxAcceleration * (target - position);
      const velocity = Math.sqrt(Math.abs(velocitySquared));
      return (velocity - this.m_current.velocity) / this.m_constraints.maxAcceleration;
    } else if (target <= this.cruise(endFullSpeed).position * this.m_direction) {
      const positionDelta = target - this.accelerate(endAccel).position * this.m_direction;
      const timeFromEndAccel = positionDelta / this.m_constraints.maxVelocity;
      return endAccel + timeFromEndAccel;
    } else if (target <= this.decelerate(this.m_endDecel).position * this.m_direction) {
      const positionDelta = target - this.cruise(endFullSpeed).position * this.m_direction;
      const velocitySquared =
        this.m_constraints.maxVelocity * this.m_constraints.maxVelocity -
        2 * this.m_constraints.maxAcceleration * positionDelta;
      const velocity = Math.sqrt(Math.abs(velocitySquared));
      const timeFromEndFullSpeed =
        (this.m_constraints.maxVelocity - velocity) / this.m_constraints.maxAcceleration;
      return endFullSpeed + timeFromEndFullSpeed;
    } else {
      return this.m_endDecel;
    }
  }

  /**
   * Returns the total time the profile takes to reach the goal.
   *
   * @return The total time the profile takes to reach the goal.
   */
  public totalTime(): number {
    return this.m_endDecel;
  }

  /**
   * Returns true if the profile has reached the goal.
   *
   * The profile has reached the goal if the time since the profile started has
   * exceeded the profile's total time.
   *
   * @param t The time since the beginning of the profile.
   * @return True if the profile has reached the goal.
   */
  public isFinished(t: number): boolean {
    return t >= this.totalTime();
  }

  /**
   * Returns true if the profile inverted.
   *
   * The profile is inverted if goal position is less than the initial position.
   *
   * @param initial The initial state (usually the current state).
   * @param goal The desired state when the profile is complete.
   */
  private static shouldFlipAcceleration(
    initial: TrapezoidProfile.State,
    goal: TrapezoidProfile.State
  ): boolean {
    return initial.position > goal.position;
  }

  /**
   * Flip the sign of the velocity and position if the profile is inverted.
   *
   * @param state The state to flip.
   * @param direction The direction to flip the state (1 or -1).
   * @return The flipped state.
   */
  private static direct(
    state: TrapezoidProfile.State,
    direction: number
  ): TrapezoidProfile.State {
    const result = new TrapezoidProfile.State(state.position, state.velocity);
    result.position *= direction;
    result.velocity *= direction;
    return result;
  }
}

export namespace TrapezoidProfile {
  /**
   * The constraints on the trapezoid profile, such as maximum velocity and
   * acceleration.
   */
  export class Constraints {
    /**
     * Constructs constraints for a trapezoid profile.
     *
     * @param maxVelocity The maximum velocity.
     * @param maxAcceleration The maximum acceleration.
     */
    constructor(
      public readonly maxVelocity: number,
      public readonly maxAcceleration: number
    ) {}
  }

  /**
   * The state of the trapezoid profile, including the position and velocity.
   */
  export class State {
    /**
     * Constructs a State.
     *
     * @param position The position at this state.
     * @param velocity The velocity at this state.
     */
    constructor(
      public position: number = 0,
      public velocity: number = 0
    ) {}

    /**
     * Checks equality between this State and another State.
     *
     * @param other The other state.
     * @return Whether the two states are equal.
     */
    public equals(other: State): boolean {
      return (
        Math.abs(this.position - other.position) < 1e-6 &&
        Math.abs(this.velocity - other.velocity) < 1e-6
      );
    }
  }
}
