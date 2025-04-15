/**
 * HAL Types for simulation
 */

/**
 * HAL Handle type
 */
export type HAL_Handle = number;

/**
 * Invalid handle constant
 */
export const HAL_INVALID_HANDLE = 0;

/**
 * HAL Boolean type
 */
export type HAL_Bool = boolean;

/**
 * HAL Runtime Type
 */
export enum HAL_RuntimeType {
  Simulation = 0,
  Real = 1
}

/**
 * HAL Handle types
 */
export enum HAL_HandleEnum {
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
  Encoder = 13,
  Compressor = 14,
  Solenoid = 15,
  AnalogGyro = 16,
  Vendor = 17,
  SimulationJni = 18,
  CAN = 19,
  SerialPort = 20,
  DutyCycle = 21,
  DMA = 22,
  AddressableLED = 23,
  CTREPCM = 24,
  CTREPDP = 25,
  REVPDH = 26,
  REVPH = 27
}

/**
 * HAL Value type
 */
export enum HAL_ValueType {
  Boolean = 0,
  Double = 1,
  Enum = 2,
  Int = 3,
  Long = 4
}

/**
 * HAL Value union
 */
export type HAL_Value = {
  type: HAL_ValueType.Boolean;
  data: boolean;
} | {
  type: HAL_ValueType.Double;
  data: number;
} | {
  type: HAL_ValueType.Enum;
  data: number;
} | {
  type: HAL_ValueType.Int;
  data: number;
} | {
  type: HAL_ValueType.Long;
  data: bigint;
};

/**
 * HAL Value creation helpers
 */
export const HAL_MakeBoolean = (value: boolean): HAL_Value => ({
  type: HAL_ValueType.Boolean,
  data: value
});

export const HAL_MakeDouble = (value: number): HAL_Value => ({
  type: HAL_ValueType.Double,
  data: value
});

export const HAL_MakeEnum = (value: number): HAL_Value => ({
  type: HAL_ValueType.Enum,
  data: value
});

export const HAL_MakeInt = (value: number): HAL_Value => ({
  type: HAL_ValueType.Int,
  data: value
});

export const HAL_MakeLong = (value: bigint): HAL_Value => ({
  type: HAL_ValueType.Long,
  data: value
});

/**
 * HAL Callback types
 */
export type HAL_NotifyCallback = (name: string, param: any, value: HAL_Value) => void;
export type HAL_BufferCallback = (name: string, param: any, buffer: Uint8Array, count: number) => void;
export type HAL_ConstBufferCallback = (name: string, param: any, buffer: Uint8Array, count: number) => void;

/**
 * HAL Accelerometer Range
 */
export enum HAL_AccelerometerRange {
  Range_2G = 0,
  Range_4G = 1,
  Range_8G = 2
}

/**
 * HAL Addressable LED Data
 */
export interface HAL_AddressableLEDData {
  r: number;
  g: number;
  b: number;
}

/**
 * HAL CAN Stream Message
 */
export interface HAL_CANStreamMessage {
  messageID: number;
  timeStamp: number;
  data: Uint8Array;
  dataSize: number;
}

/**
 * HAL Compressor Config Type
 */
export enum HAL_CompressorConfigType {
  Disabled = 0,
  Digital = 1,
  Analog = 2,
  Hybrid = 3
}

/**
 * HAL Joystick Axes
 */
export const HAL_kMaxJoystickAxes = 12;

/**
 * HAL Joystick POVs
 */
export const HAL_kMaxJoystickPOVs = 12;

/**
 * HAL Joystick Buttons
 */
export const HAL_kMaxJoystickButtons = 32;

/**
 * HAL DIO Channels
 */
export const HAL_kNumDigitalChannels = 31;

/**
 * HAL Analog Input Channels
 */
export const HAL_kNumAnalogInputs = 8;

/**
 * HAL Analog Output Channels
 */
export const HAL_kNumAnalogOutputs = 2;

/**
 * HAL PWM Channels
 */
export const HAL_kNumPWMChannels = 20;

/**
 * HAL Relay Channels
 */
export const HAL_kNumRelayChannels = 8;

/**
 * HAL Solenoid Channels
 */
export const HAL_kNumSolenoidChannels = 8;

/**
 * HAL PD Channels
 */
export const HAL_kNumPDChannels = 24;

/**
 * HAL Addressable LED Max Length
 */
export const HAL_kAddressableLEDMaxLength = 5460;
