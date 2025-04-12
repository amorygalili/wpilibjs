import * as SimulatorHooks from '../SimulatorHooks';
import { sleep, measureExecutionTime } from '../../__tests__/helpers/TestUtils';

describe('SimulatorHooks', () => {
  beforeEach(() => {
    // Reset the simulation state before each test
    SimulatorHooks.restartTiming();
    SimulatorHooks.setProgramStarted();
  });
  
  describe('Program Control', () => {
    test('setProgramStarted and getProgramStarted', () => {
      SimulatorHooks.setProgramStarted();
      expect(SimulatorHooks.getProgramStarted()).toBe(true);
    });
    
    test('waitForProgramStart resolves when program is started', async () => {
      // Program is already started from beforeEach
      await expect(Promise.race([
        SimulatorHooks.waitForProgramStart(),
        sleep(100).then(() => 'timeout')
      ])).resolves.not.toBe('timeout');
    });
  });
  
  describe('Timing Control', () => {
    test('pauseTiming and isTimingPaused', () => {
      SimulatorHooks.pauseTiming();
      expect(SimulatorHooks.isTimingPaused()).toBe(true);
      
      SimulatorHooks.resumeTiming();
      expect(SimulatorHooks.isTimingPaused()).toBe(false);
    });
    
    test('restartTiming resets simulation time', () => {
      // Step timing to advance the simulation
      SimulatorHooks.stepTiming(1_000_000); // 1 second
      
      // Get the current time
      const time1 = SimulatorHooks.getFPGATime();
      
      // Restart timing
      SimulatorHooks.restartTiming();
      
      // Get the time again
      const time2 = SimulatorHooks.getFPGATime();
      
      // The time should be reset to near zero
      expect(time2).toBeLessThan(time1);
      expect(time2).toBeLessThan(1_000_000n); // Less than 1 second
    });
    
    test('stepTiming advances simulation time', () => {
      // Pause timing to make the test deterministic
      SimulatorHooks.pauseTiming();
      
      // Get the current time
      const time1 = SimulatorHooks.getFPGATime();
      
      // Step timing by 1 second
      SimulatorHooks.stepTiming(1_000_000);
      
      // Get the time again
      const time2 = SimulatorHooks.getFPGATime();
      
      // The time should be advanced by 1 second
      expect(time2 - time1).toBe(1_000_000n);
    });
    
    test('stepTimingAsync advances simulation time', async () => {
      // Pause timing to make the test deterministic
      SimulatorHooks.pauseTiming();
      
      // Get the current time
      const time1 = SimulatorHooks.getFPGATime();
      
      // Step timing by 1 second
      SimulatorHooks.stepTimingAsync(1_000_000);
      
      // Get the time again
      const time2 = SimulatorHooks.getFPGATime();
      
      // The time should be advanced by 1 second
      expect(time2 - time1).toBe(1_000_000n);
    });
    
    test('getFPGATime returns the current simulation time', async () => {
      // Pause timing to make the test deterministic
      SimulatorHooks.pauseTiming();
      
      // Step timing by 1 second
      SimulatorHooks.stepTiming(1_000_000);
      
      // Get the time
      const time = SimulatorHooks.getFPGATime();
      
      // The time should be at least 1 second
      expect(time).toBeGreaterThanOrEqual(1_000_000n);
    });
    
    test('getFPGATimestamp returns the current simulation time in seconds', () => {
      // Pause timing to make the test deterministic
      SimulatorHooks.pauseTiming();
      
      // Step timing by 1 second
      SimulatorHooks.stepTiming(1_000_000);
      
      // Get the time
      const time = SimulatorHooks.getFPGATimestamp();
      
      // The time should be at least 1 second
      expect(time).toBeGreaterThanOrEqual(1);
    });
    
    test('resumeTiming allows time to advance naturally', async () => {
      // Pause timing to make the test deterministic
      SimulatorHooks.pauseTiming();
      
      // Resume timing
      SimulatorHooks.resumeTiming();
      
      // Get the current time
      const time1 = SimulatorHooks.getFPGATime();
      
      // Wait for a short time
      await sleep(50);
      
      // Get the time again
      const time2 = SimulatorHooks.getFPGATime();
      
      // The time should have advanced
      expect(time2).toBeGreaterThan(time1);
    });
  });
  
  describe('Runtime Type', () => {
    test('setHALRuntimeType sets the runtime type', () => {
      // Import the HALRuntimeType enum
      const { HALRuntimeType } = require('../../HALTypes');
      const { getRuntimeType } = require('../../HALBase');
      
      // Set the runtime type to RealTime
      SimulatorHooks.setHALRuntimeType(HALRuntimeType.RealTime);
      
      // Check that the runtime type was set
      expect(getRuntimeType()).toBe(HALRuntimeType.RealTime);
      
      // Set the runtime type back to Simulation
      SimulatorHooks.setHALRuntimeType(HALRuntimeType.Simulation);
      
      // Check that the runtime type was set
      expect(getRuntimeType()).toBe(HALRuntimeType.Simulation);
    });
  });
});
