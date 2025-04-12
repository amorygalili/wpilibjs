import { InstantCommand } from '../src/commands/InstantCommand';
import { Subsystem } from '../src/commands/Subsystem';

// Mock the CommandScheduler
jest.mock('../src/commands/CommandScheduler', () => {
  return {
    CommandScheduler: {
      getInstance: jest.fn().mockReturnValue({
        registerSubsystem: jest.fn(),
      }),
    },
  };
});

class TestSubsystem extends Subsystem {}

describe('InstantCommand', () => {
  test('should run the provided function when initialized', () => {
    const toRun = jest.fn();
    const command = new InstantCommand(toRun);
    
    command.initialize();
    
    expect(toRun).toHaveBeenCalled();
  });
  
  test('should always be finished', () => {
    const command = new InstantCommand();
    
    expect(command.isFinished()).toBe(true);
  });
  
  test('should add requirements', () => {
    const subsystem = new TestSubsystem();
    const command = new InstantCommand(() => {}, subsystem);
    
    expect(command.getRequirements().has(subsystem)).toBe(true);
  });
  
  test('should work with no function provided', () => {
    const command = new InstantCommand();
    
    // This should not throw
    command.initialize();
    
    expect(command.isFinished()).toBe(true);
  });
});
