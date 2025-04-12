import { RunCommand } from '../src/commands/RunCommand';
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

describe('RunCommand', () => {
  test('should run the provided function when executed', () => {
    const toRun = jest.fn();
    const command = new RunCommand(toRun);
    
    command.execute();
    
    expect(toRun).toHaveBeenCalled();
  });
  
  test('should never be finished', () => {
    const command = new RunCommand(() => {});
    
    expect(command.isFinished()).toBe(false);
  });
  
  test('should add requirements', () => {
    const subsystem = new TestSubsystem();
    const command = new RunCommand(() => {}, subsystem);
    
    expect(command.getRequirements().has(subsystem)).toBe(true);
  });
  
  test('should run the function multiple times', () => {
    const toRun = jest.fn();
    const command = new RunCommand(toRun);
    
    command.execute();
    command.execute();
    command.execute();
    
    expect(toRun).toHaveBeenCalledTimes(3);
  });
});
