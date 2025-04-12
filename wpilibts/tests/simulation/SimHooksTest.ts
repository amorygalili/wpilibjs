/**
 * Test for the SimHooks functionality.
 * 
 * This test verifies that the SimHooks functions work correctly.
 */

import { SimHooks, RuntimeType } from '../../src';

/**
 * Run the SimHooks test.
 */
function runSimHooksTest() {
  console.log('Starting SimHooks test...');

  try {
    const simHooks = SimHooks.getInstance();

    // Test 1: Runtime type
    console.log('Test 1: Testing runtime type...');
    simHooks.setRuntimeType(RuntimeType.Simulation);
    if (simHooks.getRuntimeType() !== RuntimeType.Simulation) {
      throw new Error('Runtime type not set correctly');
    }
    simHooks.setRuntimeType(RuntimeType.RealTime);
    if (simHooks.getRuntimeType() !== RuntimeType.RealTime) {
      throw new Error('Runtime type not set correctly');
    }
    simHooks.setRuntimeType(RuntimeType.Simulation); // Reset to simulation
    console.log('Test 1: Runtime type test passed');

    // Test 2: Program started
    console.log('Test 2: Testing program started...');
    simHooks.setProgramStarted();
    if (!simHooks.getProgramStarted()) {
      throw new Error('Program started not set correctly');
    }
    console.log('Test 2: Program started test passed');

    // Test 3: Timing functions
    console.log('Test 3: Testing timing functions...');
    
    // Get initial time
    const initialTime = simHooks.getFPGATime();
    const initialTimestamp = simHooks.getFPGATimestamp();
    
    // Step timing by 1 second
    simHooks.pauseTiming();
    if (!simHooks.isTimingPaused()) {
      throw new Error('Timing not paused correctly');
    }
    
    simHooks.stepTiming(1000000); // 1 second in microseconds
    
    // Get new time
    const newTime = simHooks.getFPGATime();
    const newTimestamp = simHooks.getFPGATimestamp();
    
    // Verify that the time increased by at least 1 second
    if (newTime - initialTime < 1000000) {
      throw new Error('Timing not stepped correctly');
    }
    
    if (newTimestamp - initialTimestamp < 1.0) {
      throw new Error('Timestamp not stepped correctly');
    }
    
    // Resume timing
    simHooks.resumeTiming();
    if (simHooks.isTimingPaused()) {
      throw new Error('Timing not resumed correctly');
    }
    
    // Restart timing
    simHooks.restartTiming();
    const restartedTime = simHooks.getFPGATime();
    if (restartedTime > 1000000) { // Should be close to 0, but allow some time to pass
      throw new Error('Timing not restarted correctly');
    }
    
    console.log('Test 3: Timing functions test passed');

    console.log('All SimHooks tests passed!');
    return true;
  } catch (error) {
    console.error('SimHooks test failed:', error);
    return false;
  }
}

// Run the test if this file is run directly
if (require.main === module) {
  const success = runSimHooksTest();
  process.exit(success ? 0 : 1);
}

export { runSimHooksTest };
