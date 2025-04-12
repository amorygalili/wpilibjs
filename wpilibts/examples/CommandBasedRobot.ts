import {
  TimedRobot,
  RobotBase,
  Command,
  CommandScheduler,
  Subsystem,
  InstantCommand,
  RunCommand,
  SequentialCommandGroup,
  ParallelCommandGroup,
  WaitCommand,
  JoystickButton
} from '../src';

/**
 * A simple drivetrain subsystem.
 */
class DriveSubsystem extends Subsystem {
  private m_leftSpeed: number = 0;
  private m_rightSpeed: number = 0;

  /**
   * Creates a new DriveSubsystem.
   */
  constructor() {
    super();
  }

  /**
   * Sets the speeds of the drivetrain.
   *
   * @param leftSpeed The speed of the left side (-1 to 1)
   * @param rightSpeed The speed of the right side (-1 to 1)
   */
  public drive(leftSpeed: number, rightSpeed: number): void {
    this.m_leftSpeed = Math.max(-1, Math.min(1, leftSpeed));
    this.m_rightSpeed = Math.max(-1, Math.min(1, rightSpeed));
  }

  /**
   * Stops the drivetrain.
   */
  public stop(): void {
    this.m_leftSpeed = 0;
    this.m_rightSpeed = 0;
  }

  /**
   * Gets the current speed of the left side.
   *
   * @return The current speed of the left side
   */
  public getLeftSpeed(): number {
    return this.m_leftSpeed;
  }

  /**
   * Gets the current speed of the right side.
   *
   * @return The current speed of the right side
   */
  public getRightSpeed(): number {
    return this.m_rightSpeed;
  }

  /**
   * Periodic method that is called by the CommandScheduler.
   */
  public override periodic(): void {
    // In a real implementation, this would set motor outputs
    console.log(`Drive: Left=${this.m_leftSpeed.toFixed(2)}, Right=${this.m_rightSpeed.toFixed(2)}`);
  }
}

/**
 * A simple elevator subsystem.
 */
class ElevatorSubsystem extends Subsystem {
  private m_position: number = 0;
  private m_speed: number = 0;

  /**
   * Creates a new ElevatorSubsystem.
   */
  constructor() {
    super();
  }

  /**
   * Sets the speed of the elevator.
   *
   * @param speed The speed of the elevator (-1 to 1)
   */
  public setSpeed(speed: number): void {
    this.m_speed = Math.max(-1, Math.min(1, speed));
  }

  /**
   * Stops the elevator.
   */
  public stop(): void {
    this.m_speed = 0;
  }

  /**
   * Gets the current position of the elevator.
   *
   * @return The current position of the elevator
   */
  public getPosition(): number {
    return this.m_position;
  }

  /**
   * Periodic method that is called by the CommandScheduler.
   */
  public override periodic(): void {
    // Simulate elevator movement
    this.m_position += this.m_speed * 0.02;

    // In a real implementation, this would set motor outputs
    console.log(`Elevator: Position=${this.m_position.toFixed(2)}, Speed=${this.m_speed.toFixed(2)}`);
  }
}

/**
 * A command to drive the robot forward for a specified time.
 */
class DriveForwardCommand extends Command {
  private m_drive: DriveSubsystem;
  private m_duration: number;
  private m_startTime: number = 0;

  /**
   * Creates a new DriveForwardCommand.
   *
   * @param drive The drive subsystem
   * @param duration The duration to drive forward, in seconds
   */
  constructor(drive: DriveSubsystem, duration: number) {
    super();
    this.m_drive = drive;
    this.m_duration = duration;
    this.addRequirements(drive);
  }

  /**
   * Initializes the command.
   */
  public override initialize(): void {
    this.m_startTime = Date.now() / 1000;
    console.log('DriveForwardCommand initialized');
  }

  /**
   * Executes the command.
   */
  public override execute(): void {
    this.m_drive.drive(0.5, 0.5);
  }

  /**
   * Returns whether the command is finished.
   *
   * @return True if the specified duration has passed
   */
  public override isFinished(): boolean {
    return (Date.now() / 1000) - this.m_startTime >= this.m_duration;
  }

  /**
   * Ends the command.
   *
   * @param interrupted Whether the command was interrupted
   */
  public override end(interrupted: boolean): void {
    this.m_drive.stop();
    console.log(`DriveForwardCommand ended, interrupted: ${interrupted}`);
  }
}

/**
 * A command to move the elevator to a specified position.
 */
class MoveElevatorCommand extends Command {
  private m_elevator: ElevatorSubsystem;
  private m_targetPosition: number;
  private m_speed: number;

  /**
   * Creates a new MoveElevatorCommand.
   *
   * @param elevator The elevator subsystem
   * @param targetPosition The target position
   * @param speed The speed to move the elevator
   */
  constructor(elevator: ElevatorSubsystem, targetPosition: number, speed: number) {
    super();
    this.m_elevator = elevator;
    this.m_targetPosition = targetPosition;
    this.m_speed = Math.abs(speed);
    this.addRequirements(elevator);
  }

  /**
   * Initializes the command.
   */
  public override initialize(): void {
    console.log(`MoveElevatorCommand initialized, target: ${this.m_targetPosition}`);
  }

  /**
   * Executes the command.
   */
  public override execute(): void {
    const currentPosition = this.m_elevator.getPosition();
    if (currentPosition < this.m_targetPosition) {
      this.m_elevator.setSpeed(this.m_speed);
    } else if (currentPosition > this.m_targetPosition) {
      this.m_elevator.setSpeed(-this.m_speed);
    } else {
      this.m_elevator.stop();
    }
  }

  /**
   * Returns whether the command is finished.
   *
   * @return True if the elevator is at the target position
   */
  public override isFinished(): boolean {
    const currentPosition = this.m_elevator.getPosition();
    return Math.abs(currentPosition - this.m_targetPosition) < 0.1;
  }

  /**
   * Ends the command.
   *
   * @param interrupted Whether the command was interrupted
   */
  public override end(interrupted: boolean): void {
    this.m_elevator.stop();
    console.log(`MoveElevatorCommand ended, interrupted: ${interrupted}`);
  }
}

/**
 * A command-based robot example.
 */
class CommandBasedRobot extends TimedRobot {
  private m_drive: DriveSubsystem = new DriveSubsystem();
  private m_elevator: ElevatorSubsystem = new ElevatorSubsystem();
  private m_autonomousCommand: Command | null = null;
  private m_counter: number = 0;

  /**
   * This function is run when the robot is first started up.
   */
  public override robotInit(): void {
    console.log('Robot initialized!');

    // Create the autonomous command
    this.m_autonomousCommand = new SequentialCommandGroup(
      new DriveForwardCommand(this.m_drive, 2),
      // First move the elevator
      new MoveElevatorCommand(this.m_elevator, 5, 0.5),
      // Then wait and drive forward again
      new WaitCommand(1),
      new DriveForwardCommand(this.m_drive, 1),
      new InstantCommand(() => {
        console.log('Autonomous sequence completed!');
      })
    );

    // Set default commands
    this.m_drive.setDefaultCommand(
      new RunCommand(() => {
        // In a real implementation, this would use joystick inputs
        const time = this.m_counter * this.getPeriod();
        const leftSpeed = Math.sin(time) * 0.5;
        const rightSpeed = Math.cos(time) * 0.5;
        this.m_drive.drive(leftSpeed, rightSpeed);
      }, this.m_drive)
    );
  }

  /**
   * This function is called periodically in all robot modes.
   */
  public override robotPeriodic(): void {
    this.m_counter++;

    // Run the command scheduler
    CommandScheduler.getInstance().run();
  }

  /**
   * This function is called once when the robot enters autonomous mode.
   */
  public override autonomousInit(): void {
    console.log('Autonomous mode started!');

    if (this.m_autonomousCommand !== null) {
      this.m_autonomousCommand.schedule();
    }
  }

  /**
   * This function is called once when the robot enters teleop mode.
   */
  public override teleopInit(): void {
    console.log('Teleop mode started!');

    // Cancel the autonomous command if it's still running
    if (this.m_autonomousCommand !== null && this.m_autonomousCommand.isScheduled()) {
      this.m_autonomousCommand.cancel();
    }
  }

  /**
   * This function is called once when the robot is disabled.
   */
  public override disabledInit(): void {
    console.log('Robot disabled!');
  }
}

// Start the robot program
if (require.main === module) {
  RobotBase.main(CommandBasedRobot);
}
