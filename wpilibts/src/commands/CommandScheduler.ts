import { Command } from './Command';
import { Subsystem } from './Subsystem';
import { DriverStation } from '../DriverStation';
import { EventEmitter } from 'events';

/**
 * The scheduler responsible for running Commands.
 *
 * The scheduler is a singleton class that is responsible for running Commands,
 * scheduling them for later execution, checking if they are finished, and removing
 * them when they are finished.
 */
export class CommandScheduler extends EventEmitter {
  private static instance: CommandScheduler;

  private m_subsystems: Set<Subsystem> = new Set<Subsystem>();
  private m_commands: Map<Command, Set<Subsystem>> = new Map<Command, Set<Subsystem>>();
  private m_requirements: Map<Subsystem, Command> = new Map<Subsystem, Command>();
  private m_buttons: Set<() => void> = new Set<() => void>();
  private m_disabled: boolean = false;
  private m_inRunLoop: boolean = false;
  private m_toSchedule: Command[] = [];
  private m_toCancel: Command[] = [];

  /**
   * Constructor for the CommandScheduler.
   */
  private constructor() {
    super();
  }

  /**
   * Gets the CommandScheduler instance.
   *
   * @return The CommandScheduler instance
   */
  public static getInstance(): CommandScheduler {
    if (!CommandScheduler.instance) {
      CommandScheduler.instance = new CommandScheduler();
    }
    return CommandScheduler.instance;
  }

  /**
   * Schedules a command for execution. Does nothing if the command is already scheduled.
   * If a command's requirements are not available, it will not be scheduled and false will
   * be returned.
   *
   * @param command The command to schedule
   * @return Whether the command was scheduled successfully
   */
  public schedule(command: Command): boolean {
    if (this.m_inRunLoop) {
      this.m_toSchedule.push(command);
      return true;
    }

    if (this.isScheduled(command)) {
      return true;
    }

    // Check if the command's requirements are available
    const requirements = command.getRequirements();
    for (const requirement of requirements) {
      const requiring = this.requiring(requirement);
      if (requiring !== null && requiring !== command && !requiring.isInterruptible()) {
        return false;
      }
    }

    // Cancel any commands that require the same subsystems
    for (const requirement of requirements) {
      const requiring = this.requiring(requirement);
      if (requiring !== null && requiring !== command) {
        this.cancel(requiring);
      }
    }

    // Schedule the command
    this.m_commands.set(command, requirements);
    for (const requirement of requirements) {
      this.m_requirements.set(requirement, command);
      requirement.setCurrentCommand(command);
    }

    command.initialize();
    this.emit('command-initialized', command);

    return true;
  }

  /**
   * Runs a single iteration of the scheduler. The execution occurs in the following order:
   *
   * 1. Poll the buttons for new commands to add
   * 2. Run the periodic method of each registered subsystem
   * 3. Run the execute method of each scheduled command
   * 4. Check if the command has finished, and if so, call its end method and unschedule it
   * 5. Add any subsystem default commands for subsystems that don't currently have a command
   */
  public run(): void {
    if (this.m_disabled) {
      return;
    }

    // Run the periodic method of each registered subsystem
    this.m_inRunLoop = true;

    // Poll the buttons
    for (const button of this.m_buttons) {
      button();
    }

    // Run subsystem periodic methods
    for (const subsystem of this.m_subsystems) {
      subsystem.periodic();
      if (DriverStation.getInstance().isDisabled()) {
        continue;
      }
      // Always run simulation periodic in TypeScript implementation
      subsystem.simulationPeriodic();
    }

    // Run scheduled commands
    for (const [command, requirements] of this.m_commands.entries()) {
      if (DriverStation.getInstance().isDisabled() && !command.runsWhenDisabled()) {
        this.cancel(command);
        continue;
      }

      command.execute();
      this.emit('command-executed', command);

      if (command.isFinished()) {
        command.end(false);
        this.emit('command-finished', command);
        this.unschedule(command);
      }
    }

    // Add default commands for subsystems that don't have a command
    for (const subsystem of this.m_subsystems) {
      if (!this.m_requirements.has(subsystem) && subsystem.getDefaultCommand() !== null) {
        this.schedule(subsystem.getDefaultCommand()!);
      }
    }

    // Process any commands that were scheduled or canceled during the run loop
    this.m_inRunLoop = false;
    for (const command of this.m_toSchedule) {
      this.schedule(command);
    }
    this.m_toSchedule = [];

    for (const command of this.m_toCancel) {
      this.cancel(command);
    }
    this.m_toCancel = [];
  }

  /**
   * Registers a subsystem with the scheduler. This must be called for the subsystem's
   * periodic() method to be called.
   *
   * @param subsystem The subsystem to register
   */
  public registerSubsystem(...subsystems: Subsystem[]): void {
    for (const subsystem of subsystems) {
      this.m_subsystems.add(subsystem);
    }
  }

  /**
   * Unregisters a subsystem with the scheduler. This will remove the subsystem from
   * the scheduler completely, including any commands that require it.
   *
   * @param subsystem The subsystem to unregister
   */
  public unregisterSubsystem(...subsystems: Subsystem[]): void {
    for (const subsystem of subsystems) {
      this.m_subsystems.delete(subsystem);

      // Cancel any commands that require this subsystem
      const command = this.m_requirements.get(subsystem);
      if (command !== undefined) {
        this.cancel(command);
      }

      this.m_requirements.delete(subsystem);
    }
  }

  /**
   * Registers a button with the scheduler. The button's action will be run
   * as part of the scheduler's run loop.
   *
   * @param button The button to register
   */
  public registerButton(button: () => void): void {
    this.m_buttons.add(button);
  }

  /**
   * Unregisters a button with the scheduler.
   *
   * @param button The button to unregister
   */
  public unregisterButton(button: () => void): void {
    this.m_buttons.delete(button);
  }

  /**
   * Cancels a command. The command's end() method will be called with interrupted=true.
   * Any subsystems associated with the command will be cleared.
   *
   * @param command The command to cancel
   */
  public cancel(command: Command): void {
    if (this.m_inRunLoop) {
      this.m_toCancel.push(command);
      return;
    }

    if (!this.isScheduled(command)) {
      return;
    }

    command.end(true);
    this.emit('command-interrupted', command);
    this.unschedule(command);
  }

  /**
   * Cancels all commands that are currently scheduled.
   */
  public cancelAll(): void {
    for (const command of this.m_commands.keys()) {
      this.cancel(command);
    }
  }

  /**
   * Whether a command is currently scheduled.
   *
   * @param command The command to check
   * @return Whether the command is currently scheduled
   */
  public isScheduled(command: Command): boolean {
    return this.m_commands.has(command);
  }

  /**
   * Returns the command currently requiring a subsystem.
   *
   * @param subsystem The subsystem to check
   * @return The command currently requiring the subsystem, or null if no command is requiring it
   */
  public requiring(subsystem: Subsystem): Command | null {
    return this.m_requirements.get(subsystem) || null;
  }

  /**
   * Disables the scheduler.
   */
  public disable(): void {
    this.m_disabled = true;
  }

  /**
   * Enables the scheduler.
   */
  public enable(): void {
    this.m_disabled = false;
  }

  /**
   * Unschedules a command.
   *
   * @param command The command to unschedule
   */
  private unschedule(command: Command): void {
    const requirements = this.m_commands.get(command);
    if (requirements === undefined) {
      return;
    }

    this.m_commands.delete(command);
    for (const requirement of requirements) {
      this.m_requirements.delete(requirement);
      requirement.setCurrentCommand(null);
    }
  }
}
