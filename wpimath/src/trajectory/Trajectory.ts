import { Pose2d, Transform2d } from '../geometry/Pose2d';
import { Rotation2d } from '../geometry/Rotation2d';
import { MathUtil } from '../MathUtil';

/**
 * Represents a time-parameterized trajectory. The trajectory contains of
 * various States that represent the pose, curvature, time elapsed, velocity,
 * and acceleration at that point.
 */
export class Trajectory {
  private m_states: Trajectory.State[] = [];
  private m_totalTimeSeconds = 0;

  /**
   * Constructs an empty trajectory.
   */
  constructor();

  /**
   * Constructs a trajectory from a vector of states.
   *
   * @param states A vector of states.
   */
  constructor(states: Trajectory.State[]);

  constructor(states?: Trajectory.State[]) {
    if (states) {
      this.m_states = states;
      this.m_totalTimeSeconds = states[states.length - 1].timeSeconds;
    }
  }

  /**
   * Linearly interpolates between two values.
   *
   * @param startValue The start value.
   * @param endValue The end value.
   * @param t The fraction for interpolation.
   * @return The interpolated value.
   */
  private static lerp(startValue: number, endValue: number, t: number): number {
    return startValue + (endValue - startValue) * t;
  }

  /**
   * Returns the initial pose of the trajectory.
   *
   * @return The initial pose of the trajectory.
   */
  public getInitialPose(): Pose2d {
    if (this.m_states.length === 0) {
      return new Pose2d();
    }
    return this.m_states[0].poseMeters;
  }

  /**
   * Returns the states of the trajectory.
   *
   * @return The states of the trajectory.
   */
  public getStates(): Trajectory.State[] {
    return this.m_states;
  }

  /**
   * Returns the total time of the trajectory.
   *
   * @return The total time of the trajectory in seconds.
   */
  public getTotalTimeSeconds(): number {
    return this.m_totalTimeSeconds;
  }

  /**
   * Returns the total time of the trajectory.
   * Alias for getTotalTimeSeconds().
   *
   * @return The total time of the trajectory in seconds.
   */
  public totalTime(): number {
    return this.m_totalTimeSeconds;
  }

  /**
   * Sample the trajectory at a point in time.
   *
   * @param timeSeconds The point in time since the beginning of the trajectory to sample.
   * @return The state at that point in time.
   */
  public sample(timeSeconds: number): Trajectory.State {
    if (timeSeconds <= 0) {
      return this.m_states[0];
    }
    if (timeSeconds >= this.m_totalTimeSeconds) {
      return this.m_states[this.m_states.length - 1];
    }

    // To get the element that we want, we need to do a binary search since the
    // time in the vector isn't uniformly distributed.
    let low = 0;
    let high = this.m_states.length - 1;

    while (low !== high) {
      const mid = Math.floor((low + high) / 2);
      if (this.m_states[mid].timeSeconds < timeSeconds) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    if (low === 0) {
      return this.m_states[low];
    }

    const prevLow = low - 1;

    const i1 = prevLow;
    const i2 = low;

    const t1 = this.m_states[i1].timeSeconds;
    const t2 = this.m_states[i2].timeSeconds;

    const t = MathUtil.clamp(timeSeconds, t1, t2);

    const scale = (t - t1) / (t2 - t1);

    const p1 = this.m_states[i1].poseMeters;
    const p2 = this.m_states[i2].poseMeters;

    const p = p1.interpolate(p2, scale);

    return new Trajectory.State(
      t,
      Trajectory.lerp(this.m_states[i1].velocityMetersPerSecond, this.m_states[i2].velocityMetersPerSecond, scale),
      Trajectory.lerp(this.m_states[i1].accelerationMetersPerSecondSq, this.m_states[i2].accelerationMetersPerSecondSq, scale),
      p,
      Trajectory.lerp(this.m_states[i1].curvatureRadPerMeter, this.m_states[i2].curvatureRadPerMeter, scale)
    );
  }

  /**
   * Transforms all poses in the trajectory by the given transform. This is
   * useful for converting a robot-relative trajectory into a field-relative
   * trajectory or vice versa.
   *
   * @param transform The transform to transform the trajectory by.
   * @return The transformed trajectory.
   */
  public transformBy(transform: Transform2d): Trajectory {
    const newStates: Trajectory.State[] = [];

    for (const state of this.m_states) {
      newStates.push(
        new Trajectory.State(
          state.timeSeconds,
          state.velocityMetersPerSecond,
          state.accelerationMetersPerSecondSq,
          state.poseMeters.transformBy(transform),
          state.curvatureRadPerMeter
        )
      );
    }

    return new Trajectory(newStates);
  }

  /**
   * Transforms all poses in the trajectory so that they are relative to the
   * given pose. This is useful for converting a field-relative trajectory
   * into a robot-relative trajectory.
   *
   * @param pose The pose that is the origin of the coordinate frame that
   *             the current trajectory will be transformed into.
   * @return The transformed trajectory.
   */
  public relativeTo(pose: Pose2d): Trajectory {
    const newStates: Trajectory.State[] = [];

    for (const state of this.m_states) {
      newStates.push(
        new Trajectory.State(
          state.timeSeconds,
          state.velocityMetersPerSecond,
          state.accelerationMetersPerSecondSq,
          state.poseMeters.relativeTo(pose),
          state.curvatureRadPerMeter
        )
      );
    }

    return new Trajectory(newStates);
  }

  /**
   * Concatenates another trajectory to the current trajectory. The user is
   * responsible for making sure that the end pose of this trajectory and the
   * start pose of the other trajectory match (if that is the desired behavior).
   *
   * @param other The trajectory to concatenate.
   * @return The concatenated trajectory.
   */
  public concatenate(other: Trajectory): Trajectory {
    if (this.m_states.length === 0) {
      return other;
    }
    if (other.getStates().length === 0) {
      return this;
    }

    const newStates = [...this.m_states];
    const timeOffset = this.m_states[this.m_states.length - 1].timeSeconds;

    for (const state of other.getStates()) {
      newStates.push(
        new Trajectory.State(
          state.timeSeconds + timeOffset,
          state.velocityMetersPerSecond,
          state.accelerationMetersPerSecondSq,
          state.poseMeters,
          state.curvatureRadPerMeter
        )
      );
    }

    return new Trajectory(newStates);
  }
}

export namespace Trajectory {
  /**
   * Represents a state in a trajectory.
   */
  export class State {
    /**
     * Constructs a State with the specified parameters.
     *
     * @param timeSeconds The time elapsed since the beginning of the trajectory.
     * @param velocityMetersPerSecond The speed at that point of the trajectory.
     * @param accelerationMetersPerSecondSq The acceleration at that point of the trajectory.
     * @param poseMeters The pose at that point of the trajectory.
     * @param curvatureRadPerMeter The curvature at that point of the trajectory.
     */
    constructor(
      public timeSeconds: number,
      public velocityMetersPerSecond: number,
      public accelerationMetersPerSecondSq: number,
      public poseMeters: Pose2d,
      public curvatureRadPerMeter: number
    ) {}

    /**
     * Alias for poseMeters to maintain compatibility with tests.
     */
    public get pose(): Pose2d {
      return this.poseMeters;
    }

    /**
     * Interpolates between two States.
     *
     * @param endValue The end value for the interpolation.
     * @param i The interpolant (fraction).
     * @return The interpolated state.
     */
    public interpolate(endValue: State, i: number): State {
      // Find the new t value.
      const newT = MathUtil.interpolate(this.timeSeconds, endValue.timeSeconds, i);

      // Find the delta time between the current state and the interpolated state.
      const deltaT = newT - this.timeSeconds;

      // If delta time is negative, flip the order of interpolation.
      if (deltaT < 0) {
        return endValue.interpolate(this, 1.0 - i);
      }

      // Check whether the robot is reversing at this stage.
      const reversing =
        this.velocityMetersPerSecond < 0 ||
        (this.velocityMetersPerSecond === 0 && this.accelerationMetersPerSecondSq < 0);

      // Calculate the new velocity
      // v_f = v_0 + a * t
      const newV = this.velocityMetersPerSecond + this.accelerationMetersPerSecondSq * deltaT;

      // Calculate the change in position.
      // delta_s = v_0 * t + 0.5 * a * t^2
      let newS =
        this.velocityMetersPerSecond * deltaT +
        0.5 * this.accelerationMetersPerSecondSq * deltaT * deltaT;

      // Return the new state. To find the new position for the new state, we need
      // to interpolate between the two endpoint poses. The fraction for
      // interpolation is the change in position (delta s) divided by the total
      // distance between the two endpoints.
      const interpolationFrac = newS / endValue.poseMeters.getTranslation().getDistance(this.poseMeters.getTranslation());

      if (interpolationFrac > 1.0) {
        return endValue;
      }

      if (interpolationFrac < 0) {
        return this;
      }

      return new State(
        newT,
        newV,
        this.accelerationMetersPerSecondSq,
        this.poseMeters.interpolate(endValue.poseMeters, interpolationFrac),
        MathUtil.interpolate(this.curvatureRadPerMeter, endValue.curvatureRadPerMeter, interpolationFrac)
      );
    }
  }
}
