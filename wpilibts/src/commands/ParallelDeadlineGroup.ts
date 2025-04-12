import { Command } from './Command';
import { CommandGroupBase } from './CommandGroupBase';

/**
 * A command composition that runs a set of commands in parallel, ending when a specific command (the "deadline") ends.
 *
 * The commands will be executed simultaneously, and the group will finish when the deadline command finishes,
 * interrupting all other commands that are still running.
 */
export class ParallelDeadlineGroup extends CommandGroupBase {
  private m_deadline: Command;
  private m_runningCommands: boolean[] = [];

  /**
   * Creates a new ParallelDeadlineGroup.
   *
   * @param deadline The command that determines when the group ends
   * @param commands The commands to run in parallel
   */
  constructor(deadline: Command, ...commands: Command[]) {
    super(deadline, ...commands);
    this.m_deadline = deadline;
  }

  /**
   * Initializes the command group. Calls initialize() on all commands.
   */
  public override initialize(): void {
    this.m_runningCommands = Array(this.m_commands.length).fill(false);

    for (let i = 0; i < this.m_commands.length; i++) {
      this.m_commands[i].initialize();
      this.m_runningCommands[i] = true;
    }
  }

  /**
   * Executes all running commands.
   */
  public override execute(): void {
    for (let i = 0; i < this.m_commands.length; i++) {
      if (this.m_runningCommands[i]) {
        this.m_commands[i].execute();

        if (this.m_commands[i].isFinished()) {
          this.m_commands[i].end(false);
          this.m_runningCommands[i] = false;
        }
      }
    }
  }

  /**
   * Ends the command group, calling end() on all running commands.
   *
   * @param interrupted Whether the command group was interrupted
   */
  public override end(interrupted: boolean): void {
    for (let i = 0; i < this.m_commands.length; i++) {
      if (this.m_runningCommands[i]) {
        this.m_commands[i].end(interrupted);
        this.m_runningCommands[i] = false;
      }
    }
  }

  /**
   * Returns whether the command group is finished.
   *
   * @return True if the deadline command has finished
   */
  public override isFinished(): boolean {
    return this.m_deadline.isFinished();
  }
}
