/**
 * Simple robot example
 */

import { HALSimulator } from '../src/HALSimulator';

// Create a HAL simulator
const hal = new HALSimulator();

// Initialize the HAL
hal.initialize();

// Create some devices
const dio0 = hal.createDigitalInput(0);
const pwm0 = hal.createPWM(0);
const ai0 = hal.createAnalogInput(0);
const encoder0 = hal.createEncoder(0, 1, 2);

// Set some values
dio0.setValue(true);
pwm0.setSpeed(0.5);
ai0.setVoltage(2.5);
encoder0.setCount(100);

// Register callbacks
dio0.registerValueCallback((name, param, value) => {
  console.log(`DIO 0 value changed: ${value.data}`);
}, null, true);

pwm0.registerSpeedCallback((name, param, value) => {
  console.log(`PWM 0 speed changed: ${value.data}`);
}, null, true);

// Simulate a robot program
console.log('Starting robot program...');
hal.setProgramStarted();

// Change some values to trigger callbacks
setTimeout(() => {
  console.log('Changing values...');
  dio0.setValue(false);
  pwm0.setSpeed(0.75);
  ai0.setVoltage(3.3);
  encoder0.setCount(200);
}, 1000);

// Print final state
setTimeout(() => {
  console.log('\nFinal state:');
  console.log(`DIO 0: ${dio0.getValue()}`);
  console.log(`PWM 0: ${pwm0.getSpeed()}`);
  console.log(`Analog Input 0: ${ai0.getVoltage()}`);
  console.log(`Encoder 0: ${encoder0.getCount()}`);
}, 2000);
