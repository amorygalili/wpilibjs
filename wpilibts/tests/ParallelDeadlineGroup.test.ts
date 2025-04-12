import { Command } from '../src/commands/Command';
import { ParallelDeadlineGroup } from '../src/commands/ParallelDeadlineGroup';
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

describe('ParallelDeadlineGroup', () => {
  let subsystem1: TestSubsystem;
  let subsystem2: TestSubsystem;

  beforeEach(() => {
    subsystem1 = new TestSubsystem();
    subsystem2 = new TestSubsystem();
  });

  test('should initialize all commands', () => {
    const deadline = new TestCommand([subsystem1]);
    const command2 = new TestCommand([subsystem2]);

    const group = new ParallelDeadlineGroup(deadline, command2);

    group.initialize();

    expect(deadline.initializeCount).toBe(1);
    expect(command2.initializeCount).toBe(1);
  });

  test('should execute all commands', () => {
    const deadline = new TestCommand([subsystem1]);
    const command2 = new TestCommand([subsystem2]);

    const group = new ParallelDeadlineGroup(deadline, command2);

    group.initialize();
    group.execute();

    expect(deadline.executeCount).toBe(1);
    expect(command2.executeCount).toBe(1);
  });

  test('should finish when the deadline command finishes', () => {
    const deadline = new TestCommand([subsystem1]);
    const command2 = new TestCommand([subsystem2]);

    deadline.setFinished(true);
    command2.setFinished(false);

    const group = new ParallelDeadlineGroup(deadline, command2);

    group.initialize();
    group.execute();

    expect(group.isFinished()).toBe(true);
  });

  test('should not finish when the deadline command has not finished', () => {
    const deadline = new TestCommand([subsystem1]);
    const command2 = new TestCommand([subsystem2]);

    deadline.setFinished(false);
    command2.setFinished(true);

    const group = new ParallelDeadlineGroup(deadline, command2);

    group.initialize();
    group.execute();

    expect(group.isFinished()).toBe(false);
  });

  test('should end all commands when interrupted', () => {
    const deadline = new TestCommand([subsystem1]);
    const command2 = new TestCommand([subsystem2]);

    const group = new ParallelDeadlineGroup(deadline, command2);

    group.initialize();
    group.end(true);

    expect(deadline.endCount).toBe(1);
    expect(deadline.endInterruptedLast).toBe(true);
    expect(command2.endCount).toBe(1);
    expect(command2.endInterruptedLast).toBe(true);
  });

  test('should end all commands when finished', () => {
    const deadline = new TestCommand([subsystem1]);
    const command2 = new TestCommand([subsystem2]);

    deadline.setFinished(true);

    const group = new ParallelDeadlineGroup(deadline, command2);

    group.initialize();
    group.execute();
    group.end(false);

    expect(deadline.endCount).toBe(1);
    expect(deadline.endInterruptedLast).toBe(false);
    expect(command2.endCount).toBe(1);
    expect(command2.endInterruptedLast).toBe(false);
  });

  test('should throw error when no deadline command is provided', () => {
    expect(() => {
      // @ts-ignore - Testing that this throws at runtime
      new ParallelDeadlineGroup();
    }).toThrow();
  });
});
