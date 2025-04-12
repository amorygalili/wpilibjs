# Minimal Simulation Framework

This document describes the minimal simulation framework for WPILib TypeScript.

## Overview

The minimal simulation framework consists of three components:

1. **Robot Program**: A JavaScript implementation of a robot program that can be controlled by the simulation framework.
2. **WebSocket Server**: A server that allows communication between the robot program and a web-based UI.
3. **Web UI**: A simple HTML UI that can be used to control the robot in simulation.

## Components

### MinimalSimulationRobot.js

This is a simple robot implementation that can communicate with the MinimalSimulationServer.js. It simulates a robot with:

- Left and right motors
- An encoder
- A limit switch
- A potentiometer

The robot can be controlled by the simulation framework to:

- Enable/disable the robot
- Switch between teleop, autonomous, and test modes
- Simulate sensor feedback based on motor outputs

### MinimalSimulationServer.js

This is a simple WebSocket server that can communicate with the MinimalSimulationUI.html. It:

- Listens for WebSocket connections on port 8085
- Maintains the robot state (enabled, autonomous, test, time)
- Broadcasts the robot state to all connected clients
- Receives control messages from clients to update the robot state

### MinimalSimulationUI.html

This is a simple HTML UI that can be used to control a robot in simulation. It:

- Connects to the WebSocket server on port 8085
- Displays the current robot state (enabled, mode, time)
- Provides buttons to enable/disable the robot and switch modes
- Shows a log of events

## Communication Protocol

The communication protocol between the components is based on JSON messages with the following format:

```json
{
  "type": "message_type",
  "data": {
    // Message-specific data
  }
}
```

### Message Types

- **control_word**: Sent from the UI to the server to update the robot state
  ```json
  {
    "type": "control_word",
    "data": {
      "enabled": true,
      "autonomous": false,
      "test": false
    }
  }
  ```

- **robot_state**: Sent from the server to the UI to update the UI with the current robot state
  ```json
  {
    "type": "robot_state",
    "data": {
      "enabled": true,
      "autonomous": false,
      "test": false,
      "time": 123.45
    }
  }
  ```

## Running the Minimal Simulation Framework

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

## Extending the Framework

The minimal simulation framework can be extended in several ways:

### Adding Joystick Support

To add joystick support, you would need to:

1. Add joystick controls to the UI
2. Add joystick data to the communication protocol
3. Update the robot program to use the joystick data

### Adding Sensor Visualization

To add sensor visualization, you would need to:

1. Add sensor data to the communication protocol
2. Update the robot program to send sensor data to the server
3. Update the UI to display the sensor data

### Adding NetworkTables Support

To add NetworkTables support, you would need to:

1. Implement a NetworkTables client in the UI
2. Implement a NetworkTables server in the robot program
3. Use NetworkTables for communication instead of the custom protocol

## Known Issues

- The WebSocket server uses a fixed port (8085) which can cause conflicts if multiple instances are running.
- The robot program does not implement all the features of a real robot program.
- The UI is very basic and does not provide a rich visualization of the robot state.

## Future Improvements

- Add joystick input support to the simulation framework
- Implement a more robust NetworkTables simulation
- Add support for multiple robot programs running simultaneously
- Improve the web-based UI with more features and better visualization
- Add support for custom robot hardware simulation
