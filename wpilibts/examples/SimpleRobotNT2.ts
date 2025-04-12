/**
 * Simple robot program that uses the networkTables API directly.
 */
import { TimedRobot, RobotBase, networkTables } from '../src';

/**
 * Simple robot that publishes data to NetworkTables.
 */
class SimpleRobotNT2 extends TimedRobot {
  // Counter for updating values
  private counter = 0;

  // NetworkTables entries
  private booleanEntry = networkTables.getBoolean('SmartDashboard/Boolean', false);
  private numberEntry = networkTables.getNumber('SmartDashboard/Number', 0);
  private stringEntry = networkTables.getString('SmartDashboard/String', 'Hello OutlineViewer!');

  /**
   * This function is run when the robot is first started up.
   */
  public override robotInit(): void {
    console.log('Robot initialized!');

    // Start NetworkTables server
    networkTables.startServer(5810).then(() => {
      console.log('NetworkTables server started on port 5810');
    }).catch((error) => {
      console.error('Failed to start NetworkTables server:', error);
    });

    // Initialize values
    this.booleanEntry.value = false;
    this.numberEntry.value = 0;
    this.stringEntry.value = 'Hello OutlineViewer!';

    // Print NetworkTables information
    console.log('NetworkTables information:');
    console.log('- Connected:', networkTables.isConnected());
  }

  /**
   * This function is called every robot packet, no matter the mode.
   */
  public override robotPeriodic(): void {
    // Update counter
    this.counter++;

    // Update values
    this.booleanEntry.value = this.counter % 2 === 0;
    this.numberEntry.value = this.counter;
    this.stringEntry.value = `Hello OutlineViewer! Counter: ${this.counter}`;

    if (this.counter % 10 === 0) {
      console.log(`Updated values (counter: ${this.counter})`);
      console.log('- Connected:', networkTables.isConnected());
    }
  }
}

// Start the robot program
if (require.main === module) {
  RobotBase.main(SimpleRobotNT2);
}
