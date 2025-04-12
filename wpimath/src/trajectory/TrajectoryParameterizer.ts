import { Pose2d } from '../geometry/Pose2d';
import { PoseWithCurvature } from '../spline/PoseWithCurvature';
import { Trajectory } from './Trajectory';
import { TrajectoryConstraint, MinMax } from './TrajectoryConfig';

/**
 * Exception for trajectory generation errors.
 */
export class TrajectoryGenerationException extends Error {
  /**
   * Create a new exception with the given message.
   *
   * @param message the message to pass with the exception
   */
  constructor(message: string) {
    super(message);
    this.name = 'TrajectoryGenerationException';
  }
}

/**
 * Represents a constrained state that is used when time parameterizing a
 * trajectory. Each state has the pose, curvature, distance from the start of
 * the trajectory, max velocity, min acceleration and max acceleration.
 */
class ConstrainedState {
  public pose: PoseWithCurvature;
  public distanceMeters: number;
  public maxVelocityMetersPerSecond: number;
  public minAccelerationMetersPerSecondSq: number;
  public maxAccelerationMetersPerSecondSq: number;

  /**
   * Constructs a ConstrainedState with the specified parameters.
   *
   * @param pose The pose at the state.
   * @param distanceMeters The distance from the start of the trajectory.
   * @param maxVelocityMetersPerSecond The maximum velocity at the state.
   * @param minAccelerationMetersPerSecondSq The minimum acceleration at the state.
   * @param maxAccelerationMetersPerSecondSq The maximum acceleration at the state.
   */
  constructor(
    pose?: PoseWithCurvature,
    distanceMeters?: number,
    maxVelocityMetersPerSecond?: number,
    minAccelerationMetersPerSecondSq?: number,
    maxAccelerationMetersPerSecondSq?: number
  ) {
    this.pose = pose ?? new PoseWithCurvature(Pose2d.kZero, 0);
    this.distanceMeters = distanceMeters ?? 0;
    this.maxVelocityMetersPerSecond = maxVelocityMetersPerSecond ?? 0;
    this.minAccelerationMetersPerSecondSq = minAccelerationMetersPerSecondSq ?? 0;
    this.maxAccelerationMetersPerSecondSq = maxAccelerationMetersPerSecondSq ?? 0;
  }
}

/**
 * Class used to parameterize a trajectory by time.
 */
export class TrajectoryParameterizer {
  private static readonly kEpsilon = 1E-6;

  /**
   * Parameterize the trajectory by time. This is where the velocity profile is generated.
   *
   * The derivation of the algorithm used can be found here:
   * http://www2.informatik.uni-freiburg.de/~lau/students/Sprunk2008.pdf
   *
   * @param points Reference to the spline points.
   * @param constraints A vector of various velocity and acceleration constraints.
   * @param startVelocityMetersPerSecond The start velocity for the trajectory.
   * @param endVelocityMetersPerSecond The end velocity for the trajectory.
   * @param maxVelocityMetersPerSecond The max velocity for the trajectory.
   * @param maxAccelerationMetersPerSecondSq The max acceleration for the trajectory.
   * @param reversed Whether the robot should move backwards. Note that the robot will still move
   *     from a -> b -> ... -> z as defined in the waypoints.
   * @return The trajectory.
   */
  public static timeParameterizeTrajectory(
    points: PoseWithCurvature[],
    constraints: TrajectoryConstraint[],
    startVelocityMetersPerSecond: number,
    endVelocityMetersPerSecond: number,
    maxVelocityMetersPerSecond: number,
    maxAccelerationMetersPerSecondSq: number,
    reversed: boolean
  ): Trajectory {
    const constrainedStates: ConstrainedState[] = new Array(points.length);
    
    // The first state has no predecessor, so we set it based on the provided initial velocity
    let predecessor = new ConstrainedState(
      points[0],
      0,
      startVelocityMetersPerSecond,
      -maxAccelerationMetersPerSecondSq,
      maxAccelerationMetersPerSecondSq
    );

    // Forward pass
    for (let i = 0; i < points.length; i++) {
      constrainedStates[i] = new ConstrainedState();
      const constrainedState = constrainedStates[i];
      constrainedState.pose = points[i];

      // Begin constraining based on predecessor
      const ds = constrainedState.pose.poseMeters.getTranslation()
        .getDistance(predecessor.pose.poseMeters.getTranslation());
      constrainedState.distanceMeters = predecessor.distanceMeters + ds;

      // We may need to iterate to find the maximum end velocity and common
      // acceleration, since acceleration limits may be a function of velocity
      while (true) {
        // Enforce global max velocity and max reachable velocity by global
        // acceleration limit. v_f = √(v_i² + 2ad)
        constrainedState.maxVelocityMetersPerSecond = Math.min(
          maxVelocityMetersPerSecond,
          Math.sqrt(
            predecessor.maxVelocityMetersPerSecond * predecessor.maxVelocityMetersPerSecond
            + predecessor.maxAccelerationMetersPerSecondSq * ds * 2.0
          )
        );

        constrainedState.minAccelerationMetersPerSecondSq = -maxAccelerationMetersPerSecondSq;
        constrainedState.maxAccelerationMetersPerSecondSq = maxAccelerationMetersPerSecondSq;

        // At this point, the constrained state is fully constructed apart from
        // all the custom-defined user constraints
        for (const constraint of constraints) {
          constrainedState.maxVelocityMetersPerSecond = Math.min(
            constrainedState.maxVelocityMetersPerSecond,
            constraint.getMaxVelocityMetersPerSecond(
              constrainedState.pose.poseMeters,
              constrainedState.pose.curvatureRadPerMeter,
              constrainedState.maxVelocityMetersPerSecond
            )
          );
        }

        // Now enforce all acceleration limits
        TrajectoryParameterizer.enforceAccelerationLimits(reversed, constraints, constrainedState);

        if (ds < TrajectoryParameterizer.kEpsilon) {
          break;
        }

        // If the actual acceleration for this state is higher than the max
        // acceleration that we applied, then we need to reduce the max
        // acceleration of the predecessor and try again
        const actualAcceleration = (
          constrainedState.maxVelocityMetersPerSecond * constrainedState.maxVelocityMetersPerSecond
          - predecessor.maxVelocityMetersPerSecond * predecessor.maxVelocityMetersPerSecond
        ) / (ds * 2.0);

        // If we violate the max acceleration constraint, let's modify the
        // predecessor
        if (constrainedState.maxAccelerationMetersPerSecondSq < actualAcceleration - TrajectoryParameterizer.kEpsilon) {
          predecessor.maxAccelerationMetersPerSecondSq = constrainedState.maxAccelerationMetersPerSecondSq;
        } else {
          // If the actual acceleration is less than the predecessor's min
          // acceleration, it will be repaired in the backward pass
          predecessor.maxAccelerationMetersPerSecondSq = actualAcceleration;
          break;
        }
      }
      predecessor = constrainedState;
    }

    // Backward pass
    let successor = new ConstrainedState(
      points[points.length - 1],
      constrainedStates[constrainedStates.length - 1].distanceMeters,
      endVelocityMetersPerSecond,
      -maxAccelerationMetersPerSecondSq,
      maxAccelerationMetersPerSecondSq
    );

    for (let i = points.length - 1; i >= 0; i--) {
      const constrainedState = constrainedStates[i];
      const ds = constrainedState.distanceMeters - successor.distanceMeters; // negative

      while (true) {
        // Enforce max velocity limit (reverse)
        // v_f = √(v_i² + 2ad), where v_i = successor
        const newMaxVelocity = Math.sqrt(
          successor.maxVelocityMetersPerSecond * successor.maxVelocityMetersPerSecond
          + successor.minAccelerationMetersPerSecondSq * ds * 2.0
        );

        // No more limits to impose! This state can be finalized
        if (newMaxVelocity >= constrainedState.maxVelocityMetersPerSecond) {
          break;
        }

        constrainedState.maxVelocityMetersPerSecond = newMaxVelocity;

        // Check all acceleration constraints with the new max velocity
        TrajectoryParameterizer.enforceAccelerationLimits(reversed, constraints, constrainedState);

        if (ds > -TrajectoryParameterizer.kEpsilon) {
          break;
        }

        // If the actual acceleration for this state is lower than the min
        // acceleration, then we need to increase the min acceleration of the
        // successor and try again
        const actualAcceleration = (
          constrainedState.maxVelocityMetersPerSecond * constrainedState.maxVelocityMetersPerSecond
          - successor.maxVelocityMetersPerSecond * successor.maxVelocityMetersPerSecond
        ) / (ds * 2.0);

        if (constrainedState.minAccelerationMetersPerSecondSq > actualAcceleration + TrajectoryParameterizer.kEpsilon) {
          successor.minAccelerationMetersPerSecondSq = constrainedState.minAccelerationMetersPerSecondSq;
        } else {
          successor.minAccelerationMetersPerSecondSq = actualAcceleration;
          break;
        }
      }
      successor = constrainedState;
    }

    // Now we can integrate the constrained states forward in time to obtain our
    // trajectory states
    const states: Trajectory.State[] = [];
    let timeSeconds = 0.0;
    let distanceMeters = 0.0;
    let velocityMetersPerSecond = 0.0;

    for (let i = 0; i < constrainedStates.length; i++) {
      const state = constrainedStates[i];

      // Calculate the change in position between the current state and the previous
      // state
      const ds = state.distanceMeters - distanceMeters;

      // Calculate the acceleration between the current state and the previous
      // state
      let accel = (
        state.maxVelocityMetersPerSecond * state.maxVelocityMetersPerSecond
        - velocityMetersPerSecond * velocityMetersPerSecond
      ) / (ds * 2);

      // Calculate dt
      let dt = 0.0;
      if (i > 0) {
        states[i - 1].accelerationMetersPerSecondSq = reversed ? -accel : accel;
        if (Math.abs(accel) > TrajectoryParameterizer.kEpsilon) {
          // v_f = v_0 + a * t
          dt = (state.maxVelocityMetersPerSecond - velocityMetersPerSecond) / accel;
        } else if (Math.abs(velocityMetersPerSecond) > TrajectoryParameterizer.kEpsilon) {
          // delta_x = v * t
          dt = ds / velocityMetersPerSecond;
        } else {
          throw new TrajectoryGenerationException(
            `Something went wrong at iteration ${i} of time parameterization.`
          );
        }
      }

      velocityMetersPerSecond = state.maxVelocityMetersPerSecond;
      distanceMeters = state.distanceMeters;

      timeSeconds += dt;

      states.push(
        new Trajectory.State(
          timeSeconds,
          reversed ? -velocityMetersPerSecond : velocityMetersPerSecond,
          reversed ? -accel : accel,
          state.pose.poseMeters,
          state.pose.curvatureRadPerMeter
        )
      );
    }

    return new Trajectory(states);
  }

  /**
   * Enforces acceleration limits as defined by the constraints. This function
   * is used when time parameterizing a trajectory.
   *
   * @param reverse Whether the robot is traveling backwards.
   * @param constraints A vector of the user-defined velocity and acceleration
   * constraints.
   * @param state The constrained state that we are operating on. This is mutated in place.
   */
  private static enforceAccelerationLimits(
    reverse: boolean,
    constraints: TrajectoryConstraint[],
    state: ConstrainedState
  ): void {
    for (const constraint of constraints) {
      const factor = reverse ? -1.0 : 1.0;
      const minMaxAccel = constraint.getMinMaxAccelerationMetersPerSecondSq(
        state.pose.poseMeters,
        state.pose.curvatureRadPerMeter,
        state.maxVelocityMetersPerSecond * factor
      );

      if (minMaxAccel.minAccelerationMetersPerSecondSq > minMaxAccel.maxAccelerationMetersPerSecondSq) {
        throw new TrajectoryGenerationException(
          `Infeasible trajectory constraint: ${constraint.constructor.name}`
        );
      }

      state.minAccelerationMetersPerSecondSq = Math.max(
        state.minAccelerationMetersPerSecondSq,
        reverse ? -minMaxAccel.maxAccelerationMetersPerSecondSq : minMaxAccel.minAccelerationMetersPerSecondSq
      );

      state.maxAccelerationMetersPerSecondSq = Math.min(
        state.maxAccelerationMetersPerSecondSq,
        reverse ? -minMaxAccel.minAccelerationMetersPerSecondSq : minMaxAccel.maxAccelerationMetersPerSecondSq
      );
    }
  }
}
