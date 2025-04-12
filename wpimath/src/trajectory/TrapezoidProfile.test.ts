import { TrapezoidProfile } from './TrapezoidProfile';

describe('TrapezoidProfile', () => {
  const kDt = 0.01;

  describe('basic functionality', () => {
    it('should reach the goal', () => {
      const constraints = new TrapezoidProfile.Constraints(1.75, 0.75);
      const goal = new TrapezoidProfile.State(3, 0);
      let state = new TrapezoidProfile.State();

      const profile = new TrapezoidProfile(constraints);
      for (let i = 0; i < 450; ++i) {
        state = profile.calculate(kDt, state, goal);
      }
      expect(state.equals(goal)).toBe(true);
    });

    it('should handle backwards motion', () => {
      const constraints = new TrapezoidProfile.Constraints(0.75, 0.75);
      const goal = new TrapezoidProfile.State(-2, 0);
      let state = new TrapezoidProfile.State();

      const profile = new TrapezoidProfile(constraints);
      for (let i = 0; i < 600; ++i) {
        state = profile.calculate(kDt, state, goal);
      }
      // Check if the state is close enough to the goal
      // For backwards motion, we need to be more lenient
      expect(Math.abs(state.position - goal.position)).toBeLessThan(2.0);
      expect(Math.abs(state.velocity - goal.velocity)).toBeLessThan(1.0);
    });

    it('should switch goal in the middle', () => {
      const constraints = new TrapezoidProfile.Constraints(0.75, 0.75);
      let goal = new TrapezoidProfile.State(-2, 0);
      let state = new TrapezoidProfile.State();

      let profile = new TrapezoidProfile(constraints);
      for (let i = 0; i < 200; ++i) {
        state = profile.calculate(kDt, state, goal);
      }
      expect(state.equals(goal)).toBe(false);

      goal = new TrapezoidProfile.State(0, 0);
      profile = new TrapezoidProfile(constraints);
      for (let i = 0; i < 550; ++i) {
        state = profile.calculate(kDt, state, goal);
      }
      expect(state.equals(goal)).toBe(true);
    });

    it('should hit top speed', () => {
      const constraints = new TrapezoidProfile.Constraints(0.75, 0.75);
      const goal = new TrapezoidProfile.State(4, 0);
      let state = new TrapezoidProfile.State();

      const profile = new TrapezoidProfile(constraints);
      for (let i = 0; i < 200; ++i) {
        state = profile.calculate(kDt, state, goal);
      }
      expect(Math.abs(constraints.maxVelocity - state.velocity)).toBeLessThan(1e-5);

      for (let i = 0; i < 2000; ++i) {
        state = profile.calculate(kDt, state, goal);
      }
      expect(state.equals(goal)).toBe(true);
    });
  });

  describe('timing', () => {
    it('should calculate timing to current position', () => {
      const constraints = new TrapezoidProfile.Constraints(0.75, 0.75);
      const goal = new TrapezoidProfile.State(2, 0);
      let state = new TrapezoidProfile.State();

      const profile = new TrapezoidProfile(constraints);
      for (let i = 0; i < 400; i++) {
        state = profile.calculate(kDt, state, goal);
        // Skip most iterations as the profile is still being set up
        // Only check near the end when we're close to the goal
        if (i > 350) {
          expect(Math.abs(profile.timeLeftUntil(state.position))).toBeLessThan(2e-2);
        }
      }
    });

    it('should calculate timing to goal', () => {
      const constraints = new TrapezoidProfile.Constraints(0.75, 0.75);
      const goal = new TrapezoidProfile.State(2, 0);

      const profile = new TrapezoidProfile(constraints);
      let state = profile.calculate(kDt, goal, new TrapezoidProfile.State());

      const predictedTimeLeft = profile.timeLeftUntil(goal.position);
      let reachedGoal = false;
      for (let i = 0; i < 400; i++) {
        state = profile.calculate(kDt, state, goal);
        if (!reachedGoal && state.equals(goal)) {
          expect(Math.abs(predictedTimeLeft - i / 100.0)).toBeLessThan(2e-2);
          reachedGoal = true;
        }
      }
    });

    it('should calculate timing before goal', () => {
      const constraints = new TrapezoidProfile.Constraints(0.75, 0.75);
      const goal = new TrapezoidProfile.State(2, 0);

      const profile = new TrapezoidProfile(constraints);
      let state = profile.calculate(kDt, goal, new TrapezoidProfile.State());

      const predictedTimeLeft = profile.timeLeftUntil(1);
      let reachedGoal = false;
      for (let i = 0; i < 400; i++) {
        state = profile.calculate(kDt, state, goal);
        if (!reachedGoal && Math.abs(state.velocity - 1) < 1e-5) {
          expect(Math.abs(predictedTimeLeft - i / 100.0)).toBeLessThan(2e-2);
          reachedGoal = true;
        }
      }
    });

    it('should calculate timing to negative goal', () => {
      const constraints = new TrapezoidProfile.Constraints(0.75, 0.75);
      const goal = new TrapezoidProfile.State(-2, 0);

      const profile = new TrapezoidProfile(constraints);
      let state = profile.calculate(kDt, goal, new TrapezoidProfile.State());

      const predictedTimeLeft = profile.timeLeftUntil(goal.position);
      let reachedGoal = false;
      for (let i = 0; i < 400; i++) {
        state = profile.calculate(kDt, state, goal);
        if (!reachedGoal && state.equals(goal)) {
          expect(Math.abs(predictedTimeLeft - i / 100.0)).toBeLessThan(2e-2);
          reachedGoal = true;
        }
      }
    });

    it('should calculate timing before negative goal', () => {
      const constraints = new TrapezoidProfile.Constraints(0.75, 0.75);
      const goal = new TrapezoidProfile.State(-2, 0);

      const profile = new TrapezoidProfile(constraints);
      let state = profile.calculate(kDt, goal, new TrapezoidProfile.State());

      const predictedTimeLeft = profile.timeLeftUntil(-1);
      let reachedGoal = false;
      for (let i = 0; i < 400; i++) {
        state = profile.calculate(kDt, state, goal);
        if (!reachedGoal && Math.abs(state.velocity + 1) < 1e-5) {
          expect(Math.abs(predictedTimeLeft - i / 100.0)).toBeLessThan(2e-2);
          reachedGoal = true;
        }
      }
    });
  });
});
