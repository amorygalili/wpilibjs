/**
 * Simple robot program that uses the WPILib NetworkTables implementation directly.
 */
import { TimedRobot, RobotBase } from '../src';
import { NetworkTableInstance } from '../src/networktables/NetworkTableInstance';

/**
 * Simple robot that publishes data to NetworkTables.
 */
class SimpleRobotNT extends TimedRobot {
  // Counter for updating values
  private counter = 0;
  
  // NetworkTables instance
  private ntInstance = NetworkTableInstance.getDefault();
  
  // NetworkTables entries
  private booleanEntry = this.ntInstance.getTable('SmartDashboard').getEntry('Boolean');
  private numberEntry = this.ntInstance.getTable('SmartDashboard').getEntry('Number');
  private stringEntry = this.ntInstance.getTable('SmartDashboard').getEntry('String');
  
  /**
   * This function is run when the robot is first started up.
   */
  public override robotInit(): void {
    console.log('Robot initialized!');
    
    // Start NetworkTables server
    this.ntInstance.startServer();
    console.log('NetworkTables server started');
    
    // Initialize values
    this.booleanEntry.setBoolean(false);
    this.numberEntry.setDouble(0);
    this.stringEntry.setString('Hello OutlineViewer!');
  }
  
  /**
   * This function is called every robot packet, no matter the mode.
   */
  public override robotPeriodic(): void {
    // Update counter
    this.counter++;
    
    // Update values
    this.booleanEntry.setBoolean(this.counter % 2 === 0);
    this.numberEntry.setDouble(this.counter);
    this.stringEntry.setString(`Hello OutlineViewer! Counter: ${this.counter}`);
    
    if (this.counter % 10 === 0) {
      console.log(`Updated values (counter: ${this.counter})`);
      
      // Print connected clients
      const connections = this.ntInstance.getConnections();
      console.log(`Connected clients: ${connections.length}`);
      for (const conn of connections) {
        console.log(`- ${conn.remote_ip}:${conn.remote_port} (${conn.protocol_version})`);
      }
    }
  }
}

// Start the robot program
if (require.main === module) {
  RobotBase.main(SimpleRobotNT);
}
