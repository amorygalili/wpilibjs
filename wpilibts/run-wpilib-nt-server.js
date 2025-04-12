/**
 * Script to run the WPILib NT4 server and publish test data to it.
 * 
 * This script:
 * 1. Finds and launches the WPILib NT4 server
 * 2. Publishes test data to it using the NT4 client API
 * 3. Launches OutlineViewer
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');
const WebSocket = require('ws');

// Path to WPILib installation
const wpilibPath = 'C:\\Users\\Public\\wpilib\\2024';

// Path to OutlineViewer
const outlineViewerPath = path.join(wpilibPath, 'tools', 'outlineviewer.exe');

// Path to NT4 server
const nt4ServerPath = path.join(wpilibPath, 'bin', 'ntserverexe.exe');

// Check if OutlineViewer exists
if (!fs.existsSync(outlineViewerPath)) {
  console.error(`OutlineViewer not found at ${outlineViewerPath}`);
  console.error('Please make sure WPILib is installed correctly.');
  process.exit(1);
}

// Check if NT4 server exists
if (!fs.existsSync(nt4ServerPath)) {
  console.error(`NT4 server not found at ${nt4ServerPath}`);
  console.error('Please make sure WPILib is installed correctly.');
  process.exit(1);
}

// Check if the port is already in use
const port = 5810;
console.log(`Checking if port ${port} is in use...`);

const tester = net.createServer()
  .once('error', err => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is already in use. Please stop any running NetworkTables servers.`);
      process.exit(1);
    } else {
      console.error('Error checking port:', err);
      startNT4Server();
    }
  })
  .once('listening', () => {
    tester.close(() => {
      console.log(`Port ${port} is available. Starting NT4 server...`);
      startNT4Server();
    });
  })
  .listen(port);

// Start the NT4 server
function startNT4Server() {
  console.log('Starting WPILib NT4 server...');
  
  const nt4Server = spawn(nt4ServerPath, ['--port=5810'], {
    stdio: 'inherit',
    shell: true
  });
  
  nt4Server.on('error', (error) => {
    console.error(`Error starting NT4 server: ${error.message}`);
    process.exit(1);
  });
  
  // Wait for the server to start
  setTimeout(() => {
    publishTestData();
  }, 2000);
  
  // Handle termination signals
  process.on('SIGINT', () => {
    console.log('Stopping NT4 server...');
    nt4Server.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('Stopping NT4 server...');
    nt4Server.kill('SIGTERM');
  });
}

// Publish test data to the NT4 server
function publishTestData() {
  console.log('Publishing test data to NT4 server...');
  
  // Connect to the NT4 server
  const ws = new WebSocket('ws://localhost:5810/nt/client');
  
  ws.on('open', () => {
    console.log('Connected to NT4 server');
    
    // Send client hello message
    ws.send(JSON.stringify({
      method: 'hello',
      params: {
        id: 'test-publisher',
        version: '4.0.0'
      }
    }));
    
    // Publish test topics
    publishTopic(ws, '/SmartDashboard/Test/Boolean', 'boolean', true);
    publishTopic(ws, '/SmartDashboard/Test/Number', 'double', 42.0);
    publishTopic(ws, '/SmartDashboard/Test/String', 'string', 'Hello OutlineViewer!');
    publishTopic(ws, '/SmartDashboard/Test/BooleanArray', 'boolean[]', [true, false, true]);
    publishTopic(ws, '/SmartDashboard/Test/NumberArray', 'double[]', [1, 2, 3, 4, 5]);
    publishTopic(ws, '/SmartDashboard/Test/StringArray', 'string[]', ['Hello', 'OutlineViewer', '!']);
    
    // Update values periodically
    setInterval(() => {
      updateValues(ws);
    }, 1000);
    
    // Launch OutlineViewer after publishing data
    setTimeout(() => {
      launchOutlineViewer();
    }, 2000);
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('Received message:', message);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  ws.on('close', () => {
    console.log('Disconnected from NT4 server');
  });
}

// Publish a topic to the NT4 server
function publishTopic(ws, name, type, value) {
  console.log(`Publishing topic: ${name} (type: ${type})`);
  
  // Publish the topic
  ws.send(JSON.stringify({
    method: 'publish',
    params: {
      name,
      type,
      properties: {}
    }
  }));
  
  // Set the value
  ws.send(JSON.stringify({
    method: 'setValue',
    params: {
      name,
      value
    }
  }));
}

// Update values periodically
function updateValues(ws) {
  // Update boolean value
  ws.send(JSON.stringify({
    method: 'setValue',
    params: {
      name: '/SmartDashboard/Test/Boolean',
      value: Math.random() > 0.5
    }
  }));
  
  // Update number value
  ws.send(JSON.stringify({
    method: 'setValue',
    params: {
      name: '/SmartDashboard/Test/Number',
      value: Math.round(Math.random() * 100)
    }
  }));
  
  // Update string value
  ws.send(JSON.stringify({
    method: 'setValue',
    params: {
      name: '/SmartDashboard/Test/String',
      value: `Hello OutlineViewer! ${new Date().toLocaleTimeString()}`
    }
  }));
}

// Launch OutlineViewer
function launchOutlineViewer() {
  console.log('Launching OutlineViewer...');
  console.log('Please configure OutlineViewer with the following settings:');
  console.log('- Server Mode: Client');
  console.log('- Team Number/Server: localhost');
  console.log('- Port: 5810');
  
  const outlineViewer = spawn(outlineViewerPath, [], {
    stdio: 'inherit',
    shell: true,
    detached: true
  });
  
  outlineViewer.on('error', (error) => {
    console.error(`Error launching OutlineViewer: ${error.message}`);
  });
  
  console.log('OutlineViewer launched. You should see test data in the OutlineViewer window.');
  console.log('Press Ctrl+C to stop the server.');
}

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Stopping all processes...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Stopping all processes...');
  process.exit(0);
});
