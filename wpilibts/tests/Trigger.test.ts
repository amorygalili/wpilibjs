import { Trigger } from '../src/commands/button/Trigger';
import { Command } from '../src/commands/Command';
import { Subsystem } from '../src/commands/Subsystem';

// Mock the CommandScheduler
jest.mock('../src/commands/CommandScheduler', () => {
  // Create a mock implementation that tracks button state
  const buttonCallbacks: Array<() => void> = [];
  const mockSchedule = jest.fn();
  const mockCancel = jest.fn();
  const mockIsScheduled = jest.fn().mockReturnValue(false);
  const mockRegisterButton = jest.fn((callback: () => void) => {
    buttonCallbacks.push(callback);
    return () => {};
  });

  return {
    CommandScheduler: {
      getInstance: jest.fn().mockReturnValue({
        registerSubsystem: jest.fn(),
        isScheduled: mockIsScheduled,
        schedule: mockSchedule,
        cancel: mockCancel,
        registerButton: mockRegisterButton,
        // Expose the callbacks for testing
        _buttonCallbacks: buttonCallbacks,
        // Reset mocks for testing
        _resetMocks: () => {
          mockSchedule.mockClear();
          mockCancel.mockClear();
          mockIsScheduled.mockClear();
          mockRegisterButton.mockClear();
          buttonCallbacks.length = 0;
        }
      }),
    },
  };
});

class TestCommand extends Command {
  public initializeCount = 0;
  public executeCount = 0;
  public endCount = 0;
  public endInterruptedLast = false;
  private m_finished = false;

  constructor(requirements: Subsystem[] = []) {
    super();
    this.addRequirements(...requirements);
  }

  public override initialize(): void {
    this.initializeCount++;
  }

  public override execute(): void {
    this.executeCount++;
  }

  public override end(interrupted: boolean): void {
    this.endCount++;
    this.endInterruptedLast = interrupted;
  }

  public override isFinished(): boolean {
    return this.m_finished;
  }

  public setFinished(finished: boolean): void {
    this.m_finished = finished;
  }
}

describe('Trigger', () => {
  let condition: jest.Mock;
  let trigger: Trigger;
  let command: TestCommand;
  let scheduler: any;

  beforeEach(() => {
    condition = jest.fn().mockReturnValue(false);
    trigger = new Trigger(condition);
    command = new TestCommand();
    scheduler = require('../src/commands/CommandScheduler').CommandScheduler.getInstance();
    scheduler._resetMocks();
  });

  test('should register with the CommandScheduler', () => {
    // Create a new trigger to ensure registerButton is called
    const newTrigger = new Trigger(() => false);
    expect(scheduler.registerButton).toHaveBeenCalled();
  });

  test('should call the condition function', () => {
    trigger.get();
    expect(condition).toHaveBeenCalled();
  });

  test('should negate the condition', () => {
    condition.mockReturnValue(true);
    const negatedTrigger = trigger.negate();

    expect(negatedTrigger.get()).toBe(false);

    condition.mockReturnValue(false);
    expect(negatedTrigger.get()).toBe(true);
  });

  test('should create AND trigger', () => {
    const condition2 = jest.fn().mockReturnValue(true);
    const trigger2 = new Trigger(condition2);

    const andTrigger = trigger.and(trigger2);

    condition.mockReturnValue(false);
    expect(andTrigger.get()).toBe(false);

    condition.mockReturnValue(true);
    expect(andTrigger.get()).toBe(true);

    condition2.mockReturnValue(false);
    expect(andTrigger.get()).toBe(false);
  });

  test('should create OR trigger', () => {
    const condition2 = jest.fn().mockReturnValue(false);
    const trigger2 = new Trigger(condition2);

    const orTrigger = trigger.or(trigger2);

    condition.mockReturnValue(false);
    expect(orTrigger.get()).toBe(false);

    condition.mockReturnValue(true);
    expect(orTrigger.get()).toBe(true);

    condition.mockReturnValue(false);
    condition2.mockReturnValue(true);
    expect(orTrigger.get()).toBe(true);
  });

  test('should schedule command when active (whenActive)', () => {
    // Set up the trigger binding
    trigger.whenActive(command);

    // Simulate trigger activation
    condition.mockReturnValue(true);

    // Call all registered button callbacks
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should be scheduled
    expect(scheduler.schedule).toHaveBeenCalledWith(command);
  });

  test('should not schedule command when already active (whenActive)', () => {
    // Set up the trigger binding
    trigger.whenActive(command);

    // Simulate trigger activation
    condition.mockReturnValue(true);

    // Call all registered button callbacks
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Reset mocks
    scheduler.schedule.mockClear();

    // Call callbacks again (trigger still active)
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should not be scheduled again
    expect(scheduler.schedule).not.toHaveBeenCalled();
  });

  test('should schedule command when inactive (whenInactive)', () => {
    // Set up the trigger binding
    trigger.whenInactive(command);

    // Simulate trigger activation
    condition.mockReturnValue(true);

    // Call all registered button callbacks
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should not be scheduled yet
    expect(scheduler.schedule).not.toHaveBeenCalled();

    // Simulate trigger deactivation
    condition.mockReturnValue(false);

    // Call all registered button callbacks
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should be scheduled
    expect(scheduler.schedule).toHaveBeenCalledWith(command);
  });

  test('should schedule command while active (whileActiveContinous)', () => {
    // Set up the trigger binding
    trigger.whileActiveContinous(command);

    // Simulate trigger activation
    condition.mockReturnValue(true);

    // Call all registered button callbacks
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should be scheduled
    expect(scheduler.schedule).toHaveBeenCalledWith(command);

    // Reset mocks
    scheduler.schedule.mockClear();

    // Call callbacks again (trigger still active)
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should be scheduled again
    expect(scheduler.schedule).toHaveBeenCalledWith(command);
  });

  test('should cancel command when inactive after whileActiveContinous', () => {
    // Set up the trigger binding
    trigger.whileActiveContinous(command);

    // Simulate trigger activation
    condition.mockReturnValue(true);

    // Call all registered button callbacks
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should be scheduled
    expect(scheduler.schedule).toHaveBeenCalledWith(command);

    // Reset mocks
    scheduler.schedule.mockClear();

    // Simulate trigger deactivation
    condition.mockReturnValue(false);

    // Call all registered button callbacks
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should be canceled
    expect(scheduler.cancel).toHaveBeenCalledWith(command);
  });

  test('should schedule command once when active (whileActiveOnce)', () => {
    // Set up the trigger binding
    trigger.whileActiveOnce(command);

    // Simulate trigger activation
    condition.mockReturnValue(true);

    // Call all registered button callbacks
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should be scheduled
    expect(scheduler.schedule).toHaveBeenCalledWith(command);

    // Reset mocks
    scheduler.schedule.mockClear();

    // Call callbacks again (trigger still active)
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should not be scheduled again
    expect(scheduler.schedule).not.toHaveBeenCalled();
  });

  test('should cancel command when inactive after whileActiveOnce', () => {
    // Set up the trigger binding
    trigger.whileActiveOnce(command);

    // Simulate trigger activation
    condition.mockReturnValue(true);

    // Call all registered button callbacks
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should be scheduled
    expect(scheduler.schedule).toHaveBeenCalledWith(command);

    // Reset mocks
    scheduler.schedule.mockClear();

    // Simulate trigger deactivation
    condition.mockReturnValue(false);

    // Call all registered button callbacks
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should be canceled
    expect(scheduler.cancel).toHaveBeenCalledWith(command);
  });

  test('should toggle command when active (toggleWhenActive)', () => {
    // Set up the trigger binding
    trigger.toggleWhenActive(command);

    // Simulate trigger activation
    condition.mockReturnValue(true);

    // Call all registered button callbacks
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should be scheduled
    expect(scheduler.schedule).toHaveBeenCalledWith(command);

    // Reset mocks
    scheduler.schedule.mockClear();

    // Simulate trigger deactivation and activation again
    condition.mockReturnValue(false);
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());
    condition.mockReturnValue(true);

    // Mock isScheduled to return true
    scheduler.isScheduled.mockReturnValueOnce(true);

    // Call all registered button callbacks
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should be canceled
    expect(scheduler.cancel).toHaveBeenCalledWith(command);
  });

  test('should cancel command when active (cancelWhenActive)', () => {
    // Set up the trigger binding
    trigger.cancelWhenActive(command);

    // Simulate trigger activation
    condition.mockReturnValue(true);

    // Call all registered button callbacks
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should be canceled
    expect(scheduler.cancel).toHaveBeenCalledWith(command);
  });

  test('should support method chaining', () => {
    // All trigger methods should return the trigger instance for chaining
    expect(trigger.whenActive(command)).toBe(trigger);
    expect(trigger.whenInactive(command)).toBe(trigger);
    expect(trigger.whileActiveContinous(command)).toBe(trigger);
    expect(trigger.whileActiveOnce(command)).toBe(trigger);
    expect(trigger.toggleWhenActive(command)).toBe(trigger);
    expect(trigger.cancelWhenActive(command)).toBe(trigger);
  });
});
