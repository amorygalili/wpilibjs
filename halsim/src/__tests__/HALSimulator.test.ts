import { HALSimulator } from '../HALSimulator';
import { HAL_RuntimeType } from '../HALTypes';

describe('HALSimulator', () => {
  let hal: HALSimulator;

  beforeEach(() => {
    hal = new HALSimulator();
  });

  test('should initialize with simulation runtime type', () => {
    expect(hal.getRuntimeType()).toBe(HAL_RuntimeType.Simulation);
  });

  test('should allow changing runtime type', () => {
    hal.setRuntimeType(HAL_RuntimeType.Real);
    expect(hal.getRuntimeType()).toBe(HAL_RuntimeType.Real);
  });

  test('should initialize with program not started', () => {
    expect(hal.getProgramStarted()).toBe(false);
  });

  test('should allow setting program started', () => {
    hal.setProgramStarted();
    expect(hal.getProgramStarted()).toBe(true);
  });

  test('should initialize with timing not paused', () => {
    expect(hal.isTimingPaused()).toBe(false);
  });

  test('should allow pausing and resuming timing', () => {
    hal.pauseTiming();
    expect(hal.isTimingPaused()).toBe(true);
    
    hal.resumeTiming();
    expect(hal.isTimingPaused()).toBe(false);
  });

  test('should create and retrieve digital inputs', () => {
    const channel = 5;
    const dio = hal.createDigitalInput(channel);
    
    expect(dio).toBeDefined();
    expect(dio.getChannel()).toBe(channel);
    expect(dio.getInitialized()).toBe(true);
    
    const retrievedDio = hal.getDigitalInput(channel);
    expect(retrievedDio).toBe(dio);
  });

  test('should create and retrieve PWMs', () => {
    const channel = 3;
    const pwm = hal.createPWM(channel);
    
    expect(pwm).toBeDefined();
    expect(pwm.getChannel()).toBe(channel);
    expect(pwm.getInitialized()).toBe(true);
    
    const retrievedPwm = hal.getPWM(channel);
    expect(retrievedPwm).toBe(pwm);
  });

  test('should create and retrieve analog inputs', () => {
    const channel = 2;
    const ai = hal.createAnalogInput(channel);
    
    expect(ai).toBeDefined();
    expect(ai.getChannel()).toBe(channel);
    expect(ai.getInitialized()).toBe(true);
    
    const retrievedAi = hal.getAnalogInput(channel);
    expect(retrievedAi).toBe(ai);
  });

  test('should create and retrieve encoders', () => {
    const index = 1;
    const channelA = 2;
    const channelB = 3;
    const encoder = hal.createEncoder(index, channelA, channelB);
    
    expect(encoder).toBeDefined();
    expect(encoder.getIndex()).toBe(index);
    expect(encoder.getDigitalChannelA()).toBe(channelA);
    expect(encoder.getDigitalChannelB()).toBe(channelB);
    expect(encoder.getInitialized()).toBe(true);
    
    const retrievedEncoder = hal.getEncoder(index);
    expect(retrievedEncoder).toBe(encoder);
  });

  test('should update existing encoder channels', () => {
    const index = 1;
    const channelA1 = 2;
    const channelB1 = 3;
    const channelA2 = 4;
    const channelB2 = 5;
    
    // Create encoder with initial channels
    const encoder = hal.createEncoder(index, channelA1, channelB1);
    expect(encoder.getDigitalChannelA()).toBe(channelA1);
    expect(encoder.getDigitalChannelB()).toBe(channelB1);
    
    // Update channels by creating with same index
    const updatedEncoder = hal.createEncoder(index, channelA2, channelB2);
    expect(updatedEncoder).toBe(encoder); // Should be the same object
    expect(updatedEncoder.getDigitalChannelA()).toBe(channelA2);
    expect(updatedEncoder.getDigitalChannelB()).toBe(channelB2);
  });

  test('should reset all handles', () => {
    // Create some devices
    hal.createDigitalInput(0);
    hal.createPWM(1);
    hal.createAnalogInput(2);
    hal.createEncoder(3, 4, 5);
    
    // Verify they exist
    expect(hal.getDigitalInputCount()).toBe(1);
    expect(hal.getPWMCount()).toBe(1);
    expect(hal.getAnalogInputCount()).toBe(1);
    expect(hal.getEncoderCount()).toBe(1);
    
    // Reset handles
    hal.resetHandles();
    
    // Verify they're gone
    expect(hal.getDigitalInputCount()).toBe(0);
    expect(hal.getPWMCount()).toBe(0);
    expect(hal.getAnalogInputCount()).toBe(0);
    expect(hal.getEncoderCount()).toBe(0);
    
    expect(hal.getDigitalInput(0)).toBeUndefined();
    expect(hal.getPWM(1)).toBeUndefined();
    expect(hal.getAnalogInput(2)).toBeUndefined();
    expect(hal.getEncoder(3)).toBeUndefined();
  });

  test('waitForProgramStart should resolve when program is started', async () => {
    // Create a promise that will resolve when waitForProgramStart resolves
    const waitPromise = hal.waitForProgramStart();
    
    // Start the program
    hal.setProgramStarted();
    
    // Wait for the promise to resolve
    await waitPromise;
    
    // If we get here, the test passed
    expect(hal.getProgramStarted()).toBe(true);
  });

  test('waitForProgramStart should resolve immediately if program is already started', async () => {
    // Start the program
    hal.setProgramStarted();
    
    // Create a promise that should resolve immediately
    const waitPromise = hal.waitForProgramStart();
    
    // Wait for the promise to resolve
    await waitPromise;
    
    // If we get here, the test passed
    expect(hal.getProgramStarted()).toBe(true);
  });
});
