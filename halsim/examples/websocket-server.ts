/**
 * WebSocket server example
 */

import { HALSimulator, WSServer } from '../src';

// Create a HAL simulator
const hal = new HALSimulator();

// Initialize the HAL
hal.initialize();

// Create some devices
const dio0 = hal.createDigitalInput(0);
const pwm0 = hal.createPWM(0);
const ai0 = hal.createAnalogInput(0);
const encoder0 = hal.createEncoder(0, 1, 2);

// Set initial values
dio0.setValue(true);
pwm0.setSpeed(0.5);
ai0.setVoltage(2.5);
encoder0.setCount(100);

// Create and start WebSocket server
const server = new WSServer(hal, {
  port: 3300,
  host: 'localhost',
  path: '/wpilibws'
});

server.start();

console.log('WebSocket server started. Connect with the web client to interact with the HAL simulator.');
console.log('Press Ctrl+C to stop the server.');

// Simulate a robot program
console.log('Starting robot program...');
hal.setProgramStarted();

// Periodically update some values to simulate changes
setInterval(() => {
  // Simulate encoder counting
  const currentCount = encoder0.getCount();
  encoder0.setCount(currentCount + 1);
  
  // Simulate analog input fluctuation
  const currentVoltage = ai0.getVoltage();
  const newVoltage = currentVoltage + (Math.random() * 0.2 - 0.1);
  ai0.setVoltage(Math.max(0, Math.min(5, newVoltage)));
}, 100);
