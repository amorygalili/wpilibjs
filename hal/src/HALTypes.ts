/**
 * HAL Runtime Type
 */
export enum HALRuntimeType {
  /**
   * Running on a real robot
   */
  RealTime = 0,
  
  /**
   * Running in simulation
   */
  Simulation = 1,
}

/**
 * HAL Value Type
 */
export enum HALValueType {
  Unassigned = 0,
  Boolean = 0x01,
  Double = 0x02,
  Enum = 0x04,
  Int = 0x08,
  Long = 0x10,
}

/**
 * HAL Value
 */
export interface HALValue {
  type: HALValueType;
  data: boolean | number | bigint;
}

/**
 * HAL Handle
 */
export type HALHandle = number;

/**
 * HAL Status
 */
export type HALStatus = number;

/**
 * HAL Constants
 */
export const HALConstants = {
  // Digital I/O
  kNumDigitalChannels: 26,
  kNumPWMChannels: 20,
  kNumRelayChannels: 8,
  kNumDIOHeaders: 10,
  
  // Analog I/O
  kNumAnalogInputs: 8,
  kNumAnalogOutputs: 2,
  
  // Solenoid/PCM
  kNumSolenoidChannels: 8,
  kNumPCMModules: 63,
  kNumREVPHModules: 63,
  
  // Power Distribution
  kNumPDModules: 63,
  
  // Simulator
  kSimulationDefaultPeriod: 0.02, // 20ms
};

/**
 * HAL Error Codes
 */
export enum HALErrorCode {
  HAL_SUCCESS = 0,
  HAL_HANDLE_ERROR = -1,
  HAL_SERIAL_PORT_NOT_FOUND = -2,
  HAL_SERIAL_PORT_OPEN_ERROR = -3,
  HAL_SERIAL_PORT_ERROR = -4,
  HAL_CAN_TIMEOUT = -5,
  HAL_CAN_BUFFER_OVERRUN = -6,
  HAL_CAN_DRIVER_ERROR = -7,
  HAL_ERROR = -1000,
}
