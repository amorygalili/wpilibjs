# Running TypeScript Robot Projects in Simulation

This guide explains how to run any TypeScript robot project in simulation, with or without external NetworkTables clients.

## Overview

WPILib TypeScript provides several ways to run robot projects in simulation:

1. **Basic Simulation**: Run a robot project with the built-in simulation framework
2. **External NetworkTables**: Run a robot project with external NetworkTables clients like Shuffleboard and OutlineViewer
3. **Custom Simulation**: Create a custom simulation environment for your robot

## Basic Simulation

To run a robot project with the built-in simulation framework:

```bash
node run-robot-simulation.js <robot-class-path>
```

Example:
```bash
node run-robot-simulation.js examples/SimulationRobot
```

This will:
1. Build the project if needed
2. Start the robot in simulation mode
3. Open the SimulationUI.html in your default browser

The SimulationUI provides a simple interface to:
- Enable/disable the robot
- Switch between teleop, autonomous, and test modes
- Visualize robot state

## Running with External NetworkTables Clients

To run a robot project with external NetworkTables clients like Shuffleboard and OutlineViewer:

```bash
node run-with-external-nt.js <robot-class-path> [nt-server-url]
```

Example:
```bash
node run-with-external-nt.js examples/NT4BridgeRobot.ts ws://localhost:5810
```

This will:
1. Build the project if needed
2. Start the robot in simulation mode
3. Connect to the specified NetworkTables server

For more details, see [ExternalNetworkTables.md](./ExternalNetworkTables.md).

## Running Any Robot Project in Simulation

You can run any robot project in simulation, even if it wasn't specifically designed for simulation:

1. Make sure your robot class extends `TimedRobot`
2. Use the `run-robot-simulation.js` script:
   ```bash
   node run-robot-simulation.js path/to/MyRobot.ts
   ```

If you want to use external NetworkTables clients with your robot:

1. Make sure your robot class extends `TimedRobot`
2. Use the `run-with-external-nt.js` script:
   ```bash
   node run-with-external-nt.js path/to/MyRobot.ts
   ```

## Creating Simulation-Ready Robot Projects

To make your robot projects work well in simulation:

1. Use the `RobotBase.isSimulation()` method to detect when running in simulation:
   ```typescript
   if (RobotBase.isSimulation()) {
     // Simulation-specific code
   } else {
     // Real robot code
   }
   ```

2. Use NetworkTables to publish robot state:
   ```typescript
   private leftMotor = networkTables.getNumber('Robot/LeftMotor', 0);
   
   public override teleopPeriodic(): void {
     // Update motor speed
     const speed = /* calculate speed */;
     this.leftMotor.setValue(speed);
   }
   ```

3. Implement simulation-specific methods:
   ```typescript
   public override simulationInit(): void {
     console.log('Simulation mode initialized');
   }
   
   public override simulationPeriodic(): void {
     // Update simulated sensors based on actuator outputs
     this.updateSimulation();
   }
   
   private updateSimulation(): void {
     // Simulate robot physics
     const leftSpeed = this.leftMotor.getValue() || 0;
     const rightSpeed = this.rightMotor.getValue() || 0;
     
     // Update position based on motor speeds
     const speed = (leftSpeed + rightSpeed) / 2;
     this.position += speed * 0.02; // 20ms period
     
     // Update simulated sensors
     this.encoder.setValue(this.position * 20);
   }
   ```

## Advanced Simulation

For more advanced simulation needs:

1. Use the `SimHooks` class to control simulation timing:
   ```typescript
   import { SimHooks } from '../src';
   
   // Pause simulation timing
   SimHooks.getInstance().pauseTiming();
   
   // Resume simulation timing
   SimHooks.getInstance().resumeTiming();
   
   // Step simulation by a specific amount of time (in seconds)
   SimHooks.getInstance().stepTiming(0.02);
   ```

2. Use device simulation classes to simulate hardware:
   ```typescript
   import { DigitalInputSim, AnalogInputSim, PWMSim, EncoderSim } from '../src';
   
   // Create simulated devices
   const limitSwitchSim = new DigitalInputSim(0);
   const potentiometerSim = new AnalogInputSim(0);
   const motorSim = new PWMSim(0);
   const encoderSim = new EncoderSim(0, 1);
   
   // Set simulated values
   limitSwitchSim.setValue(true);
   potentiometerSim.setValue(2.5);
   encoderSim.setCount(100);
   ```

3. Create a custom simulation UI:
   - Use the `HALSimWebSocketServer` class to create a WebSocket server for simulation
   - Create an HTML UI that connects to the WebSocket server
   - Use the WebSocket connection to send and receive simulation data

## Troubleshooting

### Simulation Not Starting

If the simulation doesn't start:

1. Check that your robot class extends `TimedRobot`
2. Make sure the robot class path is correct
3. Check for any errors in the console output

### Robot Not Responding to UI

If the robot doesn't respond to the simulation UI:

1. Check that the robot is running in simulation mode
2. Make sure the UI is connected to the correct WebSocket server
3. Check for any errors in the console output

### NetworkTables Issues

If you're having issues with NetworkTables:

1. Make sure the NetworkTables server is running
2. Check that you're using the correct server URL
3. Verify that your robot is publishing data to NetworkTables

## Conclusion

With these tools and techniques, you can run any TypeScript robot project in simulation, with or without external NetworkTables clients. This allows you to test your robot code without a physical robot, making development and debugging much easier.
