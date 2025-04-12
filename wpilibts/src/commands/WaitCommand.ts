import { Command } from './Command';

/**
 * A command that does nothing but takes a specified amount of time to finish.
 *
 * This is useful for sequencing with other commands that need to wait a certain amount of time.
 */
export class WaitCommand extends Command {
  private m_duration: number;
  private m_startTime: number = 0;

  /**
   * Creates a new WaitCommand.
   *
   * @param seconds The time to wait, in seconds
   */
  constructor(seconds: number) {
    super();
    this.m_duration = seconds;
    this.setRunsWhenDisabled(true);
  }

  /**
   * Initializes the command.
   */
  public override initialize(): void {
    this.m_startTime = Date.now() / 1000;
  }

  /**
   * Returns whether the command is finished.
   *
   * @return True if the specified duration has passed
   */
  public override isFinished(): boolean {
    return (Date.now() / 1000) - this.m_startTime >= this.m_duration;
  }
}
