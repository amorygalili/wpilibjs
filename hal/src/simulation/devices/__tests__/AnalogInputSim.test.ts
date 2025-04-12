import { AnalogInputSim } from '../AnalogInputSim';
import { NotifyCallback } from '../../NotifyCallback';

describe('AnalogInputSim', () => {
  // Create a mock NotifyCallback
  const createMockCallback = (): NotifyCallback => ({
    callback: jest.fn(),
    callbackNative: jest.fn()
  });
  
  beforeEach(() => {
    // Reset the simulation data before each test
    const sim = new AnalogInputSim(0);
    sim.resetData();
  });
  
  test('constructor creates a new AnalogInputSim', () => {
    const sim = new AnalogInputSim(0);
    expect(sim).toBeInstanceOf(AnalogInputSim);
  });
  
  test('getInitialized and setInitialized', () => {
    const sim = new AnalogInputSim(0);
    
    // Initially not initialized
    expect(sim.getInitialized()).toBe(false);
    
    // Set initialized
    sim.setInitialized(true);
    expect(sim.getInitialized()).toBe(true);
    
    // Set not initialized
    sim.setInitialized(false);
    expect(sim.getInitialized()).toBe(false);
  });
  
  test('getVoltage and setVoltage', () => {
    const sim = new AnalogInputSim(0);
    
    // Initially 0
    expect(sim.getVoltage()).toBe(0);
    
    // Set voltage
    sim.setVoltage(3.3);
    expect(sim.getVoltage()).toBe(3.3);
    
    // Set another voltage
    sim.setVoltage(5.0);
    expect(sim.getVoltage()).toBe(5.0);
  });
  
  test('registerInitializedCallback with initialNotify=true', () => {
    const sim = new AnalogInputSim(0);
    const callback = createMockCallback();
    
    // Register callback with initialNotify=true
    const store = sim.registerInitializedCallback(callback, true);
    
    // Callback should be called with initial value
    expect(callback.callbackNative).toHaveBeenCalledWith('Initialized', 1, 0, 0);
    
    // Change the value
    sim.setInitialized(true);
    
    // Callback should be called with new value
    expect(callback.callbackNative).toHaveBeenCalledWith('Initialized', 1, 1, 0);
    
    // Cancel the callback
    store.cancel();
    
    // Change the value again
    sim.setInitialized(false);
    
    // Callback should not be called again
    expect(callback.callbackNative).toHaveBeenCalledTimes(2);
  });
  
  test('registerInitializedCallback with initialNotify=false', () => {
    const sim = new AnalogInputSim(0);
    const callback = createMockCallback();
    
    // Register callback with initialNotify=false
    const store = sim.registerInitializedCallback(callback, false);
    
    // Callback should not be called with initial value
    expect(callback.callbackNative).not.toHaveBeenCalled();
    
    // Change the value
    sim.setInitialized(true);
    
    // Callback should be called with new value
    expect(callback.callbackNative).toHaveBeenCalledWith('Initialized', 1, 1, 0);
  });
  
  test('registerVoltageCallback with initialNotify=true', () => {
    const sim = new AnalogInputSim(0);
    const callback = createMockCallback();
    
    // Register callback with initialNotify=true
    const store = sim.registerVoltageCallback(callback, true);
    
    // Callback should be called with initial value
    expect(callback.callbackNative).toHaveBeenCalledWith('Voltage', 2, 0, 0);
    
    // Change the value
    sim.setVoltage(3.3);
    
    // Callback should be called with new value
    expect(callback.callbackNative).toHaveBeenCalledWith('Voltage', 2, 0, 3.3);
    
    // Cancel the callback
    store.cancel();
    
    // Change the value again
    sim.setVoltage(5.0);
    
    // Callback should not be called again
    expect(callback.callbackNative).toHaveBeenCalledTimes(2);
  });
  
  test('registerVoltageCallback with initialNotify=false', () => {
    const sim = new AnalogInputSim(0);
    const callback = createMockCallback();
    
    // Register callback with initialNotify=false
    const store = sim.registerVoltageCallback(callback, false);
    
    // Callback should not be called with initial value
    expect(callback.callbackNative).not.toHaveBeenCalled();
    
    // Change the value
    sim.setVoltage(3.3);
    
    // Callback should be called with new value
    expect(callback.callbackNative).toHaveBeenCalledWith('Voltage', 2, 0, 3.3);
  });
  
  test('resetData resets all values', () => {
    const sim = new AnalogInputSim(0);
    
    // Set some values
    sim.setInitialized(true);
    sim.setVoltage(3.3);
    
    // Reset data
    sim.resetData();
    
    // Values should be reset
    expect(sim.getInitialized()).toBe(false);
    expect(sim.getVoltage()).toBe(0);
  });
  
  test('resetData calls callbacks', () => {
    const sim = new AnalogInputSim(0);
    const initCallback = createMockCallback();
    const voltageCallback = createMockCallback();
    
    // Set some values
    sim.setInitialized(true);
    sim.setVoltage(3.3);
    
    // Register callbacks
    sim.registerInitializedCallback(initCallback, false);
    sim.registerVoltageCallback(voltageCallback, false);
    
    // Clear the mock calls
    jest.clearAllMocks();
    
    // Reset data
    sim.resetData();
    
    // Callbacks should be called with reset values
    expect(initCallback.callbackNative).toHaveBeenCalledWith('Initialized', 1, 0, 0);
    expect(voltageCallback.callbackNative).toHaveBeenCalledWith('Voltage', 2, 0, 0);
  });
  
  test('multiple instances have separate data', () => {
    const sim1 = new AnalogInputSim(0);
    const sim2 = new AnalogInputSim(1);
    
    // Set values for sim1
    sim1.setInitialized(true);
    sim1.setVoltage(3.3);
    
    // Set values for sim2
    sim2.setInitialized(false);
    sim2.setVoltage(5.0);
    
    // Check values for sim1
    expect(sim1.getInitialized()).toBe(true);
    expect(sim1.getVoltage()).toBe(3.3);
    
    // Check values for sim2
    expect(sim2.getInitialized()).toBe(false);
    expect(sim2.getVoltage()).toBe(5.0);
  });
});
