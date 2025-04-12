/**
 * A subsystem is a major component of the robot that has its own periodic method.
 * 
 * Command-based robot code is organized around subsystems, which are robot components
 * that can be independently controlled. Examples include the drivetrain, a shooter, an elevator, etc.
 * 
 * Subsystems are registered with the CommandScheduler and their periodic() methods are called
 * when the scheduler runs. Subsystems can also have default commands that run when no other
 * command is scheduled that requires the subsystem.
 */
export class Subsystem {
  private m_defaultCommand: Command | null = null;
  private m_currentCommand: Command | null = null;

  /**
   * Constructor for a Subsystem.
   */
  constructor() {
    // Register this subsystem with the CommandScheduler
    CommandScheduler.getInstance().registerSubsystem(this);
  }

  /**
   * Gets the default command for this subsystem.
   * 
   * @return The default command, or null if none is set
   */
  public getDefaultCommand(): Command | null {
    return this.m_defaultCommand;
  }

  /**
   * Sets the default command for this subsystem.
   * 
   * @param defaultCommand The command to set as the default
   */
  public setDefaultCommand(defaultCommand: Command): void {
    if (defaultCommand === null) {
      this.m_defaultCommand = null;
      return;
    }

    // Ensure the command requires this subsystem
    if (!defaultCommand.getRequirements().has(this)) {
      throw new Error(`Default command ${defaultCommand.getName()} must require subsystem ${this.constructor.name}`);
    }

    this.m_defaultCommand = defaultCommand;
  }

  /**
   * Gets the current command for this subsystem.
   * 
   * @return The current command, or null if none is running
   */
  public getCurrentCommand(): Command | null {
    return this.m_currentCommand;
  }

  /**
   * Sets the current command for this subsystem.
   * This is used by the CommandScheduler and should not be called directly.
   * 
   * @param currentCommand The command to set as current
   */
  public setCurrentCommand(currentCommand: Command | null): void {
    this.m_currentCommand = currentCommand;
  }

  /**
   * Periodic method that is called by the CommandScheduler.
   * Override this to implement subsystem-specific periodic behavior.
   */
  public periodic(): void {}

  /**
   * Register any simulation-specific behavior for this subsystem.
   * Override this to implement subsystem-specific simulation behavior.
   */
  public simulationPeriodic(): void {}

  /**
   * Resets this subsystem to a known state.
   * Override this to implement subsystem-specific reset behavior.
   */
  public reset(): void {}
}

// Import at the end to avoid circular dependencies
import { Command } from './Command';
import { CommandScheduler } from './CommandScheduler';
