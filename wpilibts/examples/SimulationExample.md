# Simulation Example

This document provides instructions on how to run and use the Simulation example in the WPILib TypeScript implementation.

## Introduction

The Simulation Example demonstrates how to use the simulation features of WPILib, including HALSim and NetworkTables. It simulates a simple robot with a drivetrain and sensors, and shows how to:

- Initialize and use simulated devices (motors, encoders, sensors)
- Communicate with NetworkTables
- Visualize the robot's state in a web-based UI
- Control the robot using a simulated driver station

## Prerequisites

Before running this example, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- A modern web browser (Chrome, Firefox, Edge, etc.)

## Installation

1. Navigate to the wpilibts directory:
   ```
   cd wpilibjs/wpilibts
   ```

2. Install the dependencies:
   ```
   npm install
   ```

3. Build the project:
   ```
   npm run build
   ```

## Running the Example

There are two components to this example:
1. The robot program (server)
2. The simulation UI (web browser)

### Starting the Simulation

The easiest way to run the simulation is to use the provided script:

```
npm run simulation
```

This will:
1. Build the project if needed
2. Start the robot program
3. Open the simulation UI in your default web browser

Alternatively, you can run the example manually:

1. Start the robot program:
   ```
   node run-example.js SimulationExample
   ```

2. Open the SimulationUI.html file in your web browser:
   ```
   examples/SimulationUI.html
   ```

### Using the Simulation UI

The Simulation UI provides a user interface to control and monitor the simulated robot:

#### Robot Controls

- **Enable/Disable**: Use these buttons to enable or disable the robot.
- **Robot Mode**: Switch between Teleop, Autonomous, and Test modes.
- **Joysticks**: Click and drag within the joystick areas to control the robot's motors.
- **Motor Sliders**: Use the sliders to directly control the robot's motors.

#### Robot Status

- **Encoder**: Shows the current encoder count.
- **Limit Switch**: Shows the state of the limit switch (True/False).
- **Potentiometer**: Shows the current potentiometer voltage.
- **Visualization**: Shows a simple visualization of the robot's position and the limit switch state.

#### Log

The log panel shows messages from the simulation UI, including connection status and robot state changes.

## How It Works

### Robot Program

The robot program (`SimulationExample.ts`) demonstrates:

1. Creating and initializing simulated devices:
   ```typescript
   this.leftMotorSim = new PWMSim(0);
   this.rightMotorSim = new PWMSim(1);
   this.encoderSim = new EncoderSim(0);
   this.limitSwitchSim = new DigitalInputSim(0);
   this.potentiometerSim = new AnalogInputSim(0);
   ```

2. Publishing data to NetworkTables:
   ```typescript
   this.leftMotorTopic = networkTables.getNumber('Robot/LeftMotor');
   this.leftMotorTopic.value = 0;
   ```

3. Subscribing to NetworkTables topics:
   ```typescript
   this.leftMotorTopic.on('valueChanged', (value) => {
     this.leftMotorSim.setSpeed(value);
   });
   ```

4. Updating simulated sensors based on robot state:
   ```typescript
   private updateSimulation(): void {
     // Calculate new position and velocity based on motor speeds
     const leftSpeed = this.leftMotorSim.getSpeed();
     const rightSpeed = this.rightMotorSim.getSpeed();
     const averageSpeed = (leftSpeed + rightSpeed) / 2;

     // Simple physics model
     this.velocity = averageSpeed * 5;
     this.position += this.velocity * 0.02;

     // Update encoder count
     this.encoderSim.setCount(Math.round(this.position * 100));
   }
   ```

### Simulation UI

The Simulation UI (`SimulationUI.html`) demonstrates:

1. Connecting to NetworkTables (simulated in this example)
2. Displaying robot state and sensor values
3. Providing controls for the robot (enable/disable, mode selection, joysticks)
4. Visualizing the robot's position and sensor states

## Extending the Example

You can extend this example in several ways:

1. Add more simulated devices (gyros, accelerometers, etc.)
2. Implement more complex robot behavior
3. Enhance the simulation UI with more visualizations
4. Add support for additional NetworkTables topics
5. Implement communication with Shuffleboard or other NetworkTables clients

## Troubleshooting

### Connection Issues

If the Simulation UI cannot connect to the robot program:

1. Ensure the robot program is running
2. Check that no firewall is blocking the connection
3. Verify that port 1735 (NetworkTables) is available
4. Try refreshing the Simulation UI page

### Visualization Issues

If the robot visualization is not updating correctly:

1. Check the browser console for errors
2. Ensure the robot program is publishing the correct values to NetworkTables
3. Verify that the Simulation UI is receiving the correct values

## Additional Resources

- [WPILib Documentation](https://docs.wpilib.org/)
- [NetworkTables Documentation](https://docs.wpilib.org/en/stable/docs/software/networktables/index.html)
- [Simulation Documentation](https://docs.wpilib.org/en/stable/docs/software/wpilib-tools/robot-simulation/index.html)
