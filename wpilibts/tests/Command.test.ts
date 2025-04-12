import { Command } from '../src/commands/Command';
import { Subsystem } from '../src/commands/Subsystem';
import { CommandScheduler } from '../src/commands/CommandScheduler';

// Mock the CommandScheduler
jest.mock('../src/commands/CommandScheduler', () => {
  return {
    CommandScheduler: {
      getInstance: jest.fn().mockReturnValue({
        schedule: jest.fn(),
        cancel: jest.fn(),
        isScheduled: jest.fn(),
        registerSubsystem: jest.fn(),
      }),
    },
  };
});

class TestCommand extends Command {
  private m_finished: boolean = false;

  constructor() {
    super();
  }

  public override initialize(): void {}

  public override execute(): void {}

  public override end(interrupted: boolean): void {}

  public override isFinished(): boolean {
    return this.m_finished;
  }

  public setFinished(finished: boolean): void {
    this.m_finished = finished;
  }
}

class TestSubsystem extends Subsystem {
  constructor() {
    super();
  }
}

describe('Command', () => {
  let command: TestCommand;
  let scheduler: any;

  beforeEach(() => {
    command = new TestCommand();
    scheduler = CommandScheduler.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should have the correct name', () => {
    expect(command.getName()).toBe('TestCommand');

    command.setName('CustomName');
    expect(command.getName()).toBe('CustomName');
  });

  test('should be interruptible by default', () => {
    expect(command.isInterruptible()).toBe(true);

    command.setInterruptible(false);
    expect(command.isInterruptible()).toBe(false);
  });

  test('should not run when disabled by default', () => {
    expect(command.runsWhenDisabled()).toBe(false);

    command.setRunsWhenDisabled(true);
    expect(command.runsWhenDisabled()).toBe(true);
  });

  test('should add requirements', () => {
    const subsystem1 = new TestSubsystem();
    const subsystem2 = new TestSubsystem();

    command.addRequirements(subsystem1, subsystem2);

    expect(command.getRequirements().size).toBe(2);
    expect(command.getRequirements().has(subsystem1)).toBe(true);
    expect(command.getRequirements().has(subsystem2)).toBe(true);

    expect(command.doesRequire(subsystem1)).toBe(true);
    expect(command.doesRequire(subsystem2)).toBe(true);
  });

  test('should schedule the command', () => {
    command.schedule();

    expect(scheduler.schedule).toHaveBeenCalledWith(command);
  });

  test('should cancel the command', () => {
    command.cancel();

    expect(scheduler.cancel).toHaveBeenCalledWith(command);
  });

  test('should check if the command is scheduled', () => {
    scheduler.isScheduled.mockReturnValue(true);

    expect(command.isScheduled()).toBe(true);
    expect(scheduler.isScheduled).toHaveBeenCalledWith(command);

    scheduler.isScheduled.mockReturnValue(false);

    expect(command.isScheduled()).toBe(false);
  });
});
