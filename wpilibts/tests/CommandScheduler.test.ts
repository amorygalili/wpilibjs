import { CommandScheduler } from '../src/commands/CommandScheduler';
import { Command } from '../src/commands/Command';
import { Subsystem } from '../src/commands/Subsystem';
import { DriverStation } from '../src/DriverStation';

// Mock the DriverStation
jest.mock('../src/DriverStation', () => {
  return {
    DriverStation: {
      getInstance: jest.fn().mockReturnValue({
        isDisabled: jest.fn().mockReturnValue(false),
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

  constructor(requirements: Set<Subsystem> = new Set()) {
    super();
    // Add the requirements to the command
    for (const requirement of requirements) {
      this.addRequirements(requirement);
    }
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

  // We don't need to override getRequirements since we're using the parent class implementation
}

class TestSubsystem extends Subsystem {
  public periodicCount = 0;
  public simulationPeriodicCount = 0;

  constructor() {
    super();
  }

  public override periodic(): void {
    this.periodicCount++;
  }

  public override simulationPeriodic(): void {
    this.simulationPeriodicCount++;
  }

  public isSimulation(): boolean {
    return true;
  }
}

describe('CommandScheduler', () => {
  let scheduler: CommandScheduler;
  let ds: any;

  beforeEach(() => {
    // Reset the singleton instance
    (CommandScheduler as any).instance = undefined;

    scheduler = CommandScheduler.getInstance();
    ds = DriverStation.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should be a singleton', () => {
    const instance1 = CommandScheduler.getInstance();
    const instance2 = CommandScheduler.getInstance();

    expect(instance1).toBe(instance2);
  });

  test('should register and unregister subsystems', () => {
    const subsystem1 = new TestSubsystem();
    const subsystem2 = new TestSubsystem();

    // Subsystems are registered in their constructor, so we need to unregister them first
    scheduler.unregisterSubsystem(subsystem1, subsystem2);

    scheduler.registerSubsystem(subsystem1, subsystem2);

    scheduler.run();

    expect(subsystem1.periodicCount).toBe(1);
    expect(subsystem2.periodicCount).toBe(1);

    scheduler.unregisterSubsystem(subsystem1);

    scheduler.run();

    expect(subsystem1.periodicCount).toBe(1);
    expect(subsystem2.periodicCount).toBe(2);
  });

  test('should register and unregister buttons', () => {
    const button1 = jest.fn();
    const button2 = jest.fn();

    scheduler.registerButton(button1);
    scheduler.registerButton(button2);

    scheduler.run();

    expect(button1).toHaveBeenCalled();
    expect(button2).toHaveBeenCalled();

    button1.mockClear();
    button2.mockClear();

    scheduler.unregisterButton(button1);

    scheduler.run();

    expect(button1).not.toHaveBeenCalled();
    expect(button2).toHaveBeenCalled();
  });

  test('should schedule and run commands', () => {
    const command = new TestCommand();

    scheduler.schedule(command);

    expect(command.initializeCount).toBe(1);
    expect(command.executeCount).toBe(0);

    scheduler.run();

    expect(command.executeCount).toBe(1);

    scheduler.run();

    expect(command.executeCount).toBe(2);
    expect(command.endCount).toBe(0);

    command.setFinished(true);

    scheduler.run();

    expect(command.executeCount).toBe(3);
    expect(command.endCount).toBe(1);
    expect(command.endInterruptedLast).toBe(false);
    expect(scheduler.isScheduled(command)).toBe(false);
  });

  test('should cancel commands', () => {
    const command = new TestCommand();

    scheduler.schedule(command);

    expect(command.initializeCount).toBe(1);

    scheduler.cancel(command);

    expect(command.endCount).toBe(1);
    expect(command.endInterruptedLast).toBe(true);
    expect(scheduler.isScheduled(command)).toBe(false);
  });

  test('should handle command requirements', () => {
    const subsystem = new TestSubsystem();
    const command1 = new TestCommand(new Set([subsystem]));
    const command2 = new TestCommand(new Set([subsystem]));

    scheduler.schedule(command1);

    expect(scheduler.isScheduled(command1)).toBe(true);
    expect(scheduler.requiring(subsystem)).toBe(command1);

    scheduler.schedule(command2);

    expect(scheduler.isScheduled(command1)).toBe(false);
    expect(scheduler.isScheduled(command2)).toBe(true);
    expect(scheduler.requiring(subsystem)).toBe(command2);
    expect(command1.endCount).toBe(1);
    expect(command1.endInterruptedLast).toBe(true);
  });

  test('should not schedule command if requirements are not interruptible', () => {
    const subsystem = new TestSubsystem();
    const command1 = new TestCommand(new Set([subsystem]));
    const command2 = new TestCommand(new Set([subsystem]));

    command1.setInterruptible(false);

    scheduler.schedule(command1);

    expect(scheduler.isScheduled(command1)).toBe(true);

    const result = scheduler.schedule(command2);

    expect(result).toBe(false);
    expect(scheduler.isScheduled(command1)).toBe(true);
    expect(scheduler.isScheduled(command2)).toBe(false);
  });

  test('should cancel all commands', () => {
    const command1 = new TestCommand();
    const command2 = new TestCommand();

    scheduler.schedule(command1);
    scheduler.schedule(command2);

    expect(scheduler.isScheduled(command1)).toBe(true);
    expect(scheduler.isScheduled(command2)).toBe(true);

    scheduler.cancelAll();

    expect(scheduler.isScheduled(command1)).toBe(false);
    expect(scheduler.isScheduled(command2)).toBe(false);
    expect(command1.endCount).toBe(1);
    expect(command2.endCount).toBe(1);
  });

  test('should run default commands', () => {
    const subsystem = new TestSubsystem();
    const defaultCommand = new TestCommand(new Set([subsystem]));

    subsystem.setDefaultCommand(defaultCommand);

    // First run schedules the default command
    scheduler.run();

    expect(scheduler.isScheduled(defaultCommand)).toBe(true);
    expect(defaultCommand.initializeCount).toBe(1);
    expect(defaultCommand.executeCount).toBe(0);

    // Second run executes the command
    scheduler.run();

    expect(defaultCommand.executeCount).toBe(1);
  });

  test('should not run commands when disabled', () => {
    const command = new TestCommand();

    scheduler.schedule(command);

    ds.isDisabled.mockReturnValue(true);

    scheduler.run();

    expect(command.executeCount).toBe(0);
    expect(command.endCount).toBe(1);
    expect(scheduler.isScheduled(command)).toBe(false);
  });

  test('should run commands when disabled if they run when disabled', () => {
    const command = new TestCommand();
    command.setRunsWhenDisabled(true);

    scheduler.schedule(command);

    ds.isDisabled.mockReturnValue(true);

    scheduler.run();

    expect(command.executeCount).toBe(1);
    expect(command.endCount).toBe(0);
    expect(scheduler.isScheduled(command)).toBe(true);
  });

  test('should disable and enable the scheduler', () => {
    const subsystem = new TestSubsystem();

    scheduler.registerSubsystem(subsystem);

    scheduler.disable();

    scheduler.run();

    expect(subsystem.periodicCount).toBe(0);

    scheduler.enable();

    scheduler.run();

    expect(subsystem.periodicCount).toBe(1);
  });
});
