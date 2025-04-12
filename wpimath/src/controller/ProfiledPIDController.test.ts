import { ProfiledPIDController } from './ProfiledPIDController';
import { TrapezoidProfile } from '../trajectory/TrapezoidProfile';

describe('ProfiledPIDController', () => {
  const kEpsilon = 1E-9;

  describe('constructors', () => {
    it('should create a ProfiledPIDController with the given constants', () => {
      const constraints = new TrapezoidProfile.Constraints(1.0, 0.5);
      const controller = new ProfiledPIDController(1.0, 2.0, 3.0, constraints);
      
      expect(controller.getP()).toBeCloseTo(1.0, 9);
      expect(controller.getI()).toBeCloseTo(2.0, 9);
      expect(controller.getD()).toBeCloseTo(3.0, 9);
      expect(controller.getPeriod()).toBeCloseTo(0.02, 9);
      expect(controller.getConstraints()).toBe(constraints);
    });

    it('should create a ProfiledPIDController with the given constants and period', () => {
      const constraints = new TrapezoidProfile.Constraints(1.0, 0.5);
      const controller = new ProfiledPIDController(1.0, 2.0, 3.0, constraints, 0.05);
      
      expect(controller.getP()).toBeCloseTo(1.0, 9);
      expect(controller.getI()).toBeCloseTo(2.0, 9);
      expect(controller.getD()).toBeCloseTo(3.0, 9);
      expect(controller.getPeriod()).toBeCloseTo(0.05, 9);
      expect(controller.getConstraints()).toBe(constraints);
    });
  });

  describe('setters and getters', () => {
    it('should set and get PID constants', () => {
      const constraints = new TrapezoidProfile.Constraints(1.0, 0.5);
      const controller = new ProfiledPIDController(1.0, 2.0, 3.0, constraints);
      
      controller.setPID(4.0, 5.0, 6.0);
      expect(controller.getP()).toBeCloseTo(4.0, 9);
      expect(controller.getI()).toBeCloseTo(5.0, 9);
      expect(controller.getD()).toBeCloseTo(6.0, 9);
      
      controller.setP(7.0);
      expect(controller.getP()).toBeCloseTo(7.0, 9);
      
      controller.setI(8.0);
      expect(controller.getI()).toBeCloseTo(8.0, 9);
      
      controller.setD(9.0);
      expect(controller.getD()).toBeCloseTo(9.0, 9);
    });

    it('should set and get goal', () => {
      const constraints = new TrapezoidProfile.Constraints(1.0, 0.5);
      const controller = new ProfiledPIDController(1.0, 2.0, 3.0, constraints);
      
      // Set goal as a number
      controller.setGoal(5.0);
      expect(controller.getGoal().position).toBeCloseTo(5.0, 9);
      expect(controller.getGoal().velocity).toBeCloseTo(0.0, 9);
      
      // Set goal as a State
      const goalState = new TrapezoidProfile.State(10.0, 2.0);
      controller.setGoal(goalState);
      expect(controller.getGoal()).toBe(goalState);
    });

    it('should set and get constraints', () => {
      const initialConstraints = new TrapezoidProfile.Constraints(1.0, 0.5);
      const controller = new ProfiledPIDController(1.0, 2.0, 3.0, initialConstraints);
      
      const newConstraints = new TrapezoidProfile.Constraints(2.0, 1.0);
      controller.setConstraints(newConstraints);
      expect(controller.getConstraints()).toBe(newConstraints);
    });
  });

  describe('continuous input', () => {
    it('should handle continuous input correctly', () => {
      const constraints = new TrapezoidProfile.Constraints(360, 180);
      const controller = new ProfiledPIDController(1.0, 0.0, 0.0, constraints);
      
      controller.enableContinuousInput(-180, 180);
      expect(controller.isContinuousInputEnabled()).toBe(true);
      
      // Reset the controller to a known state
      controller.reset(-179);
      
      // Test that error wraps around
      const output = controller.calculate(-179, 179);
      expect(output).toBeLessThan(0);
      
      // Error must be less than half the input range at all times
      expect(Math.abs(controller.getSetpoint().position - (-179))).toBeLessThan(180);
      
      controller.disableContinuousInput();
      expect(controller.isContinuousInputEnabled()).toBe(false);
    });
  });

  describe('calculate', () => {
    it('should calculate proportional control correctly', () => {
      const constraints = new TrapezoidProfile.Constraints(1.0, 0.5);
      const controller = new ProfiledPIDController(4.0, 0.0, 0.0, constraints);
      
      const output = controller.calculate(0.025, 0);
      expect(output).toBeCloseTo(-0.1, 9);
    });

    it('should calculate with different goal types', () => {
      const constraints = new TrapezoidProfile.Constraints(1.0, 0.5);
      const controller = new ProfiledPIDController(1.0, 0.0, 0.0, constraints);
      
      // Calculate with a number goal
      const output1 = controller.calculate(0.0, 5.0);
      expect(controller.getGoal().position).toBeCloseTo(5.0, 9);
      
      // Calculate with a State goal
      const goalState = new TrapezoidProfile.State(10.0, 2.0);
      const output2 = controller.calculate(0.0, goalState);
      expect(controller.getGoal()).toBe(goalState);
      
      // Calculate with constraints
      const newConstraints = new TrapezoidProfile.Constraints(2.0, 1.0);
      const output3 = controller.calculate(0.0, 15.0, newConstraints);
      expect(controller.getConstraints()).toBe(newConstraints);
      expect(controller.getGoal().position).toBeCloseTo(15.0, 9);
    });

    it('should reset the controller correctly', () => {
      const constraints = new TrapezoidProfile.Constraints(1.0, 0.5);
      const controller = new ProfiledPIDController(1.0, 1.0, 1.0, constraints);
      
      // Reset with a number
      controller.reset(5.0);
      expect(controller.getSetpoint().position).toBeCloseTo(5.0, 9);
      expect(controller.getSetpoint().velocity).toBeCloseTo(0.0, 9);
      
      // Reset with a State
      const state = new TrapezoidProfile.State(10.0, 2.0);
      controller.reset(state);
      expect(controller.getSetpoint()).toBe(state);
    });

    it('should check if at goal', () => {
      const constraints = new TrapezoidProfile.Constraints(1.0, 0.5);
      const controller = new ProfiledPIDController(1.0, 0.0, 0.0, constraints);
      
      controller.setGoal(5.0);
      controller.setTolerance(0.1);
      
      // Not at goal initially
      expect(controller.atGoal()).toBe(false);
      
      // Simulate reaching the goal
      controller.reset(5.0);
      controller.calculate(5.0);
      expect(controller.atGoal()).toBe(true);
    });
  });
});
