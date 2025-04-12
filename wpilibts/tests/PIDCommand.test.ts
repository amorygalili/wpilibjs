import { PIDCommand, PIDController } from '../src/commands/PIDCommand';
import { Subsystem } from '../src/commands/Subsystem';

// Mock the CommandScheduler
jest.mock('../src/commands/CommandScheduler', () => {
  return {
    CommandScheduler: {
      getInstance: jest.fn().mockReturnValue({
        registerSubsystem: jest.fn(),
        isScheduled: jest.fn().mockReturnValue(false),
      }),
    },
  };
});

class TestSubsystem extends Subsystem {}

describe('PIDCommand', () => {
  let subsystem: TestSubsystem;

  beforeEach(() => {
    subsystem = new TestSubsystem();
  });

  test('should call the provided functions', () => {
    const measurementSource = jest.fn().mockReturnValue(5);
    const setpoint = 10;
    const useOutput = jest.fn();

    // Create a PIDController with the gains
    const controller = new PIDController({ p: 1, i: 0, d: 0 });

    const command = new PIDCommand(
      controller,
      measurementSource,
      () => setpoint,
      useOutput,
      subsystem
    );

    command.initialize();
    command.execute();

    expect(measurementSource).toHaveBeenCalled();
    expect(useOutput).toHaveBeenCalled();
  });

  test('should add requirements', () => {
    // Create a PIDController with the gains
    const controller = new PIDController({ p: 1, i: 0, d: 0 });

    const command = new PIDCommand(
      controller,
      () => 0,
      () => 0,
      () => {},
      subsystem
    );

    expect(command.getRequirements().has(subsystem)).toBe(true);
  });

  test('should not be finished by default', () => {
    // Create a PIDController with the gains
    const controller = new PIDController({ p: 1, i: 0, d: 0 });

    const command = new PIDCommand(
      controller,
      () => 0,
      () => 0,
      () => {},
      subsystem
    );

    expect(command.isFinished()).toBe(false);
  });

  test('should end gracefully', () => {
    const useOutput = jest.fn();

    // Create a PIDController with the gains
    const controller = new PIDController({ p: 1, i: 0, d: 0 });

    const command = new PIDCommand(
      controller,
      () => 0,
      () => 0,
      useOutput,
      subsystem
    );

    // This should not throw
    command.end(false);
    command.end(true);
  });

  test('should provide access to the controller', () => {
    // Create a PIDController with the gains
    const controller = new PIDController({ p: 2, i: 0.5, d: 0.1 });

    const command = new PIDCommand(
      controller,
      () => 0,
      () => 0,
      () => {},
      subsystem
    );

    expect(command.getController()).toBe(controller);
    expect(command.getController().getP()).toBe(2);
    expect(command.getController().getI()).toBe(0.5);
    expect(command.getController().getD()).toBe(0.1);
  });
});
