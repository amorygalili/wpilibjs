# Using NetworkTables with WPILib TypeScript

This guide explains how to use NetworkTables with WPILib TypeScript robot projects.

## Overview

NetworkTables is a distributed key-value store that allows different parts of a robot system to communicate with each other. It's commonly used to:

1. Share data between the robot code and driver station
2. Visualize robot data in dashboards like Shuffleboard and OutlineViewer
3. Allow operators to configure robot parameters during a match

WPILib TypeScript uses the `ntcore-client` package to provide NetworkTables functionality.

## Basic Usage

### Importing NetworkTables

```typescript
// Import directly from ntcore-client
import { NetworkTableInstance } from 'ntcore-client';
```

### Getting the Default Instance

```typescript
// Get the default NetworkTables instance
const ntInstance = NetworkTableInstance.getDefault();
```

### Starting a Server

```typescript
// Start a NetworkTables server on the default port (5810)
ntInstance.startServer();

// Or specify a custom port
ntInstance.startServer(5810);
```

### Connecting to a Server

```typescript
// Connect to a NetworkTables server
ntInstance.startClient4('My-Client', 'localhost', 5810);
```

### Publishing Data

```typescript
// Get a table
const table = ntInstance.getTable('MyTable');

// Get entries
const booleanEntry = table.getEntry('Boolean');
const numberEntry = table.getEntry('Number');
const stringEntry = table.getEntry('String');

// Set values
booleanEntry.setBoolean(true);
numberEntry.setDouble(123.456);
stringEntry.setString('Hello, NetworkTables!');
```

### Reading Data

```typescript
// Get values
const boolValue = booleanEntry.getBoolean(false); // Default value if not set
const numberValue = numberEntry.getDouble(0);
const stringValue = stringEntry.getString('');
```

## Using NetworkTables in a Robot Project

Here's a simple example of using NetworkTables in a TimedRobot project:

```typescript
import { TimedRobot, RobotBase } from '../src';
import { NetworkTableInstance } from 'ntcore-client';

class MyRobot extends TimedRobot {
  // Get the default NetworkTables instance
  private ntInstance = NetworkTableInstance.getDefault();

  // Get a table for our robot data
  private robotTable = this.ntInstance.getTable('Robot');

  // Create entries for our robot data
  private counterEntry = this.robotTable.getEntry('Counter');
  private enabledEntry = this.robotTable.getEntry('Enabled');

  // Counter for periodic updates
  private counter = 0;

  /**
   * This function is run when the robot is first started up.
   */
  public override robotInit(): void {
    console.log('Robot initialized!');

    // Start the NetworkTables server
    this.ntInstance.startServer();
    console.log('NetworkTables server started');

    // Initialize values
    this.counterEntry.setInteger(0);
    this.enabledEntry.setBoolean(false);
  }

  /**
   * This function is called every robot packet, no matter the mode.
   */
  public override robotPeriodic(): void {
    // Update counter
    this.counter++;
    this.counterEntry.setInteger(this.counter);

    // Update robot state
    this.enabledEntry.setBoolean(this.isEnabled());
  }
}

// Start the robot program
if (require.main === module) {
  RobotBase.main(MyRobot);
}
```

## Using NetworkTables with OutlineViewer

OutlineViewer is a simple tool for viewing and editing NetworkTables values. To use it with your robot project:

1. Start OutlineViewer and configure it as a server
2. Connect your robot code to the OutlineViewer server
3. Publish data from your robot code
4. View and edit the data in OutlineViewer

Here's an example of connecting to OutlineViewer:

```typescript
// Connect to OutlineViewer
ntInstance.startClient4('My-Robot', 'localhost', 5810);
```

## Examples

- [SimpleNetworkTablesRobot.ts](./SimpleNetworkTablesRobot.ts): A simple robot example that demonstrates how to use NetworkTables
- [OutlineViewerRobot.ts](./OutlineViewerRobot.ts): An example that demonstrates how to use NetworkTables with OutlineViewer

## Running the Examples

To run the SimpleNetworkTablesRobot example:

```bash
npx ts-node examples/SimpleNetworkTablesRobot.ts
```

To run the OutlineViewerRobot example:

```bash
node run-outlineviewer-robot.js
```

## Additional Resources

- [ntcore-client Documentation](https://github.com/wpilibsuite/ntcore-ts)
- [NetworkTables Documentation](https://docs.wpilib.org/en/stable/docs/software/networktables/index.html)
