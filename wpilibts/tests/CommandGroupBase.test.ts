import { Command } from '../src/commands/Command';
import { CommandGroupBase } from '../src/commands/CommandGroupBase';
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

class TestSubsystem extends Subsystem {}

class TestCommandGroup extends CommandGroupBase {
  constructor(...commands: Command[]) {
    super(...commands);
  }

  public override isFinished(): boolean {
    return false;
  }
}

describe('CommandGroupBase', () => {
  let subsystem1: TestSubsystem;
  let subsystem2: TestSubsystem;

  beforeEach(() => {
    subsystem1 = new TestSubsystem();
    subsystem2 = new TestSubsystem();
  });

  test('should add commands to the group', () => {
    const command1 = new TestCommand([subsystem1]);
    const command2 = new TestCommand([subsystem2]);

    const group = new TestCommandGroup();
    group.addCommands(command1, command2);

    expect(group.getCommands()).toContain(command1);
    expect(group.getCommands()).toContain(command2);
    expect(group.getRequirements().has(subsystem1)).toBe(true);
    expect(group.getRequirements().has(subsystem2)).toBe(true);
  });

  test('should add commands in constructor', () => {
    const command1 = new TestCommand([subsystem1]);
    const command2 = new TestCommand([subsystem2]);

    const group = new TestCommandGroup(command1, command2);

    expect(group.getCommands()).toContain(command1);
    expect(group.getCommands()).toContain(command2);
    expect(group.getRequirements().has(subsystem1)).toBe(true);
    expect(group.getRequirements().has(subsystem2)).toBe(true);
  });

  test('should throw error when adding a command that requires itself', () => {
    const group = new TestCommandGroup();

    expect(() => {
      group.addCommands(group);
    }).toThrow();
  });

  test('should throw error when adding a command while running', () => {
    const command = new TestCommand();
    const group = new TestCommandGroup();

    // Mock isScheduled to return true
    Object.defineProperty(group, 'isScheduled', {
      value: jest.fn().mockReturnValue(true)
    });

    expect(() => {
      group.addCommands(command);
    }).toThrow();
  });

  test('should run when disabled if all commands run when disabled', () => {
    const command1 = new TestCommand();
    const command2 = new TestCommand();

    command1.setRunsWhenDisabled(true);
    command2.setRunsWhenDisabled(true);

    const group = new TestCommandGroup(command1, command2);

    expect(group.runsWhenDisabled()).toBe(true);
  });

  test('should not run when disabled if any command does not run when disabled', () => {
    const command1 = new TestCommand();
    const command2 = new TestCommand();

    command1.setRunsWhenDisabled(true);
    command2.setRunsWhenDisabled(false);

    const group = new TestCommandGroup(command1, command2);

    expect(group.runsWhenDisabled()).toBe(false);
  });
});
