/**
 * Robot Simulation Example
 *
 * This example simulates a robot publishing data to NetworkTables.
 * It can be used with the simple-dashboard example to demonstrate
 * a complete robot-dashboard communication system.
 */

import { NetworkTables } from '../src/api/NetworkTables';

// Create a new NetworkTables instance
const nt = new NetworkTables();

// Robot state
interface RobotState {
  enabled: boolean;
  mode: string;
  batteryVoltage: number;
  motorSpeeds: number[];
  sensorValues: Record<string, number>;
  autonomousModes: string[];
  selectedAutonomousMode: string;
}

// Initialize robot state
const robot: RobotState = {
  enabled: false,
  mode: 'Disabled',
  batteryVoltage: 12.5,
  motorSpeeds: [0, 0, 0, 0],
  sensorValues: {
    'gyro': 0,
    'distance': 0,
    'pressure': 60,
    'temperature': 25
  },
  autonomousModes: [
    'Default',
    'Left Side',
    'Right Side',
    'Center'
  ],
  selectedAutonomousMode: 'Default'
};

// Start the robot simulation
async function main() {
  console.log('Starting robot simulation...');

  // Start the server
  await nt.startServer();
  console.log('NetworkTables server started');

  // Set up topics
  const robotEnabledTopic = nt.getBoolean('robot/enabled');
  const robotModeTopic = nt.getString('robot/mode');
  const batteryVoltageTopic = nt.getNumber('robot/battery');
  const motorSpeedsTopic = nt.getNumberArray('robot/motors/speeds');
  const gyroTopic = nt.getNumber('robot/sensors/gyro');
  const distanceTopic = nt.getNumber('robot/sensors/distance');
  const pressureTopic = nt.getNumber('robot/sensors/pressure');
  const temperatureTopic = nt.getNumber('robot/sensors/temperature');
  const autonomousModeTopic = nt.getString('robot/autonomousMode');
  const autonomousModesTopic = nt.getStringArray('robot/autonomousModes');
  const robotMessageTopic = nt.getString('robot/message');

  // Set initial values
  robotEnabledTopic.value = robot.enabled;
  robotModeTopic.value = robot.mode;
  batteryVoltageTopic.value = robot.batteryVoltage;
  gyroTopic.value = robot.sensorValues.gyro;
  distanceTopic.value = robot.sensorValues.distance;
  pressureTopic.value = robot.sensorValues.pressure;
  temperatureTopic.value = robot.sensorValues.temperature;
  autonomousModeTopic.value = robot.selectedAutonomousMode;

  // Try to set array values, but catch any errors
  try {
    motorSpeedsTopic.value = robot.motorSpeeds;
    autonomousModesTopic.value = robot.autonomousModes;
  } catch (error: any) {
    console.error('Error setting array values:', error.message);
  }

  // Listen for dashboard messages
  const dashboardMessageTopic = nt.getString('dashboard/message');
  dashboardMessageTopic.on('valueChanged', (value) => {
    if (value) {
      console.log(`Received message from dashboard: ${value}`);
      // Echo back to confirm receipt
      robotMessageTopic.value = `Received: ${value}`;
    }
  });

  // Listen for robot enable/disable
  robotEnabledTopic.on('valueChanged', (value) => {
    robot.enabled = value;
    robot.mode = value ? 'Teleop' : 'Disabled';
    robotModeTopic.value = robot.mode;

    console.log(`Robot ${value ? 'enabled' : 'disabled'}`);

    // Send a message
    robotMessageTopic.value = `Robot ${value ? 'enabled' : 'disabled'}`;

    // If enabled, start driving
    if (value) {
      // Simulate motors running
      robot.motorSpeeds = [0.5, 0.5, 0.5, 0.5];
    } else {
      // Stop motors
      robot.motorSpeeds = [0, 0, 0, 0];
    }

    // Try to update motor speeds, but catch any errors
    try {
      motorSpeedsTopic.value = robot.motorSpeeds;
    } catch (error: any) {
      console.error('Error updating motor speeds:', error.message);
    }
  });

  // Listen for autonomous mode changes
  autonomousModeTopic.on('valueChanged', (value) => {
    if (value && robot.autonomousModes.includes(value)) {
      robot.selectedAutonomousMode = value;
      console.log(`Autonomous mode changed to: ${value}`);
      robotMessageTopic.value = `Autonomous mode changed to: ${value}`;
    }
  });

  // Simulate robot behavior
  let time = 0;
  setInterval(() => {
    time += 0.1;

    // Simulate battery discharge
    if (robot.enabled) {
      robot.batteryVoltage -= 0.001;
    } else {
      // Slight recovery when disabled
      robot.batteryVoltage += 0.0002;
    }

    // Keep battery within realistic bounds
    robot.batteryVoltage = Math.max(9, Math.min(13, robot.batteryVoltage));
    batteryVoltageTopic.value = robot.batteryVoltage;

    // Simulate sensor values
    if (robot.enabled) {
      // Gyro changes when robot is moving
      robot.sensorValues.gyro = (Math.sin(time * 0.5) * 180) % 360;
      // Distance increases
      robot.sensorValues.distance += 0.05;
    }

    // Temperature fluctuates slightly
    robot.sensorValues.temperature = 25 + Math.sin(time * 0.1) * 2;
    // Pressure decreases slowly
    robot.sensorValues.pressure = Math.max(0, robot.sensorValues.pressure - 0.01);

    // Update sensor topics
    gyroTopic.value = robot.sensorValues.gyro;
    distanceTopic.value = robot.sensorValues.distance;
    pressureTopic.value = robot.sensorValues.pressure;
    temperatureTopic.value = robot.sensorValues.temperature;

    // If robot is enabled, simulate some motor speed changes
    if (robot.enabled) {
      robot.motorSpeeds = [
        0.5 + Math.sin(time) * 0.2,
        0.5 + Math.cos(time) * 0.2,
        0.5 + Math.sin(time + 1) * 0.2,
        0.5 + Math.cos(time + 1) * 0.2
      ];

      // Try to update motor speeds, but catch any errors
      try {
        motorSpeedsTopic.value = robot.motorSpeeds;
      } catch (error: any) {
        console.error('Error updating motor speeds:', error.message);
      }
    }

    // Occasionally send status messages
    if (Math.random() < 0.05) {
      const messages = [
        `Battery voltage: ${robot.batteryVoltage.toFixed(2)}V`,
        `Gyro angle: ${robot.sensorValues.gyro.toFixed(2)} degrees`,
        `Distance traveled: ${robot.sensorValues.distance.toFixed(2)} meters`,
        `System temperature: ${robot.sensorValues.temperature.toFixed(1)}°C`,
        `Pneumatic pressure: ${robot.sensorValues.pressure.toFixed(1)} PSI`
      ];

      robotMessageTopic.value = messages[Math.floor(Math.random() * messages.length)];
    }

    // Log status periodically
    if (time % 5 < 0.1) {
      console.log('\nRobot Status:');
      console.log(`Enabled: ${robot.enabled}`);
      console.log(`Mode: ${robot.mode}`);
      console.log(`Battery: ${robot.batteryVoltage.toFixed(2)}V`);
      console.log(`Motors: [${robot.motorSpeeds.map(s => s.toFixed(2)).join(', ')}]`);
      console.log(`Gyro: ${robot.sensorValues.gyro.toFixed(2)}°`);
      console.log(`Distance: ${robot.sensorValues.distance.toFixed(2)}m`);
      console.log(`Pressure: ${robot.sensorValues.pressure.toFixed(1)} PSI`);
      console.log(`Temperature: ${robot.sensorValues.temperature.toFixed(1)}°C`);
      console.log(`Autonomous: ${robot.selectedAutonomousMode}`);
    }
  }, 100);

  console.log('Robot simulation running');
  console.log('Connect with the simple-dashboard example to interact with the robot');
}

// Handle errors
process.on('unhandledRejection', (error: any) => {
  console.error('Unhandled promise rejection:', error);
});

// Run the main function
main().catch(console.error);
