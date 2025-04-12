# wpilibts Examples

This directory contains example robot programs that demonstrate how to use the wpilibts library.

## Running Examples

You can run any example using the provided run-example.js script:

```bash
node run-example.js <ExampleName>
```

Or using the npm script:

```bash
npm run example <ExampleName>
```

## Examples

### BasicRobot.ts

A simple robot example that demonstrates the basic structure of a robot program using the TimedRobot class. It shows:

- How to override the various lifecycle methods (init, periodic, exit)
- How to handle different robot modes (disabled, autonomous, teleop, test)
- How to use the robot's periodic timing

### DrivetrainRobot.ts

A more advanced example that demonstrates a simple differential drivetrain. It shows:

- How to create and use motor controllers
- How to implement a differential drive system
- How to handle joystick input
- How to create a simple autonomous routine
- How to implement test mode functionality

### DriverStationExample.ts

A comprehensive example that demonstrates how to use the DriverStation class with WebSocket integration. It shows:

- How to initialize the Driver Station communication
- How to handle robot mode changes (enabled/disabled, autonomous/teleop/test)
- How to read joystick input from the Driver Station
- How to implement E-Stop functionality

This example works with the DriverStationClient.html web interface. To run this example:

1. Start the robot program:
   ```bash
   node run-example.js DriverStationExample
   ```

2. Open the DriverStationClient.html file in your web browser

For detailed instructions, see [DriverStationExample.md](./DriverStationExample.md)

### SimulationExample.ts

A simulation example that demonstrates how to use the simulation features of WPILib, including HALSim and NetworkTables. It shows:

- How to initialize and use simulated devices (motors, encoders, sensors)
- How to communicate with NetworkTables
- How to update simulated sensors based on robot state
- How to visualize the robot's state in a web-based UI

This example works with the SimulationUI.html web interface. To run this example:

1. Start the robot program and open the UI with a single command:
   ```bash
   npm run simulation
   ```

Or manually:

1. Start the robot program:
   ```bash
   node run-example.js SimulationExample
   ```

2. Open the SimulationUI.html file in your web browser

For detailed instructions, see [SimulationExample.md](./SimulationExample.md)

### SimpleRobot.ts

A simple robot project that demonstrates the basic structure of a robot program.

### MinimalRobot.ts

A minimal robot project that can be run in simulation without using NetworkTables or starting a server.

### MinimalRobotWithDS.ts

A minimal robot project that uses a custom driver station.

### SimulationRobot.ts

A robot project that can be run in simulation with NetworkTables.

### NT4BridgeExample.ts

A simple example that demonstrates how to use the NetworkTables 4 bridge to connect to external NetworkTables clients like Shuffleboard and OutlineViewer.

### NT4BridgeRobot.ts

A complete robot example that demonstrates how to use the NetworkTables 4 bridge with a robot simulation, allowing bidirectional communication with external NetworkTables clients.

## Simulation Framework Examples

### MinimalSimulationUI.html

A simple HTML UI that can be used to control a robot in simulation.

### MinimalSimulationServer.js

A simple WebSocket server that can communicate with the MinimalSimulationUI.html.

### MinimalSimulationRobot.js

A simple robot implementation that can communicate with the MinimalSimulationServer.js.

### Running the Minimal Simulation Framework

To run the minimal simulation framework:

1. Start the WebSocket server:

```bash
node examples/MinimalSimulationServer.js
```

2. Open the UI in a web browser:

```
file:///path/to/examples/MinimalSimulationUI.html
```

3. Start the robot program:

```bash
node examples/MinimalSimulationRobot.js
```

4. Use the UI to control the robot:
   - Click the "Enable" button to enable the robot
   - Click the "Teleop", "Autonomous", or "Test" buttons to switch modes
   - Click the "Disable" button to disable the robot

For detailed instructions, see [MinimalSimulationFramework.md](./MinimalSimulationFramework.md)

## Documentation

### [RunningInSimulation.md](./RunningInSimulation.md)

A comprehensive guide on how to run any TypeScript robot project in simulation, with or without external NetworkTables clients.

### [ExternalNetworkTables.md](./ExternalNetworkTables.md)

A detailed guide on how to connect your TypeScript robot projects to external NetworkTables clients like Shuffleboard and OutlineViewer.

## Creating Your Own Robot Program

To create your own robot program:

1. Create a new TypeScript file
2. Import the necessary classes from wpilibts
3. Create a class that extends TimedRobot
4. Override the necessary methods for your robot's functionality
5. Call RobotBase.main() with your robot class

Example:

```typescript
import { TimedRobot, RobotBase } from '@wpilibjs/wpilibts';

class MyRobot extends TimedRobot {
  public override robotInit(): void {
    console.log('Robot initialized!');
  }

  public override teleopPeriodic(): void {
    // Your teleop code here
  }
}

// Start the robot program
if (require.main === module) {
  RobotBase.main(MyRobot);
}
```
