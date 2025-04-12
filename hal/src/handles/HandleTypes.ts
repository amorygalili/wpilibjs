import { HALHandle } from '../HALTypes';

/**
 * HAL Handle Type Enum
 */
export enum HALHandleType {
  Undefined = 0,
  DIO = 1,
  Port = 2,
  Notifier = 3,
  Interrupt = 4,
  AnalogOutput = 5,
  AnalogInput = 6,
  AnalogTrigger = 7,
  Relay = 8,
  PWM = 9,
  DigitalPWM = 10,
  Counter = 11,
  FPGAEncoder = 12,
  SimulationEncoder = 13,
  Addressable = 14,
  SimDevice = 15,
  CTREPCM = 16,
  REVPH = 17,
  DutyCycle = 18,
  PowerDistribution = 19,
}

/**
 * Get the type of a handle
 * 
 * @param handle The handle to check
 * @returns The type of the handle
 */
export function getHandleType(handle: HALHandle): HALHandleType {
  // In the C++ implementation, this is a bit-shifting operation
  // For TypeScript, we'll use a simpler approach for now
  return (handle >> 24) as HALHandleType;
}

/**
 * Get the index of a handle
 * 
 * @param handle The handle to check
 * @returns The index of the handle
 */
export function getHandleIndex(handle: HALHandle): number {
  // In the C++ implementation, this is a bit-masking operation
  // For TypeScript, we'll use a simpler approach for now
  return handle & 0xFFFFFF;
}

/**
 * Create a handle from a type and index
 * 
 * @param type The handle type
 * @param index The handle index
 * @returns The created handle
 */
export function createHandle(type: HALHandleType, index: number): HALHandle {
  return ((type as number) << 24) | (index & 0xFFFFFF);
}

/**
 * Check if a handle is valid
 * 
 * @param handle The handle to check
 * @returns True if the handle is valid
 */
export function isHandleValid(handle: HALHandle): boolean {
  return handle !== 0 && getHandleType(handle) !== HALHandleType.Undefined;
}
