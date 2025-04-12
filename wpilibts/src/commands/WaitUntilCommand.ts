import { Command } from './Command';

/**
 * A command that does nothing but ends after a specified condition becomes true.
 *
 * This is useful for sequencing with other commands that need to wait for a specific condition.
 */
export class WaitUntilCommand extends Command {
  private m_condition: () => boolean;

  /**
   * Creates a new WaitUntilCommand.
   *
   * @param condition The condition to wait for
   */
  constructor(condition: () => boolean) {
    super();
    this.m_condition = condition;
    this.setRunsWhenDisabled(true);
  }

  /**
   * Returns whether the command is finished.
   *
   * @return True if the specified condition is true
   */
  public override isFinished(): boolean {
    return this.m_condition();
  }
}
