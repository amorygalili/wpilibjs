import { Command } from './Command';
import { Subsystem } from './Subsystem';

/**
 * A command that runs a function continuously.
 *
 * This command will run the given function every time execute() is called, and will not finish
 * until it is interrupted.
 */
export class RunCommand extends Command {
  private m_toRun: () => void;

  /**
   * Creates a new RunCommand.
   *
   * @param toRun The function to run
   * @param requirements The subsystems required by this command
   */
  constructor(toRun: () => void, ...requirements: Subsystem[]) {
    super();
    this.m_toRun = toRun;
    this.addRequirements(...requirements);
  }

  /**
   * Executes the command.
   */
  public override execute(): void {
    this.m_toRun();
  }

  /**
   * Returns whether the command is finished.
   *
   * @return Always returns false, since this command runs until interrupted
   */
  public override isFinished(): boolean {
    return false;
  }
}
