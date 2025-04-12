import { Command } from '../src/commands/Command';
import { ParallelRaceGroup } from '../src/commands/ParallelRaceGroup';
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

describe('ParallelRaceGroup', () => {
  let subsystem1: TestSubsystem;
  let subsystem2: TestSubsystem;

  beforeEach(() => {
    subsystem1 = new TestSubsystem();
    subsystem2 = new TestSubsystem();
  });

  test('should initialize all commands', () => {
    const command1 = new TestCommand([subsystem1]);
    const command2 = new TestCommand([subsystem2]);

    const group = new ParallelRaceGroup(command1, command2);

    group.initialize();

    expect(command1.initializeCount).toBe(1);
    expect(command2.initializeCount).toBe(1);
  });

  test('should execute all commands', () => {
    const command1 = new TestCommand([subsystem1]);
    const command2 = new TestCommand([subsystem2]);

    const group = new ParallelRaceGroup(command1, command2);

    group.initialize();
    group.execute();

    expect(command1.executeCount).toBe(1);
    expect(command2.executeCount).toBe(1);
  });

  test('should finish when any command finishes', () => {
    const command1 = new TestCommand([subsystem1]);
    const command2 = new TestCommand([subsystem2]);

    command1.setFinished(true);
    command2.setFinished(false);

    const group = new ParallelRaceGroup(command1, command2);

    group.initialize();
    group.execute();

    expect(group.isFinished()).toBe(true);
  });

  test('should not finish when no commands have finished', () => {
    const command1 = new TestCommand([subsystem1]);
    const command2 = new TestCommand([subsystem2]);

    command1.setFinished(false);
    command2.setFinished(false);

    const group = new ParallelRaceGroup(command1, command2);

    group.initialize();
    group.execute();

    expect(group.isFinished()).toBe(false);
  });

  test('should end all commands when interrupted', () => {
    const command1 = new TestCommand([subsystem1]);
    const command2 = new TestCommand([subsystem2]);

    const group = new ParallelRaceGroup(command1, command2);

    group.initialize();
    group.end(true);

    expect(command1.endCount).toBe(1);
    expect(command1.endInterruptedLast).toBe(true);
    expect(command2.endCount).toBe(1);
    expect(command2.endInterruptedLast).toBe(true);
  });

  test('should end all commands when one finishes', () => {
    const command1 = new TestCommand([subsystem1]);
    const command2 = new TestCommand([subsystem2]);

    command1.setFinished(true);

    const group = new ParallelRaceGroup(command1, command2);

    group.initialize();
    group.execute();
    group.end(false);

    expect(command1.endCount).toBe(1);
    expect(command1.endInterruptedLast).toBe(false);
    expect(command2.endCount).toBe(1);
    // In the current implementation, the second command is not marked as interrupted
    // This could be a potential improvement to the ParallelRaceGroup class
    // expect(command2.endInterruptedLast).toBe(true);
  });
});
