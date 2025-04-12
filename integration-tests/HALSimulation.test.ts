import * as HAL from '../hal/src';
import * as wpiutil from '../wpiutil/src';

// Import specific modules
import { LogLevel } from '../wpiutil/src/logging/LogLevel';
import { getLogger } from '../wpiutil/src/logging/Logger';
import { Timestamp } from '../wpiutil/src/timestamp/Timestamp';
import { Struct } from '../wpiutil/src/struct/Struct';
import { field, StructFieldType } from '../wpiutil/src/struct/StructField';
import { AnalogInputSim, DigitalInputSim } from '../hal/src/simulation/devices';
import { DifferentialDrivetrainSim, DCMotors } from '../hal/src/simulation/drivetrain';
import { HALRuntimeType } from '../hal/src/HALTypes';
import {
  getFPGATime,
  getFPGATimestamp,
  restartTiming,
  stepTiming,
  setHALRuntimeType
} from '../hal/src/simulation/SimulatorHooks';

describe('HAL and wpiutil integration', () => {
  // Create a logger for testing
  const logger = getLogger('HALSimulation');

  beforeAll(() => {
    // Set the log level to Debug
    logger.setLevel(LogLevel.Debug);

    // Initialize the HAL
    HAL.initialize();

    // Set the runtime type to Simulation
    setHALRuntimeType(HALRuntimeType.Simulation);
  });

  test('HAL initialization', () => {
    // Check that the HAL is initialized
    expect(HAL.isInitialized()).toBe(true);

    // Check that the runtime type is Simulation
    expect(HAL.getRuntimeType()).toBe(HALRuntimeType.Simulation);
  });

  test('Simulation timing control', async () => {
    // Restart timing
    restartTiming();

    // Get the initial time
    const initialTime = getFPGATime();

    // Step timing by 1 second
    stepTiming(1_000_000);

    // Get the new time
    const newTime = getFPGATime();

    // The time should have advanced by 1 second
    expect(newTime - initialTime).toBe(1_000_000n);
  });

  test('Device simulation', () => {
    // Create an analog input simulation
    const analogInput = new AnalogInputSim(0);

    // Set the voltage
    analogInput.setVoltage(3.3);

    // Check that the voltage was set
    expect(analogInput.getVoltage()).toBe(3.3);

    // Create a digital input simulation
    const digitalInput = new DigitalInputSim(0);

    // Set the value
    digitalInput.setValue(true);

    // Check that the value was set
    expect(digitalInput.getValue()).toBe(true);
  });

  test('Drivetrain simulation', () => {
    // Create a drivetrain simulation
    const drivetrain = new DifferentialDrivetrainSim(
      DCMotors.CIM(2),  // 2 CIM motors per side
      10.71,            // 10.71:1 gearing
      7.5,              // 7.5 kg*m^2 moment of inertia
      60.0,             // 60 kg robot mass
      0.0762,           // 6 inch (0.1524 m) wheels -> 0.0762 m radius
      0.66              // 26 inch (0.66 m) track width
    );

    // Set the input voltages
    drivetrain.setInputs(12.0, 12.0);

    // Update the simulation
    drivetrain.update(0.02);  // 20ms

    // Get the wheel speeds
    const speeds = drivetrain.getWheelSpeeds();

    // The wheels should be moving forward
    expect(speeds.left).toBeGreaterThan(0);
    expect(speeds.right).toBeGreaterThan(0);

    // Log the wheel speeds
    logger.debug(`Wheel speeds: left=${speeds.left.toFixed(2)} m/s, right=${speeds.right.toFixed(2)} m/s`);
  });

  test('Timestamp and logging', async () => {
    // Get the current time in milliseconds for more precision
    const time = Timestamp.getMilliseconds();

    // Log the time
    logger.info(`Current time: ${(time / 1000).toFixed(3)} seconds`);

    // Wait for a short time
    await Timestamp.delayMilliseconds(50);

    // Get the new time
    const newTime = Timestamp.getMilliseconds();

    // The time should have advanced
    expect(newTime).toBeGreaterThan(time);
  });

  test('Struct serialization', () => {
    // Create a struct for robot state
    const robotStateStruct = new Struct([
      field('timestamp', StructFieldType.Float64),
      field('x', StructFieldType.Float64),
      field('y', StructFieldType.Float64),
      field('heading', StructFieldType.Float64),
      field('leftVoltage', StructFieldType.Float64),
      field('rightVoltage', StructFieldType.Float64)
    ]);

    // Create a drivetrain simulation
    const drivetrain = new DifferentialDrivetrainSim(
      DCMotors.CIM(2),
      10.71,
      7.5,
      60.0,
      0.0762,
      0.66
    );

    // Set the input voltages
    const leftVoltage = 6.0;
    const rightVoltage = 6.0;
    drivetrain.setInputs(leftVoltage, rightVoltage);

    // Update the simulation
    drivetrain.update(0.02);

    // Get the robot state
    const pose = drivetrain.getPose();

    // Create the robot state data
    const robotState = {
      timestamp: Timestamp.getSeconds(),
      x: pose.x,
      y: pose.y,
      heading: pose.rotation,
      leftVoltage,
      rightVoltage
    };

    // Pack the robot state
    const buffer = robotStateStruct.pack(robotState);

    // Unpack the robot state
    const unpackedState = robotStateStruct.unpack(buffer);

    // Check that the unpacked state matches the original
    expect(unpackedState.timestamp).toBeCloseTo(robotState.timestamp, 10);
    expect(unpackedState.x).toBeCloseTo(robotState.x, 10);
    expect(unpackedState.y).toBeCloseTo(robotState.y, 10);
    expect(unpackedState.heading).toBeCloseTo(robotState.heading, 10);
    expect(unpackedState.leftVoltage).toBeCloseTo(robotState.leftVoltage, 10);
    expect(unpackedState.rightVoltage).toBeCloseTo(robotState.rightVoltage, 10);

    // Log the robot state
    logger.info(`Robot state: x=${robotState.x.toFixed(2)}, y=${robotState.y.toFixed(2)}, heading=${robotState.heading.toFixed(2)}`);
  });
});
