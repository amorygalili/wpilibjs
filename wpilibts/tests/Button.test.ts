import { Button } from '../src/commands/button/Button';
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

class TestButton extends Button {
  private m_pressed = false;

  constructor() {
    super();
  }

  public override get(): boolean {
    return this.m_pressed;
  }

  public setPressed(pressed: boolean): void {
    this.m_pressed = pressed;
  }
}

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

describe('Button', () => {
  let button: TestButton;
  let command: TestCommand;
  let scheduler: any;

  beforeEach(() => {
    button = new TestButton();
    command = new TestCommand();
    scheduler = require('../src/commands/CommandScheduler').CommandScheduler.getInstance();
    scheduler._resetMocks();
  });

  test('should register with the CommandScheduler', () => {
    // Create a new button to ensure registerButton is called
    const newButton = new TestButton();
    expect(scheduler.registerButton).toHaveBeenCalled();
  });

  test('should schedule command when pressed (whenPressed)', () => {
    // Set up the button binding
    button.whenPressed(command);

    // Simulate button press
    button.setPressed(true);

    // Call all registered button callbacks
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should be scheduled
    expect(scheduler.schedule).toHaveBeenCalledWith(command);
  });

  test('should not schedule command when already pressed (whenPressed)', () => {
    // Set up the button binding
    button.whenPressed(command);

    // Simulate button press
    button.setPressed(true);

    // Call all registered button callbacks
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Reset mocks
    scheduler.schedule.mockClear();

    // Call callbacks again (button still pressed)
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should not be scheduled again
    expect(scheduler.schedule).not.toHaveBeenCalled();
  });

  test('should schedule command when released (whenReleased)', () => {
    // Set up the button binding
    button.whenReleased(command);

    // Simulate button press
    button.setPressed(true);

    // Call all registered button callbacks
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should not be scheduled yet
    expect(scheduler.schedule).not.toHaveBeenCalled();

    // Simulate button release
    button.setPressed(false);

    // Call all registered button callbacks
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should be scheduled
    expect(scheduler.schedule).toHaveBeenCalledWith(command);
  });

  test('should schedule command while held (whileHeld)', () => {
    // Set up the button binding
    button.whileHeld(command);

    // Simulate button press
    button.setPressed(true);

    // Call all registered button callbacks
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should be scheduled
    expect(scheduler.schedule).toHaveBeenCalledWith(command);
  });

  test('should cancel command when released after whileHeld', () => {
    // Set up the button binding
    button.whileHeld(command);

    // Simulate button press
    button.setPressed(true);

    // Call all registered button callbacks
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should be scheduled
    expect(scheduler.schedule).toHaveBeenCalledWith(command);

    // Reset mocks
    scheduler.schedule.mockClear();

    // Simulate button release
    button.setPressed(false);

    // Call all registered button callbacks
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should be canceled
    expect(scheduler.cancel).toHaveBeenCalledWith(command);
  });

  test('should toggle command when pressed (toggleWhenPressed)', () => {
    // Set up the button binding
    button.toggleWhenPressed(command);

    // Simulate button press
    button.setPressed(true);

    // Call all registered button callbacks
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should be scheduled
    expect(scheduler.schedule).toHaveBeenCalledWith(command);

    // Reset mocks
    scheduler.schedule.mockClear();

    // Simulate button release and press again
    button.setPressed(false);
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());
    button.setPressed(true);

    // Mock isScheduled to return true
    scheduler.isScheduled.mockReturnValueOnce(true);

    // Call all registered button callbacks
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should be canceled
    expect(scheduler.cancel).toHaveBeenCalledWith(command);
  });

  test('should cancel command when pressed (cancelWhenPressed)', () => {
    // Set up the button binding
    button.cancelWhenPressed(command);

    // Simulate button press
    button.setPressed(true);

    // Call all registered button callbacks
    scheduler._buttonCallbacks.forEach((callback: () => void) => callback());

    // Command should be canceled
    expect(scheduler.cancel).toHaveBeenCalledWith(command);
  });

  test('should support method chaining', () => {
    // All button methods should return the button instance for chaining
    expect(button.whenPressed(command)).toBe(button);
    expect(button.whenReleased(command)).toBe(button);
    expect(button.whileHeld(command)).toBe(button);
    expect(button.toggleWhenPressed(command)).toBe(button);
    expect(button.cancelWhenPressed(command)).toBe(button);
  });
});
