import { TimedRobot } from '../src/TimedRobot';
import { RobotBase } from '../src/RobotBase';

/**
 * A simple motor controller interface.
 */
interface MotorController {
  set(speed: number): void;
  get(): number;
  disable(): void;
}

/**
 * A simple implementation of a motor controller for simulation.
 */
class SimMotorController implements MotorController {
  private speed: number = 0;
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  public set(speed: number): void {
    this.speed = Math.max(-1, Math.min(1, speed));
    console.log(`Motor ${this.name} set to ${this.speed}`);
  }

  public get(): number {
    return this.speed;
  }

  public disable(): void {
    this.speed = 0;
    console.log(`Motor ${this.name} disabled`);
  }
}

/**
 * A simple differential drive implementation.
 */
class DifferentialDrive {
  private leftMotor: MotorController;
  private rightMotor: MotorController;

  constructor(leftMotor: MotorController, rightMotor: MotorController) {
    this.leftMotor = leftMotor;
    this.rightMotor = rightMotor;
  }

  /**
   * Arcade drive method for differential drive platform.
   * 
   * @param xSpeed The speed at which the robot should drive forward/backward (-1.0 to 1.0)
   * @param zRotation The rotation rate of the robot around the Z axis (-1.0 to 1.0)
   */
  public arcadeDrive(xSpeed: number, zRotation: number): void {
    xSpeed = Math.max(-1, Math.min(1, xSpeed));
    zRotation = Math.max(-1, Math.min(1, zRotation));

    let leftMotorOutput: number;
    let rightMotorOutput: number;

    const maxInput = Math.max(Math.abs(xSpeed), Math.abs(zRotation));
    if (xSpeed >= 0.0) {
      // First quadrant, else second quadrant
      if (zRotation >= 0.0) {
        leftMotorOutput = maxInput;
        rightMotorOutput = xSpeed - zRotation;
      } else {
        leftMotorOutput = xSpeed + zRotation;
        rightMotorOutput = maxInput;
      }
    } else {
      // Third quadrant, else fourth quadrant
      if (zRotation >= 0.0) {
        leftMotorOutput = xSpeed + zRotation;
        rightMotorOutput = -maxInput;
      } else {
        leftMotorOutput = -maxInput;
        rightMotorOutput = xSpeed - zRotation;
      }
    }

    this.leftMotor.set(leftMotorOutput);
    this.rightMotor.set(rightMotorOutput);
  }

  /**
   * Tank drive method for differential drive platform.
   * 
   * @param leftSpeed The speed for the left side of the drivetrain (-1.0 to 1.0)
   * @param rightSpeed The speed for the right side of the drivetrain (-1.0 to 1.0)
   */
  public tankDrive(leftSpeed: number, rightSpeed: number): void {
    this.leftMotor.set(Math.max(-1, Math.min(1, leftSpeed)));
    this.rightMotor.set(Math.max(-1, Math.min(1, rightSpeed)));
  }

  /**
   * Stop the drivetrain motors.
   */
  public stopMotors(): void {
    this.leftMotor.set(0);
    this.rightMotor.set(0);
  }
}

/**
 * A simple joystick interface for simulation.
 */
class SimJoystick {
  private x: number = 0;
  private y: number = 0;
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Set the X axis value for simulation.
   */
  public setX(value: number): void {
    this.x = Math.max(-1, Math.min(1, value));
  }

  /**
   * Set the Y axis value for simulation.
   */
  public setY(value: number): void {
    this.y = Math.max(-1, Math.min(1, value));
  }

  /**
   * Get the X axis value.
   */
  public getX(): number {
    return this.x;
  }

  /**
   * Get the Y axis value.
   */
  public getY(): number {
    return this.y;
  }
}

/**
 * A robot example that demonstrates a simple drivetrain.
 */
class DrivetrainRobot extends TimedRobot {
  private leftMotor: MotorController;
  private rightMotor: MotorController;
  private drive: DifferentialDrive;
  private joystick: SimJoystick;
  private counter: number = 0;
  
  /**
   * This function is run when the robot is first started up.
   */
  public override robotInit(): void {
    console.log('Robot initialized!');
    
    // Initialize the drivetrain
    this.leftMotor = new SimMotorController('Left');
    this.rightMotor = new SimMotorController('Right');
    this.drive = new DifferentialDrive(this.leftMotor, this.rightMotor);
    
    // Initialize the joystick
    this.joystick = new SimJoystick('Driver');
  }
  
  /**
   * This function is called periodically in all robot modes.
   */
  public override robotPeriodic(): void {
    this.counter++;
    if (this.counter % 50 === 0) {
      console.log(`Robot running for ${this.counter * this.getPeriod()} seconds`);
    }
  }
  
  /**
   * This function is called once when the robot enters disabled mode.
   */
  public override disabledInit(): void {
    console.log('Robot disabled!');
    this.drive.stopMotors();
  }
  
  /**
   * This function is called once when the robot enters autonomous mode.
   */
  public override autonomousInit(): void {
    console.log('Autonomous mode started!');
  }
  
  /**
   * This function is called periodically when the robot is in autonomous mode.
   */
  public override autonomousPeriodic(): void {
    // Simple autonomous routine: drive forward for 2 seconds, then stop
    const autoTime = this.counter * this.getPeriod();
    if (autoTime < 2.0) {
      this.drive.arcadeDrive(0.5, 0);
    } else {
      this.drive.stopMotors();
    }
  }
  
  /**
   * This function is called once when the robot enters teleop mode.
   */
  public override teleopInit(): void {
    console.log('Teleop mode started!');
  }
  
  /**
   * This function is called periodically when the robot is in teleop mode.
   */
  public override teleopPeriodic(): void {
    // Simulate joystick input
    const time = this.counter * this.getPeriod();
    this.joystick.setY(Math.sin(time) * 0.5); // Forward/backward
    this.joystick.setX(Math.cos(time * 2) * 0.3); // Rotation
    
    // Drive the robot with arcade drive
    this.drive.arcadeDrive(-this.joystick.getY(), this.joystick.getX());
  }
  
  /**
   * This function is called once when the robot enters test mode.
   */
  public override testInit(): void {
    console.log('Test mode started!');
  }
  
  /**
   * This function is called periodically when the robot is in test mode.
   */
  public override testPeriodic(): void {
    // Test each motor individually
    const time = this.counter * this.getPeriod();
    const motorValue = Math.sin(time);
    
    if (time % 10 < 5) {
      // Test left motor
      this.leftMotor.set(motorValue);
      this.rightMotor.set(0);
      if (this.counter % 25 === 0) {
        console.log(`Testing left motor: ${motorValue}`);
      }
    } else {
      // Test right motor
      this.leftMotor.set(0);
      this.rightMotor.set(motorValue);
      if (this.counter % 25 === 0) {
        console.log(`Testing right motor: ${motorValue}`);
      }
    }
  }
  
  /**
   * This function is called once when the robot enters simulation mode.
   */
  public override simulationInit(): void {
    console.log('Simulation mode started!');
  }
  
  /**
   * This function is called periodically when the robot is in simulation mode.
   */
  public override simulationPeriodic(): void {
    // Simulation code would go here
  }
}

// Start the robot program
if (require.main === module) {
  RobotBase.main(DrivetrainRobot);
}
