import { Command } from './Command';
import { Subsystem } from './Subsystem';

/**
 * A base for CommandGroups.
 *
 * CommandGroups are commands that contain multiple commands within them, arranged in a
 * specific way. CommandGroupBase provides the basic framework for this.
 */
export abstract class CommandGroupBase extends Command {
  protected m_commands: Command[] = [];

  /**
   * Constructor for CommandGroupBase.
   *
   * @param commands The commands to add to this group
   */
  constructor(...commands: Command[]) {
    super();
    this.addCommands(...commands);
  }

  /**
   * Adds commands to this group.
   *
   * @param commands The commands to add
   */
  public addCommands(...commands: Command[]): void {
    if (this.isScheduled()) {
      throw new Error("Commands cannot be added to a CommandGroup while it is running");
    }

    // Check for command requirements overlapping with this group's requirements
    for (const command of commands) {
      if (command === this) {
        throw new Error("A command group cannot require itself as a requirement");
      }

      // For sequential command groups, we don't need to check for requirement conflicts
      // Only parallel command groups need to check for conflicts
      if (this.constructor.name !== 'SequentialCommandGroup') {
        // Check for requirements overlapping with this group's requirements
        for (const requirement of command.getRequirements()) {
          if (this.doesRequire(requirement)) {
            throw new Error(`Multiple commands in a parallel group cannot require the same subsystem: ${requirement.constructor.name}`);
          }
        }
      }

      // Add the command's requirements to this group's requirements
      for (const requirement of command.getRequirements()) {
        this.addRequirements(requirement);
      }
    }

    // Add the commands to the group
    this.m_commands.push(...commands);
  }

  /**
   * Gets the commands in this group.
   *
   * @return The commands in this group
   */
  public getCommands(): Command[] {
    return [...this.m_commands];
  }

  /**
   * Whether this command runs when the robot is disabled.
   *
   * @return True if this command runs when the robot is disabled
   */
  public override runsWhenDisabled(): boolean {
    // A command group runs when disabled if all of its component commands run when disabled
    return this.m_commands.every(command => command.runsWhenDisabled());
  }
}
