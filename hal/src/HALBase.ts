import { HALRuntimeType, HALStatus } from './HALTypes';

/**
 * Global HAL initialization state
 */
let halInitialized = false;

/**
 * Current HAL runtime type
 */
let runtimeType = HALRuntimeType.Simulation;

/**
 * Initialize the HAL. This must be called before any other HAL functions.
 * 
 * @param timeout Timeout in milliseconds (not used in simulation)
 * @param mode Mode (not used in simulation)
 * @returns HAL Status code
 */
export function initialize(timeout: number = 500, mode: number = 0): HALStatus {
  if (halInitialized) {
    return 0; // Already initialized
  }
  
  // Initialize all HAL components
  initializeSimulation();
  
  halInitialized = true;
  return 0;
}

/**
 * Check if HAL is initialized
 * 
 * @returns True if HAL is initialized
 */
export function isInitialized(): boolean {
  return halInitialized;
}

/**
 * Get the runtime type (real or simulation)
 * 
 * @returns The current runtime type
 */
export function getRuntimeType(): HALRuntimeType {
  return runtimeType;
}

/**
 * Set the runtime type (real or simulation)
 * 
 * @param type The runtime type to set
 */
export function setRuntimeType(type: HALRuntimeType): void {
  runtimeType = type;
}

/**
 * Initialize simulation components
 */
function initializeSimulation(): void {
  // Initialize simulation data structures
  // This will be expanded as we implement more simulation components
}

/**
 * Report an error to the HAL
 * 
 * @param isError True if this is an error, false if it's a warning
 * @param code Error code
 * @param details Error details
 * @param location Error location
 * @param callStack Call stack
 */
export function report(
  isError: boolean,
  code: number,
  details: string,
  location: string,
  callStack: string
): void {
  // In a real implementation, this would report to the Driver Station
  // For now, just log to console
  if (isError) {
    console.error(`HAL Error [${code}]: ${details} at ${location}\n${callStack}`);
  } else {
    console.warn(`HAL Warning [${code}]: ${details} at ${location}`);
  }
}
