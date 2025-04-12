# Using External NetworkTables Clients with WPILib TypeScript

This guide explains how to connect your TypeScript robot projects to external NetworkTables clients like Shuffleboard and OutlineViewer.

## Overview

WPILib TypeScript includes support for connecting to external NetworkTables clients through a bridge that connects our internal NetworkTables implementation to an external NetworkTables server. This allows you to:

1. Visualize your robot's data in Shuffleboard
2. Monitor and modify NetworkTables values using OutlineViewer
3. Create custom dashboards that communicate with your robot

## Prerequisites

- WPILib TypeScript installed
- Shuffleboard or OutlineViewer installed (part of the WPILib installation)

## Running a Robot with External NetworkTables Clients

We provide a script that makes it easy to run any robot project with external NetworkTables clients:

```bash
node run-with-external-nt.js [robot-class-path] [nt-server-url]
```

Arguments:
- `robot-class-path`: The path to your robot class file (default: `NT4BridgeRobot`)
- `nt-server-url`: The URL of the NetworkTables server (default: `ws://localhost:5810`)

Example:
```bash
node run-with-external-nt.js examples/NT4BridgeRobot.ts ws://localhost:5810
```

## Using Shuffleboard

1. Start Shuffleboard
2. Shuffleboard will automatically start a NetworkTables server on port 5810
3. Run your robot with the external NetworkTables script:
   ```bash
   node run-with-external-nt.js examples/NT4BridgeRobot.ts
   ```
4. Your robot's NetworkTables data will appear in Shuffleboard

## Using OutlineViewer

1. Start OutlineViewer
2. Configure OutlineViewer to act as a server (if not already)
3. Run your robot with the external NetworkTables script:
   ```bash
   node run-with-external-nt.js examples/NT4BridgeRobot.ts
   ```
4. Your robot's NetworkTables data will appear in OutlineViewer

## Example: NT4BridgeRobot

We provide an example robot that demonstrates how to use the NetworkTables bridge:

```bash
node run-with-external-nt.js examples/NT4BridgeRobot.ts
```

This example:
- Connects to an external NetworkTables server
- Publishes various data types to NetworkTables
- Listens for commands from external clients
- Simulates a simple robot with motors and sensors

## Example: CustomPortRobot

We also provide an example robot that uses a custom port for the driver station to avoid port conflicts:

```bash
node run-with-external-nt.js examples/CustomPortRobot.ts
```

This example:
- Uses a custom driver station implementation that runs on port 8735 instead of 1735
- Connects to an external NetworkTables server
- Publishes various data types to NetworkTables
- Simulates a simple robot with motors and sensors

## Example: RobotDashboard.html

We provide a simple HTML dashboard that can be used to control the robot:

1. Start the NetworkTables server:
   ```bash
   node examples/NT4Server.js
   ```

2. Start the robot:
   ```bash
   node run-with-external-nt.js examples/CustomPortRobot.ts
   ```

3. Open the dashboard in a browser:
   ```bash
   open examples/RobotDashboard.html
   ```

The dashboard allows you to:
- Enable/disable the robot
- Switch between teleop, autonomous, and test modes
- Control the robot with a slider
- View the robot's state and sensor values

## Creating Your Own Robot with External NetworkTables Support

To add external NetworkTables support to your own robot project:

1. Import the NT4Bridge and NT4Client classes:
   ```typescript
   import { NT4Bridge } from '../src/network/NT4Bridge';
   import { NT4Client } from '../src/network/NT4Client';
   ```

2. Create a client and bridge in your robot class:
   ```typescript
   private ntClient: NT4Client = new NT4Client('ws://localhost:5810');
   private ntBridge: NT4Bridge = new NT4Bridge(this.ntClient);
   ```

3. Connect to the NetworkTables server in robotInit:
   ```typescript
   public override robotInit(): void {
     this.ntBridge.connect().then(() => {
       console.log('Connected to NetworkTables server');
     }).catch((error) => {
       console.error('Failed to connect to NetworkTables server:', error);
     });
   }
   ```

4. Use NetworkTables as usual:
   ```typescript
   private counter = networkTables.getNumber('Robot/Counter', 0);

   public override robotPeriodic(): void {
     const currentCount = this.counter.getValue() || 0;
     this.counter.setValue(currentCount + 1);
   }
   ```

## Troubleshooting

### Connection Issues

If you're having trouble connecting to the NetworkTables server:

1. Make sure the server is running before starting your robot
2. Check that you're using the correct port (default is 5810)
3. If using a remote server, make sure the hostname is correct and network connectivity is available

### Data Not Appearing

If your data isn't appearing in Shuffleboard or OutlineViewer:

1. Check that your robot is successfully connecting to the server (look for "Connected to NetworkTables server" in the console)
2. Verify that you're publishing data with the correct types
3. Try refreshing the client or restarting the connection

## Advanced Usage

### Custom NetworkTables Server URL

You can specify a custom NetworkTables server URL:

```bash
node run-with-external-nt.js examples/NT4BridgeRobot.ts ws://192.168.1.100:5810
```

### Running on a Robot

When running on a real robot, you'll typically want to connect to a NetworkTables server running on the driver station computer:

```typescript
private ntClient: NT4Client = new NT4Client('ws://10.TE.AM.2:5810');
```

Replace `TE.AM` with your team number (e.g., `10.12.34.2` for team 1234).

## Conclusion

With the NetworkTables bridge, you can easily connect your TypeScript robot projects to external NetworkTables clients like Shuffleboard and OutlineViewer. This allows you to visualize your robot's data, monitor and modify NetworkTables values, and create custom dashboards.
