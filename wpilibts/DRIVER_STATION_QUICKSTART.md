# Driver Station Example Quick Start Guide

This guide provides quick instructions on how to run the Driver Station example in the WPILib TypeScript implementation.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- A modern web browser (Chrome, Firefox, Edge, etc.)

## Running the Example

### Step 1: Install Dependencies and Build the Project

Navigate to the wpilibts directory and run:

```bash
cd wpilibjs/wpilibts
npm install
npm run build
```

### Step 2: Start the Robot Program

Run the following command from the wpilibts directory:

```bash
node run-example.js DriverStationExample
```

Or using the npm script:

```bash
npm run example DriverStationExample
```

You should see output similar to:
```
Robot initialized!
Driver Station communication initialized successfully
WebSocket server started on port 5810
Open DriverStationClient.html in a web browser to control the robot
```

### Step 3: Open the Driver Station Client

Open the DriverStationClient.html file in your web browser:
- Navigate to the file in your file explorer and double-click it
- Or open your browser and use File > Open File to navigate to:
  ```
  D:\repos\allwpilib\wpilibjs\wpilibts\examples\DriverStationClient.html
  ```

The Driver Station client should connect to the robot program automatically.

### Step 4: Control the Robot

Use the Driver Station client interface to control the robot:

- **Enable/Disable**: Use these buttons to enable or disable the robot.
- **E-Stop**: Emergency stop button. When pressed, the robot will be immediately disabled.
- **Reset E-Stop**: Resets the E-Stop state, allowing the robot to be enabled again.
- **Robot Mode**: Switch between Teleop, Autonomous, and Test modes.
- **Joystick**: Click and drag within the joystick area to control the robot.

## Troubleshooting

- If the client cannot connect to the robot program, ensure the robot program is running and no firewall is blocking the connection.
- If the E-Stop functionality is not working, make sure to click the "Reset E-Stop" button before trying to enable the robot again.

## Next Steps

For more detailed information, see the full [DriverStationExample.md](./examples/DriverStationExample.md) documentation.
