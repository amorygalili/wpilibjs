# Driver Station Example

This document provides instructions on how to run and use the Driver Station example in the WPILib TypeScript implementation.

## Introduction

The Driver Station Example demonstrates how to use the DriverStation class with WebSocket integration. It simulates a robot that can be controlled through a web-based Driver Station client. This example shows how to:

- Initialize the Driver Station communication
- Handle robot mode changes (enabled/disabled, autonomous/teleop/test)
- Read joystick input from the Driver Station
- Implement E-Stop functionality

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
2. The Driver Station client (web browser)

### Starting the Robot Program

1. Run the following command from the wpilibts directory:
   ```
   node run-example.js DriverStationExample
   ```
   
   Alternatively, you can use the npm script:
   ```
   npm run example DriverStationExample
   ```

2. You should see output similar to:
   ```
   Robot initialized!
   Driver Station communication initialized successfully
   WebSocket server started on port 5810
   Open DriverStationClient.html in a web browser to control the robot
   ```

### Opening the Driver Station Client

1. Open the DriverStationClient.html file in your web browser. You can do this by:
   - Navigating to the file in your file explorer and double-clicking it
   - Or opening your browser and using File > Open File to navigate to:
     ```
     D:\repos\allwpilib\wpilibjs\wpilibts\examples\DriverStationClient.html
     ```

2. The Driver Station client should connect to the robot program automatically.
   You should see a message in the client log: "Connected to robot"

## Using the Driver Station Client

The Driver Station client provides a user interface to control the robot:

### Robot Control

- **Enable/Disable**: Use these buttons to enable or disable the robot.
- **E-Stop**: Emergency stop button. When pressed, the robot will be immediately disabled and cannot be re-enabled until the E-Stop is reset.
- **Reset E-Stop**: Resets the E-Stop state, allowing the robot to be enabled again.

### Robot Mode

- **Teleop**: Sets the robot to teleoperated mode (human-controlled).
- **Autonomous**: Sets the robot to autonomous mode (pre-programmed).
- **Test**: Sets the robot to test mode.

### Joystick

The joystick panel allows you to control the robot using a virtual joystick. Click and drag within the joystick area to move the joystick.

### Status Panel

The status panel shows the current state of the robot:
- **Robot State**: Enabled or Disabled
- **Robot Mode**: Teleop, Autonomous, or Test
- **E-Stop**: Active or Inactive
- **Connection**: Connected or Disconnected

### Log

The log panel shows messages from the Driver Station client, including connection status and robot state changes.

## Features

### Robot Program

The robot program demonstrates:
- Initializing the Driver Station communication
- Handling robot mode changes
- Reading joystick input
- Implementing different robot modes (autonomous, teleop, test)

### Driver Station Client

The Driver Station client demonstrates:
- Connecting to the robot program via WebSocket
- Sending control commands to the robot
- Providing a virtual joystick interface
- Implementing E-Stop functionality
- Displaying robot status

## Troubleshooting

### Connection Issues

If the Driver Station client cannot connect to the robot program:

1. Ensure the robot program is running
2. Check that no firewall is blocking the connection
3. Verify that port 5810 is available
4. Try refreshing the Driver Station client page

### E-Stop Issues

If the E-Stop functionality is not working:

1. Check the console logs in both the robot program and the Driver Station client
2. Ensure you click the "Reset E-Stop" button before trying to enable the robot again

## Next Steps

After exploring this example, you might want to:

1. Modify the robot program to add more functionality
2. Customize the Driver Station client UI
3. Implement additional controls or indicators
4. Add support for multiple joysticks
5. Implement more advanced autonomous modes

## Additional Resources

- [WPILib Documentation](https://docs.wpilib.org/)
- [FRC Control System Documentation](https://docs.wpilib.org/en/stable/docs/software/vscode-overview/index.html)
