import { Command } from '../src/commands/Command';
import { SequentialCommandGroup } from '../src/commands/SequentialCommandGroup';
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

describe('SequentialCommandGroup', () => {
  let subsystem1: TestSubsystem;
  let subsystem2: TestSubsystem;

  beforeEach(() => {
    subsystem1 = new TestSubsystem();
    subsystem2 = new TestSubsystem();
  });

  test('should initialize the first command', () => {
    const command1 = new TestCommand([subsystem1]);
    const command2 = new TestCommand([subsystem2]);

    const group = new SequentialCommandGroup(command1, command2);

    group.initialize();

    expect(command1.initializeCount).toBe(1);
    expect(command2.initializeCount).toBe(0);
  });

  test('should execute the current command', () => {
    const command1 = new TestCommand([subsystem1]);
    const command2 = new TestCommand([subsystem2]);

    const group = new SequentialCommandGroup(command1, command2);

    group.initialize();
    group.execute();

    expect(command1.executeCount).toBe(1);
    expect(command2.executeCount).toBe(0);
  });

  test('should move to the next command when the current command finishes', () => {
    const command1 = new TestCommand([subsystem1]);
    const command2 = new TestCommand([subsystem2]);

    command1.setFinished(true);

    const group = new SequentialCommandGroup(command1, command2);

    group.initialize();
    group.execute();

    expect(command1.endCount).toBe(1);
    expect(command1.endInterruptedLast).toBe(false);
    expect(command2.initializeCount).toBe(1);
  });

  test('should finish when all commands have finished', () => {
    const command1 = new TestCommand([subsystem1]);
    const command2 = new TestCommand([subsystem2]);

    command1.setFinished(true);
    command2.setFinished(true);

    const group = new SequentialCommandGroup(command1, command2);

    group.initialize();
    group.execute();
    group.execute();

    expect(group.isFinished()).toBe(true);
  });

  test('should not finish when not all commands have finished', () => {
    const command1 = new TestCommand([subsystem1]);
    const command2 = new TestCommand([subsystem2]);

    command1.setFinished(true);
    command2.setFinished(false);

    const group = new SequentialCommandGroup(command1, command2);

    group.initialize();
    group.execute();

    expect(group.isFinished()).toBe(false);
  });

  test('should end the current command when interrupted', () => {
    const command1 = new TestCommand([subsystem1]);
    const command2 = new TestCommand([subsystem2]);

    const group = new SequentialCommandGroup(command1, command2);

    group.initialize();
    group.end(true);

    expect(command1.endCount).toBe(1);
    expect(command1.endInterruptedLast).toBe(true);
    expect(command2.endCount).toBe(0);
  });
});
