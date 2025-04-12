# WPILib TypeScript Implementation (wpilibts)

This package provides a TypeScript implementation of the WPILib robot programming framework, designed for use with FRC robots.

## Overview

The wpilibts package provides the core classes needed to create robot programs using TypeScript. It follows the same structure and patterns as the Java implementation (wpilibj) but is adapted for TypeScript and Node.js.

## Key Classes

### Core Robot Classes
- **RobotBase**: The base class for all robot programs.
- **IterativeRobotBase**: Implements a specific type of robot program framework with periodic methods.
- **TimedRobot**: Extends IterativeRobotBase to provide a timed robot program framework.
- **Watchdog**: A utility class for monitoring loop timing and detecting overruns.

### Driver Station
- **DriverStation**: Provides access to driver station data and control.
- **DSControlWord**: Encapsulates the robot state information.

### Command-Based Framework
- **Command**: The base class for all commands.
- **Subsystem**: The base class for all subsystems.
- **CommandScheduler**: Manages command execution and scheduling.
- **CommandGroupBase**: Base class for command groups.
- **SequentialCommandGroup**: Runs commands in sequence.
- **ParallelCommandGroup**: Runs commands in parallel.
- **ParallelRaceGroup**: Runs commands in parallel, ending when any command ends.
- **ParallelDeadlineGroup**: Runs commands in parallel, ending when a specific command ends.

## Getting Started

To create a new robot program:

1. Install the package:
   ```bash
   npm install @wpilibjs/wpilibts
   ```

2. Create a new robot class that extends TimedRobot:
   ```typescript
   import { TimedRobot, RobotBase } from '@wpilibjs/wpilibts';

   class MyRobot extends TimedRobot {
     public override robotInit(): void {
       console.log('Robot initialized!');
     }

     public override autonomousInit(): void {
       console.log('Autonomous mode started!');
     }

     public override autonomousPeriodic(): void {
       // Autonomous code here
     }

     public override teleopInit(): void {
       console.log('Teleop mode started!');
     }

     public override teleopPeriodic(): void {
       // Teleop code here
     }
   }

   // Start the robot program
   if (require.main === module) {
     RobotBase.main(MyRobot);
   }
   ```

3. Run your robot program:
   ```bash
   npx ts-node MyRobot.ts
   ```

## Robot Lifecycle

The robot program follows a specific lifecycle:

1. **robotInit()**: Called once when the robot is first started up.
2. **simulationInit()**: Called once in simulation mode after robotInit().
3. **disabledInit()**: Called once when the robot enters disabled mode.
4. **autonomousInit()**: Called once when the robot enters autonomous mode.
5. **teleopInit()**: Called once when the robot enters teleop mode.
6. **testInit()**: Called once when the robot enters test mode.

Periodic methods are called repeatedly while in the corresponding mode:

- **robotPeriodic()**: Called periodically in all modes.
- **disabledPeriodic()**: Called periodically in disabled mode.
- **autonomousPeriodic()**: Called periodically in autonomous mode.
- **teleopPeriodic()**: Called periodically in teleop mode.
- **testPeriodic()**: Called periodically in test mode.
- **simulationPeriodic()**: Called periodically in simulation mode.

Exit methods are called when leaving a mode:

- **disabledExit()**: Called when exiting disabled mode.
- **autonomousExit()**: Called when exiting autonomous mode.
- **teleopExit()**: Called when exiting teleop mode.
- **testExit()**: Called when exiting test mode.

## Examples

See the `examples` directory for sample robot programs. You can run an example using:

```bash
npm run example BasicRobot
```

Replace `BasicRobot` with the name of the example you want to run.

### Driver Station Example

The Driver Station example demonstrates how to use the DriverStation class with WebSocket integration. It includes a web-based Driver Station client that allows you to control the robot.

To run the Driver Station example with a single command:

```bash
npm run driverstation
```

This will:
1. Build the project if needed
2. Start the robot program
3. Open the Driver Station client in your default web browser

Alternatively, you can run the example manually:

1. Start the robot program:
   ```bash
   npm run example DriverStationExample
   ```

2. Open the Driver Station client in your web browser:
   ```
   examples/DriverStationClient.html
   ```

3. Use the client interface to control the robot:
   - Enable/Disable the robot
   - Switch between Teleop, Autonomous, and Test modes
   - Use the virtual joystick
   - Activate and reset the E-Stop

For detailed instructions, see [DriverStationExample.md](./examples/DriverStationExample.md) or the quick start guide [DRIVER_STATION_QUICKSTART.md](./DRIVER_STATION_QUICKSTART.md)

### Simulation Example

The Simulation example demonstrates how to use the simulation features of WPILib, including HALSim and NetworkTables. It simulates a simple robot with a drivetrain and sensors, and provides a web-based UI to control and monitor the robot.

To run the Simulation example with a single command:

```bash
npm run simulation
```

This will:
1. Build the project if needed
2. Start the robot program
3. Open the Simulation UI in your default web browser

Alternatively, you can run the example manually:

1. Start the robot program:
   ```bash
   npm run example SimulationExample
   ```

2. Open the Simulation UI in your web browser:
   ```
   examples/SimulationUI.html
   ```

3. Use the UI to control and monitor the robot:
   - Enable/Disable the robot
   - Switch between Teleop, Autonomous, and Test modes
   - Control the robot using virtual joysticks or motor sliders
   - Monitor sensor values and robot position

For detailed instructions, see [SimulationExample.md](./examples/SimulationExample.md)

## Testing

The wpilibts package includes a comprehensive test suite. You can run the tests using:

```bash
# Run all tests
npm test

# Run tests in watch mode (automatically re-run when files change)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

See the `tests` directory for more information about the test suite.

## License

This project is licensed under the BSD 3-Clause License.
