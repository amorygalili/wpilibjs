/**
 * Simple Dashboard Example
 * 
 * This example demonstrates how to create a simple dashboard that displays
 * robot data from NetworkTables. It uses console output to simulate a dashboard.
 */

import { NetworkTables } from '../src/api/NetworkTables';
import readline from 'readline';

// Create a new NetworkTables instance
const nt = new NetworkTables();

// Dashboard state
interface DashboardState {
  robotEnabled: boolean;
  robotMode: string;
  batteryVoltage: number;
  motorSpeeds: number[];
  sensorValues: Record<string, number>;
  messages: string[];
  autonomousMode: string;
}

// Initialize dashboard state
const dashboard: DashboardState = {
  robotEnabled: false,
  robotMode: 'Disabled',
  batteryVoltage: 0,
  motorSpeeds: [0, 0, 0, 0],
  sensorValues: {},
  messages: [],
  autonomousMode: 'Default'
};

// Function to render the dashboard
function renderDashboard() {
  console.clear();
  console.log('=== SIMPLE ROBOT DASHBOARD ===');
  console.log(`Robot Status: ${dashboard.robotEnabled ? 'ENABLED' : 'DISABLED'}`);
  console.log(`Mode: ${dashboard.robotMode}`);
  console.log(`Battery: ${dashboard.batteryVoltage.toFixed(2)}V`);
  console.log('\nMotor Speeds:');
  console.log(`- Left Front: ${dashboard.motorSpeeds[0].toFixed(2)}`);
  console.log(`- Right Front: ${dashboard.motorSpeeds[1].toFixed(2)}`);
  console.log(`- Left Rear: ${dashboard.motorSpeeds[2].toFixed(2)}`);
  console.log(`- Right Rear: ${dashboard.motorSpeeds[3].toFixed(2)}`);
  
  console.log('\nSensor Values:');
  Object.entries(dashboard.sensorValues).forEach(([key, value]) => {
    console.log(`- ${key}: ${value.toFixed(2)}`);
  });
  
  console.log('\nSelected Autonomous Mode:');
  console.log(`- ${dashboard.autonomousMode}`);
  
  console.log('\nRecent Messages:');
  dashboard.messages.slice(-5).forEach((msg, i) => {
    console.log(`${i + 1}. ${msg}`);
  });
  
  console.log('\nCommands:');
  console.log('1. Toggle robot enabled');
  console.log('2. Change autonomous mode');
  console.log('3. Send message to robot');
  console.log('4. Exit');
}

// Start the dashboard
async function main() {
  console.log('Starting NetworkTables dashboard...');
  
  // Connect to the server
  await nt.connectAsClient();
  console.log('Connected to NetworkTables server');
  
  // Set up topics
  const robotEnabledTopic = nt.getBoolean('robot/enabled');
  const robotModeTopic = nt.getString('robot/mode');
  const batteryVoltageTopic = nt.getNumber('robot/battery');
  const motorSpeedsTopic = nt.getNumberArray('robot/motors/speeds');
  const autonomousModeTopic = nt.getString('robot/autonomousMode');
  const dashboardMessageTopic = nt.getString('dashboard/message');
  
  // Subscribe to value changes
  robotEnabledTopic.on('valueChanged', (value) => {
    dashboard.robotEnabled = value;
    renderDashboard();
  });
  
  robotModeTopic.on('valueChanged', (value) => {
    dashboard.robotMode = value;
    renderDashboard();
  });
  
  batteryVoltageTopic.on('valueChanged', (value) => {
    dashboard.batteryVoltage = value;
    renderDashboard();
  });
  
  motorSpeedsTopic.on('valueChanged', (value) => {
    dashboard.motorSpeeds = value;
    renderDashboard();
  });
  
  autonomousModeTopic.on('valueChanged', (value) => {
    dashboard.autonomousMode = value;
    renderDashboard();
  });
  
  // Listen for all sensor values
  nt['_instance'].addEntryListener(
    (notification) => {
      if (notification.name?.startsWith('robot/sensors/') && !notification.isDelete) {
        const sensorName = notification.name.replace('robot/sensors/', '');
        dashboard.sensorValues[sensorName] = notification.value as number;
        renderDashboard();
      }
    },
    {
      notifyOnUpdate: true,
      notifyOnNew: true,
      notifyOnDelete: true,
      notifyOnFlagsChange: false,
      notifyImmediately: false
    },
    'robot/sensors/'
  );
  
  // Listen for robot messages
  const robotMessageTopic = nt.getString('robot/message');
  robotMessageTopic.on('valueChanged', (value) => {
    if (value) {
      dashboard.messages.push(`[${new Date().toLocaleTimeString()}] ${value}`);
      renderDashboard();
    }
  });
  
  // Set up user input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Initial render
  renderDashboard();
  
  // Process user commands
  const processCommand = async () => {
    rl.question('Enter command (1-4): ', async (answer) => {
      switch (answer) {
        case '1':
          // Toggle robot enabled
          robotEnabledTopic.value = !dashboard.robotEnabled;
          break;
        case '2':
          // Change autonomous mode
          rl.question('Enter new autonomous mode: ', (mode) => {
            autonomousModeTopic.value = mode;
            processCommand();
          });
          return;
        case '3':
          // Send message to robot
          rl.question('Enter message: ', (message) => {
            dashboardMessageTopic.value = message;
            dashboard.messages.push(`[${new Date().toLocaleTimeString()}] Dashboard: ${message}`);
            renderDashboard();
            processCommand();
          });
          return;
        case '4':
          // Exit
          console.log('Exiting dashboard...');
          await nt.disconnect();
          rl.close();
          process.exit(0);
          return;
        default:
          console.log('Invalid command');
      }
      
      renderDashboard();
      processCommand();
    });
  };
  
  // Start processing commands
  processCommand();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Run the main function
main().catch(console.error);
