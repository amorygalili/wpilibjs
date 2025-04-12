import { WaitUntilCommand } from '../src/commands/WaitUntilCommand';

describe('WaitUntilCommand', () => {
  test('should not be finished when condition is false', () => {
    const condition = jest.fn().mockReturnValue(false);
    const command = new WaitUntilCommand(condition);
    
    expect(command.isFinished()).toBe(false);
    expect(condition).toHaveBeenCalled();
  });
  
  test('should be finished when condition is true', () => {
    const condition = jest.fn().mockReturnValue(true);
    const command = new WaitUntilCommand(condition);
    
    expect(command.isFinished()).toBe(true);
    expect(condition).toHaveBeenCalled();
  });
  
  test('should run when disabled', () => {
    const command = new WaitUntilCommand(() => false);
    
    expect(command.runsWhenDisabled()).toBe(true);
  });
});
