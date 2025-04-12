import { PIDController } from './PIDController';

describe('PIDController', () => {
  const kEpsilon = 1E-9;

  describe('constructors', () => {
    it('should create a PID controller with the given constants', () => {
      const controller = new PIDController(1.0, 2.0, 3.0);
      expect(controller.getP()).toBeCloseTo(1.0, 9);
      expect(controller.getI()).toBeCloseTo(2.0, 9);
      expect(controller.getD()).toBeCloseTo(3.0, 9);
      expect(controller.getPeriod()).toBeCloseTo(0.02, 9);
    });

    it('should create a PID controller with the given constants and period', () => {
      const controller = new PIDController(1.0, 2.0, 3.0, 0.05);
      expect(controller.getP()).toBeCloseTo(1.0, 9);
      expect(controller.getI()).toBeCloseTo(2.0, 9);
      expect(controller.getD()).toBeCloseTo(3.0, 9);
      expect(controller.getPeriod()).toBeCloseTo(0.05, 9);
    });

    it('should throw an error for negative constants', () => {
      expect(() => new PIDController(-1.0, 2.0, 3.0)).toThrow();
      expect(() => new PIDController(1.0, -2.0, 3.0)).toThrow();
      expect(() => new PIDController(1.0, 2.0, -3.0)).toThrow();
      expect(() => new PIDController(1.0, 2.0, 3.0, -0.05)).toThrow();
    });
  });

  describe('setters and getters', () => {
    it('should set and get PID constants', () => {
      const controller = new PIDController(1.0, 2.0, 3.0);
      
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

    it('should throw an error for negative constants in setters', () => {
      const controller = new PIDController(1.0, 2.0, 3.0);
      
      expect(() => controller.setPID(-1.0, 2.0, 3.0)).toThrow();
      expect(() => controller.setPID(1.0, -2.0, 3.0)).toThrow();
      expect(() => controller.setPID(1.0, 2.0, -3.0)).toThrow();
      
      expect(() => controller.setP(-1.0)).toThrow();
      expect(() => controller.setI(-2.0)).toThrow();
      expect(() => controller.setD(-3.0)).toThrow();
    });

    it('should set and get setpoint', () => {
      const controller = new PIDController(1.0, 2.0, 3.0);
      
      controller.setSetpoint(5.0);
      expect(controller.getSetpoint()).toBeCloseTo(5.0, 9);
    });

    it('should set and get tolerance', () => {
      const controller = new PIDController(1.0, 2.0, 3.0);
      
      // Default tolerance
      expect(controller.atSetpoint()).toBe(false);
      
      // Set position tolerance only
      controller.setTolerance(0.1);
      controller.calculate(4.95, 5.0);
      expect(controller.atSetpoint()).toBe(true);
      
      // Set position and velocity tolerance
      controller.setTolerance(0.1, 0.2);
      controller.calculate(4.95, 5.0);
      expect(controller.atSetpoint()).toBe(true);
    });

    it('should set and get integrator range', () => {
      const controller = new PIDController(1.0, 2.0, 3.0);
      
      controller.setIntegratorRange(-10.0, 10.0);
      
      // Test that the integrator is clamped
      controller.calculate(0.0, 5.0);
      for (let i = 0; i < 100; i++) {
        controller.calculate(0.0);
      }
      
      // The output should be bounded
      const output = controller.calculate(0.0);
      expect(output).toBeLessThan(100.0);
    });

    it('should set and get IZone', () => {
      const controller = new PIDController(1.0, 2.0, 3.0);
      
      controller.setIZone(5.0);
      expect(controller.getIZone()).toBeCloseTo(5.0, 9);
      
      expect(() => controller.setIZone(-1.0)).toThrow();
    });
  });

  describe('continuous input', () => {
    it('should handle continuous input correctly', () => {
      const controller = new PIDController(1.0, 0.0, 0.0);
      
      controller.enableContinuousInput(-180, 180);
      expect(controller.isContinuousInputEnabled()).toBe(true);
      
      // Test that error wraps around
      const output1 = controller.calculate(-179, 179);
      expect(output1).toBeCloseTo(-2.0, 9);
      
      controller.disableContinuousInput();
      expect(controller.isContinuousInputEnabled()).toBe(false);
      
      // Test that error doesn't wrap around
      const output2 = controller.calculate(-179, 179);
      expect(output2).toBeCloseTo(358.0, 9);
    });
  });

  describe('calculate', () => {
    it('should calculate proportional control correctly', () => {
      const controller = new PIDController(1.0, 0.0, 0.0);
      
      const output = controller.calculate(2.0, 1.0);
      expect(output).toBeCloseTo(-1.0, 9);
    });

    it('should calculate integral control correctly', () => {
      const controller = new PIDController(0.0, 1.0, 0.0, 0.1);
      
      controller.calculate(0.0, 1.0);
      const output = controller.calculate(0.0, 1.0);
      expect(output).toBeCloseTo(0.2, 9);
    });

    it('should calculate derivative control correctly', () => {
      const controller = new PIDController(0.0, 0.0, 1.0, 0.1);
      
      controller.calculate(0.0, 1.0);
      controller.calculate(0.5, 1.0);
      expect(controller.getVelocityError()).toBeCloseTo(-5.0, 9);
    });

    it('should reset the controller correctly', () => {
      const controller = new PIDController(1.0, 1.0, 1.0);
      
      controller.calculate(0.0, 1.0);
      controller.reset();
      
      expect(controller.getPositionError()).toBeCloseTo(0.0, 9);
      expect(controller.getVelocityError()).toBeCloseTo(0.0, 9);
    });
  });
});
