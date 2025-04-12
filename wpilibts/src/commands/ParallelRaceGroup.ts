import { Command } from './Command';
import { CommandGroupBase } from './CommandGroupBase';

/**
 * A command composition that runs a set of commands in parallel, ending when any one of the commands ends.
 *
 * The commands will be executed simultaneously, and the group will finish when any command finishes,
 * interrupting all other commands that are still running.
 */
export class ParallelRaceGroup extends CommandGroupBase {
  private m_runningCommands: boolean[] = [];

  /**
   * Creates a new ParallelRaceGroup.
   *
   * @param commands The commands to run in parallel
   */
  constructor(...commands: Command[]) {
    super(...commands);
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
          // If any command finishes, the race is over
          return;
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
   * @return True if any command has finished
   */
  public override isFinished(): boolean {
    for (let i = 0; i < this.m_commands.length; i++) {
      if (this.m_runningCommands[i] && this.m_commands[i].isFinished()) {
        return true;
      }
    }
    return false;
  }
}
