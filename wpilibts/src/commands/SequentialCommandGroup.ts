import { Command } from './Command';
import { CommandGroupBase } from './CommandGroupBase';

/**
 * A command composition that runs a list of commands in sequence.
 *
 * The commands will be executed one after another in the order they are passed into
 * the constructor. The group finishes when the last command finishes.
 */
export class SequentialCommandGroup extends CommandGroupBase {
  private m_currentCommandIndex: number = -1;
  private m_runningCommands: boolean[] = [];

  /**
   * Creates a new SequentialCommandGroup.
   *
   * @param commands The commands to run in sequence
   */
  constructor(...commands: Command[]) {
    super(...commands);
  }

  /**
   * Initializes the command group. Calls initialize() on the first command.
   */
  public override initialize(): void {
    this.m_currentCommandIndex = 0;
    this.m_runningCommands = Array(this.m_commands.length).fill(false);

    if (this.m_commands.length > 0) {
      this.m_commands[0].initialize();
      this.m_runningCommands[0] = true;
    }
  }

  /**
   * Executes the currently active command.
   */
  public override execute(): void {
    if (this.m_currentCommandIndex >= this.m_commands.length) {
      return;
    }

    const currentCommand = this.m_commands[this.m_currentCommandIndex];
    currentCommand.execute();

    if (currentCommand.isFinished()) {
      currentCommand.end(false);
      this.m_runningCommands[this.m_currentCommandIndex] = false;
      this.m_currentCommandIndex++;

      if (this.m_currentCommandIndex < this.m_commands.length) {
        this.m_commands[this.m_currentCommandIndex].initialize();
        this.m_runningCommands[this.m_currentCommandIndex] = true;
      }
    }
  }

  /**
   * Ends the command group, calling end() on any running commands.
   *
   * @param interrupted Whether the command group was interrupted
   */
  public override end(interrupted: boolean): void {
    if (interrupted && this.m_currentCommandIndex < this.m_commands.length && this.m_runningCommands[this.m_currentCommandIndex]) {
      this.m_commands[this.m_currentCommandIndex].end(true);
      this.m_runningCommands[this.m_currentCommandIndex] = false;
    }
  }

  /**
   * Returns whether the command group is finished.
   *
   * @return True if all commands have been executed
   */
  public override isFinished(): boolean {
    return this.m_currentCommandIndex >= this.m_commands.length;
  }
}
