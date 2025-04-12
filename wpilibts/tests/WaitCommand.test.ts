import { WaitCommand } from '../src/commands/WaitCommand';

describe('WaitCommand', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  test('should not be finished immediately', () => {
    const command = new WaitCommand(1);
    
    command.initialize();
    
    expect(command.isFinished()).toBe(false);
  });
  
  test('should be finished after the specified duration', () => {
    const command = new WaitCommand(1);
    
    command.initialize();
    
    // Advance time by less than the duration
    jest.advanceTimersByTime(500);
    
    expect(command.isFinished()).toBe(false);
    
    // Advance time to exceed the duration
    jest.advanceTimersByTime(600);
    
    expect(command.isFinished()).toBe(true);
  });
  
  test('should run when disabled', () => {
    const command = new WaitCommand(1);
    
    expect(command.runsWhenDisabled()).toBe(true);
  });
});
