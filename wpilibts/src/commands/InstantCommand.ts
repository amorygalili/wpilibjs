import { Command } from './Command';
import { Subsystem } from './Subsystem';

/**
 * A command that runs instantly; it executes once and then finishes immediately.
 *
 * This is useful for running a single action, or for composing with other commands.
 */
export class InstantCommand extends Command {
  private m_toRun: () => void;

  /**
   * Creates a new InstantCommand.
   *
   * @param toRun The function to run when the command executes
   * @param requirements The subsystems required by this command
   */
  constructor(toRun: () => void = () => {}, ...requirements: Subsystem[]) {
    super();
    this.m_toRun = toRun;
    this.addRequirements(...requirements);
  }

  /**
   * Executes the command.
   */
  public override initialize(): void {
    this.m_toRun();
  }

  /**
   * Returns whether the command is finished.
   *
   * @return Always returns true, since this command runs instantly
   */
  public override isFinished(): boolean {
    return true;
  }
}
