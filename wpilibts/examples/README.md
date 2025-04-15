# WPILib TypeScript Examples

This directory contains examples for using WPILib TypeScript.

## SimpleRobot Example

The SimpleRobot example demonstrates a basic robot program that logs its state to both the console and NetworkTables. This example is useful for verifying that the NetworkTables integration works correctly.

### Prerequisites

1. Make sure you have Node.js and npm installed
2. Install dependencies by running `npm install` in the wpilibts directory
3. Build the project by running `npm run build` in the wpilibts directory

### Running the Example

#### Step 1: Start OutlineViewer

First, you need to start OutlineViewer to act as a NetworkTables server:

1. Start OutlineViewer
2. Configure it as a server on port 5810 (the default NT4 port)
3. Click "Start"

#### Step 2: Run the SimpleRobot Simulation

In a terminal, navigate to the wpilibts directory and run:

```bash
npx ts-node examples/SimpleRobotSimulation.ts
```

This will start the simulation and display a menu of commands:

```
--- SimpleRobot Simulation Controls ---
1. Enable Robot (Teleop)
2. Enable Robot (Autonomous)
3. Enable Robot (Test)
4. Disable Robot
5. Exit Simulation
----------------------------------------
```

#### Step 3: Control the Robot

Use the menu to change the robot's mode:

- Option 1: Enable the robot in Teleop mode
- Option 2: Enable the robot in Autonomous mode
- Option 3: Enable the robot in Test mode
- Option 4: Disable the robot
- Option 5: Exit the simulation

#### Step 4: Observe the Results

As you change the robot's mode, you should see:

1. Console output showing the robot's state changes
2. NetworkTables entries updating in OutlineViewer

In OutlineViewer, look for the "RobotState" table, which contains:
- CurrentState: The current state of the robot
- LastState: The previous state of the robot
- InitCount: The number of init methods called
- PeriodicCount: The number of periodic methods called

### Troubleshooting

If you encounter issues:

1. Make sure OutlineViewer is running and configured as a server on port 5810
2. Check that you've built the wpilibts project with `npm run build`
3. Verify that there are no errors in the console output

### Next Steps

Once you've verified that the basic example works, you can:

1. Modify the SimpleRobot example to add more functionality
2. Create your own robot programs using the WPILib TypeScript library
3. Explore more advanced features like command-based programming
