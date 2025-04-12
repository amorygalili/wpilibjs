/**
 * Minimal simulation robot.
 * 
 * This script simulates a robot that can communicate with the MinimalSimulationServer.js.
 */

const WebSocket = require('ws');

// Robot state
const robotState = {
  enabled: false,
  autonomous: false,
  test: false,
  teleop: true,
  time: 0,
  leftMotor: 0,
  rightMotor: 0,
  encoder: 0,
  limitSwitch: false,
  potentiometer: 0
};

// Connect to the WebSocket server
const socket = new WebSocket('ws://localhost:8085');

// Handle WebSocket connection
socket.on('open', () => {
  console.log('Connected to WebSocket server');
});

// Handle WebSocket messages
socket.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    handleMessage(message);
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

// Handle WebSocket close
socket.on('close', () => {
  console.log('Disconnected from WebSocket server');
  process.exit(0);
});

// Handle WebSocket errors
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Handle messages from the server
function handleMessage(message) {
  if (message.type === 'robot_state') {
    robotState.enabled = message.data.enabled;
    robotState.autonomous = message.data.autonomous;
    robotState.test = message.data.test;
    robotState.teleop = !(message.data.autonomous || message.data.test);
    robotState.time = message.data.time;
  }
}

// Robot initialization
function robotInit() {
  console.log('Robot initialized!');
}

// Robot periodic function
function robotPeriodic() {
  // Print robot state every second
  if (Math.floor(robotState.time) % 1 === 0 && robotState.time > 0) {
    console.log(`Robot state: enabled=${robotState.enabled}, autonomous=${robotState.autonomous}, test=${robotState.test}, teleop=${robotState.teleop}, time=${robotState.time.toFixed(2)}`);
  }
}

// Disabled initialization
function disabledInit() {
  console.log('Disabled mode initialized');
  robotState.leftMotor = 0;
  robotState.rightMotor = 0;
}

// Disabled periodic function
function disabledPeriodic() {
  // Nothing to do here
}

// Autonomous initialization
function autonomousInit() {
  console.log('Autonomous mode initialized');
}

// Autonomous periodic function
function autonomousPeriodic() {
  // Simple autonomous mode: move back and forth
  if (robotState.limitSwitch) {
    robotState.direction = -1;
  } else if (robotState.encoder <= 0) {
    robotState.direction = 1;
  }

  const speed = 0.5 * (robotState.direction || 1);
  robotState.leftMotor = speed;
  robotState.rightMotor = speed;

  updateSimulation();
}

// Teleop initialization
function teleopInit() {
  console.log('Teleop mode initialized');
}

// Teleop periodic function
function teleopPeriodic() {
  // Simple teleop mode: move forward
  robotState.leftMotor = 0.3;
  robotState.rightMotor = 0.3;

  updateSimulation();
}

// Test initialization
function testInit() {
  console.log('Test mode initialized');
}

// Test periodic function
function testPeriodic() {
  // Simple test mode: move backward
  robotState.leftMotor = -0.3;
  robotState.rightMotor = -0.3;

  updateSimulation();
}

// Update the simulation
function updateSimulation() {
  // Update position based on motor speeds
  const speed = (robotState.leftMotor + robotState.rightMotor) / 2;
  robotState.position = (robotState.position || 0) + speed;

  // Update encoder
  robotState.encoder = robotState.position * 20;

  // Update limit switch
  robotState.limitSwitch = robotState.position > 10;

  // Update potentiometer
  robotState.potentiometer = Math.min(5, Math.max(0, robotState.position / 2));
}

// Main robot loop
function robotLoop() {
  // Call the appropriate functions based on the robot state
  robotPeriodic();

  if (!robotState.enabled) {
    // Disabled mode
    if (!robotState.wasDisabled) {
      disabledInit();
      robotState.wasDisabled = true;
      robotState.wasAutonomous = false;
      robotState.wasTeleop = false;
      robotState.wasTest = false;
    }
    disabledPeriodic();
  } else if (robotState.autonomous) {
    // Autonomous mode
    if (!robotState.wasAutonomous) {
      autonomousInit();
      robotState.wasDisabled = false;
      robotState.wasAutonomous = true;
      robotState.wasTeleop = false;
      robotState.wasTest = false;
    }
    autonomousPeriodic();
  } else if (robotState.test) {
    // Test mode
    if (!robotState.wasTest) {
      testInit();
      robotState.wasDisabled = false;
      robotState.wasAutonomous = false;
      robotState.wasTeleop = false;
      robotState.wasTest = true;
    }
    testPeriodic();
  } else {
    // Teleop mode
    if (!robotState.wasTeleop) {
      teleopInit();
      robotState.wasDisabled = false;
      robotState.wasAutonomous = false;
      robotState.wasTeleop = true;
      robotState.wasTest = false;
    }
    teleopPeriodic();
  }
}

// Initialize the robot
robotInit();

// Start the robot loop
setInterval(robotLoop, 20);

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping robot...');
  socket.close();
  process.exit(0);
});
