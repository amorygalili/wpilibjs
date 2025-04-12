import { Subsystem } from './Subsystem';

/**
 * A state machine representing a complete action to be performed by the robot.
 *
 * Commands are run by the CommandScheduler, and can be composed into CommandGroups
 * to create complex actions.
 */
export abstract class Command {
  protected m_requirements: Set<Subsystem> = new Set<Subsystem>();
  private m_name: string;
  private m_interruptible: boolean = true;
  private m_runsWhenDisabled: boolean = false;

  /**
   * Creates a new Command.
   */
  constructor() {
    this.m_name = this.constructor.name;
  }

  /**
   * The initial subroutine of a command. Called once when the command is initially scheduled.
   */
  public initialize(): void {}

  /**
   * The main body of a command. Called repeatedly while the command is scheduled.
   */
  public execute(): void {}

  /**
   * The action to take when the command ends. Called when either the command
   * finishes normally, or when it is interrupted/canceled.
   *
   * @param interrupted Whether the command was interrupted/canceled
   */
  public end(interrupted: boolean): void {}

  /**
   * Whether the command has finished. Once a command finishes, the scheduler will call
   * its end() method and un-schedule it.
   *
   * @return Whether the command has finished.
   */
  public abstract isFinished(): boolean;

  /**
   * Adds the specified requirements to the command.
   *
   * @param requirements The requirements to add
   */
  public addRequirements(...requirements: Subsystem[]): void {
    requirements.forEach(requirement => {
      this.m_requirements.add(requirement);
    });
  }

  /**
   * Gets the requirements of this command.
   *
   * @return The set of requirements
   */
  public getRequirements(): Set<Subsystem> {
    return this.m_requirements;
  }

  /**
   * Sets the name of this command.
   *
   * @param name The name to set
   */
  public setName(name: string): void {
    this.m_name = name;
  }

  /**
   * Gets the name of this command.
   *
   * @return The name of this command
   */
  public getName(): string {
    return this.m_name;
  }

  /**
   * Sets whether this command can be interrupted by another command that
   * requires one or more of the same subsystems.
   *
   * @param interruptible Whether this command can be interrupted
   */
  public setInterruptible(interruptible: boolean): void {
    this.m_interruptible = interruptible;
  }

  /**
   * Gets whether this command can be interrupted by another command that
   * requires one or more of the same subsystems.
   *
   * @return Whether this command can be interrupted
   */
  public isInterruptible(): boolean {
    return this.m_interruptible;
  }

  /**
   * Sets whether this command can run when the robot is disabled.
   *
   * @param runsWhenDisabled Whether this command can run when the robot is disabled
   */
  public setRunsWhenDisabled(runsWhenDisabled: boolean): void {
    this.m_runsWhenDisabled = runsWhenDisabled;
  }

  /**
   * Gets whether this command can run when the robot is disabled.
   *
   * @return Whether this command can run when the robot is disabled
   */
  public runsWhenDisabled(): boolean {
    return this.m_runsWhenDisabled;
  }

  /**
   * Schedules this command.
   */
  public schedule(): void {
    CommandScheduler.getInstance().schedule(this);
  }

  /**
   * Cancels this command. Will call the end() method.
   */
  public cancel(): void {
    CommandScheduler.getInstance().cancel(this);
  }

  /**
   * Whether this command is currently scheduled.
   *
   * @return Whether this command is currently scheduled
   */
  public isScheduled(): boolean {
    return CommandScheduler.getInstance().isScheduled(this);
  }

  /**
   * Whether this command requires a given subsystem.
   *
   * @param requirement The subsystem to check
   * @return Whether this command requires the subsystem
   */
  public doesRequire(requirement: Subsystem): boolean {
    return this.m_requirements.has(requirement);
  }
}

// Import at the end to avoid circular dependencies
import { CommandScheduler } from './CommandScheduler';
