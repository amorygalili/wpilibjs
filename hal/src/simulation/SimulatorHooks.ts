import { HALRuntimeType } from '../HALTypes';
import { setRuntimeType } from '../HALBase';

/**
 * Program started flag
 */
let programStarted = false;

/**
 * Timing paused flag
 */
let timingPaused = false;

/**
 * Current simulation time in microseconds
 */
let simulationTime = 0n;

/**
 * Last time update in microseconds (from Date.now())
 */
let lastTimeUpdate = 0n;

/**
 * Set the HAL runtime type (real or simulation)
 * 
 * @param type The runtime type to set
 */
export function setHALRuntimeType(type: HALRuntimeType): void {
  setRuntimeType(type);
}

/**
 * Wait for the user program to start
 */
export function waitForProgramStart(): void {
  // In a real implementation, this would block until the program starts
  // For now, just wait until the programStarted flag is set
  while (!programStarted) {
    // In a real implementation, we would use a condition variable
    // For now, just sleep for a short time
    setTimeout(() => {}, 10);
  }
}

/**
 * Set that the user program has started
 */
export function setProgramStarted(): void {
  programStarted = true;
}

/**
 * Get whether the user program has started
 * 
 * @returns True if the user program has started
 */
export function getProgramStarted(): boolean {
  return programStarted;
}

/**
 * Restart the simulation timing
 */
export function restartTiming(): void {
  simulationTime = 0n;
  lastTimeUpdate = BigInt(Date.now() * 1000); // Convert to microseconds
  timingPaused = false;
}

/**
 * Pause the simulation timing
 */
export function pauseTiming(): void {
  if (!timingPaused) {
    // Update the simulation time before pausing
    updateSimulationTime();
    timingPaused = true;
  }
}

/**
 * Resume the simulation timing
 */
export function resumeTiming(): void {
  if (timingPaused) {
    // Reset the last time update when resuming
    lastTimeUpdate = BigInt(Date.now() * 1000); // Convert to microseconds
    timingPaused = false;
  }
}

/**
 * Check if the simulation timing is paused
 * 
 * @returns True if the simulation timing is paused
 */
export function isTimingPaused(): boolean {
  return timingPaused;
}

/**
 * Step the simulation timing by a specified amount
 * 
 * @param delta The amount to step in microseconds
 */
export function stepTiming(delta: number | bigint): void {
  if (!timingPaused) {
    pauseTiming();
  }
  
  // Convert delta to bigint if it's a number
  const deltaBigInt = typeof delta === 'number' ? BigInt(delta) : delta;
  
  // Add the delta to the simulation time
  simulationTime += deltaBigInt;
}

/**
 * Step the simulation timing asynchronously by a specified amount
 * 
 * @param delta The amount to step in microseconds
 */
export function stepTimingAsync(delta: number | bigint): void {
  // This is the same as stepTiming in our implementation
  // In a real implementation, this would be asynchronous
  stepTiming(delta);
}

/**
 * Get the current simulation time in microseconds
 * 
 * @returns The current simulation time in microseconds
 */
export function getFPGATime(): bigint {
  if (timingPaused) {
    return simulationTime;
  } else {
    updateSimulationTime();
    return simulationTime;
  }
}

/**
 * Get the current simulation time in seconds
 * 
 * @returns The current simulation time in seconds
 */
export function getFPGATimestamp(): number {
  return Number(getFPGATime()) / 1_000_000;
}

/**
 * Update the simulation time based on the current time
 */
function updateSimulationTime(): void {
  const now = BigInt(Date.now() * 1000); // Convert to microseconds
  const delta = now - lastTimeUpdate;
  simulationTime += delta;
  lastTimeUpdate = now;
}

/**
 * Reset all simulation handles
 */
export function resetHandles(): void {
  // This will be implemented when we add handle management
}
