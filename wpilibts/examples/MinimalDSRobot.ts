/**
 * Minimal robot project that uses a custom driver station server.
 * 
 * This robot project demonstrates how to create a robot that can be run in simulation
 * using a custom driver station server.
 */
import { TimedRobot, RobotBase } from '../src';
import { MinimalDSWebSocketServer, DSMessageType } from './MinimalDSWebSocketServer';

/**
 * Minimal robot project that uses a custom driver station server.
 */
export class MinimalDSRobot extends TimedRobot {
  private counter: number = 0;
  private dsServer: MinimalDSWebSocketServer;
  private enabled: boolean = false;
  private autonomous: boolean = false;
  private test: boolean = false;

  /**
   * Constructor for MinimalDSRobot.
   */
  constructor() {
    super();
    this.dsServer = MinimalDSWebSocketServer.getInstance();
    
    // Set up event listeners for WebSocket messages
    this.dsServer.on('message', (message: any) => {
      if (message.type === DSMessageType.CONTROL_WORD) {
        this.enabled = message.data.enabled;
        this.autonomous = message.data.autonomous;
        this.test = message.data.test;
      }
    });
    
    // Start the WebSocket server
    this.dsServer.start();
  }

  /**
   * This function is run when the robot is first started up.
   */
  public override robotInit(): void {
    console.log('Robot initialized!');
  }

  /**
   * This function is called every robot packet, no matter the mode.
   */
  public override robotPeriodic(): void {
    this.counter++;
    if (this.counter % 50 === 0) {
      console.log(`Robot running for ${this.counter * this.getPeriod()} seconds`);
      console.log(`Robot state: enabled=${this.enabled}, autonomous=${this.autonomous}, test=${this.test}`);
      
      // Send robot state to clients
      this.dsServer.sendMessage({
        type: DSMessageType.ROBOT_STATE,
        data: {
          enabled: this.enabled,
          autonomous: this.autonomous,
          test: this.test,
          time: this.counter * this.getPeriod()
        }
      });
    }
  }

  /**
   * This function is called once each time the robot enters Disabled mode.
   */
  public override disabledInit(): void {
    console.log('Disabled mode initialized');
  }

  /**
   * This function is called periodically during Disabled mode.
   */
  public override disabledPeriodic(): void {
    // Nothing to do here
  }

  /**
   * This function is called once each time the robot enters Autonomous mode.
   */
  public override autonomousInit(): void {
    console.log('Autonomous mode initialized');
  }

  /**
   * This function is called periodically during Autonomous mode.
   */
  public override autonomousPeriodic(): void {
    console.log('Autonomous mode running');
  }

  /**
   * This function is called once each time the robot enters Teleop mode.
   */
  public override teleopInit(): void {
    console.log('Teleop mode initialized');
  }

  /**
   * This function is called periodically during Teleop mode.
   */
  public override teleopPeriodic(): void {
    console.log('Teleop mode running');
  }

  /**
   * This function is called once each time the robot enters Test mode.
   */
  public override testInit(): void {
    console.log('Test mode initialized');
  }

  /**
   * This function is called periodically during Test mode.
   */
  public override testPeriodic(): void {
    console.log('Test mode running');
  }

  /**
   * This function is called once each time the robot enters Simulation mode.
   */
  public override simulationInit(): void {
    console.log('Simulation mode initialized');
  }

  /**
   * This function is called periodically during Simulation mode.
   */
  public override simulationPeriodic(): void {
    console.log('Simulation mode running');
  }
}

// Start the robot program
if (require.main === module) {
  RobotBase.main(MinimalDSRobot);
}
