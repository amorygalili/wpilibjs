/**
 * WebSocket message type definitions
 */

/**
 * Base WebSocket message
 */
export interface WSBaseMessage {
  type: string;
  device: string;
  data: Record<string, any>;
}

/**
 * Digital I/O message
 */
export interface WSDIOMessage extends WSBaseMessage {
  type: 'DIO';
  device: string;
  data: {
    '<init'?: boolean;
    '<>value'?: boolean;
    '<pulse_length'?: number;
    '<is_input'?: boolean;
    '<filter_index'?: number;
  };
}

/**
 * PWM message
 */
export interface WSPWMMessage extends WSBaseMessage {
  type: 'PWM';
  device: string;
  data: {
    '<init'?: boolean;
    '<pulse_microsecond'?: number;
    '<speed'?: number;
    '<position'?: number;
    '<period_scale'?: number;
    '<zero_latch'?: boolean;
  };
}

/**
 * Analog Input message
 */
export interface WSAnalogInputMessage extends WSBaseMessage {
  type: 'AI';
  device: string;
  data: {
    '<init'?: boolean;
    '>voltage'?: number;
    '<accumulator_value'?: number;
    '<accumulator_count'?: number;
    '<accumulator_center'?: number;
    '<accumulator_deadband'?: number;
    '<accumulator_init'?: boolean;
    '<average_bits'?: number;
    '<oversample_bits'?: number;
  };
}

/**
 * Analog Output message
 */
export interface WSAnalogOutputMessage extends WSBaseMessage {
  type: 'AO';
  device: string;
  data: {
    '<init'?: boolean;
    '<voltage'?: number;
  };
}

/**
 * Encoder message
 */
export interface WSEncoderMessage extends WSBaseMessage {
  type: 'Encoder';
  device: string;
  data: {
    '<init'?: boolean;
    '<channel_a'?: number;
    '<channel_b'?: number;
    '>count'?: number;
    '>period'?: number;
    '<reset'?: boolean;
    '<max_period'?: number;
    '>direction'?: boolean;
    '<reverse_direction'?: boolean;
    '<samples_to_average'?: number;
  };
}

/**
 * Relay message
 */
export interface WSRelayMessage extends WSBaseMessage {
  type: 'Relay';
  device: string;
  data: {
    '<init_fwd'?: boolean;
    '<init_rev'?: boolean;
    '<fwd'?: boolean;
    '<rev'?: boolean;
  };
}

/**
 * Gyro message
 */
export interface WSGyroMessage extends WSBaseMessage {
  type: 'Gyro';
  device: string;
  data: {
    '<init'?: boolean;
    '>angle'?: number;
    '>rate'?: number;
  };
}

/**
 * Accelerometer message
 */
export interface WSAccelerometerMessage extends WSBaseMessage {
  type: 'Accel';
  device: string;
  data: {
    '<init'?: boolean;
    '<range'?: number;
    '>x'?: number;
    '>y'?: number;
    '>z'?: number;
  };
}

/**
 * Driver Station message
 */
export interface WSDriverStationMessage extends WSBaseMessage {
  type: 'DriverStation';
  device: 'DriverStation';
  data: {
    '<enabled'?: boolean;
    '<autonomous'?: boolean;
    '<test'?: boolean;
    '<estop'?: boolean;
    '<fms'?: boolean;
    '<ds'?: boolean;
    '>new_data'?: boolean;
    '>match_time'?: number;
    '>game_specific_message'?: string;
  };
}

/**
 * Joystick message
 */
export interface WSJoystickMessage extends WSBaseMessage {
  type: 'Joystick';
  device: string;
  data: {
    '>axes'?: number[];
    '>povs'?: number[];
    '>buttons'?: boolean[];
    '<outputs'?: number;
    '<rumble_left'?: number;
    '<rumble_right'?: number;
  };
}

/**
 * HAL message
 */
export interface WSHALMessage extends WSBaseMessage {
  type: 'HAL';
  device: 'HAL';
  data: {
    '>sim_periodic_before'?: boolean;
    '>sim_periodic_after'?: boolean;
  };
}

/**
 * Union of all WebSocket message types
 */
export type WSMessage =
  | WSDIOMessage
  | WSPWMMessage
  | WSAnalogInputMessage
  | WSAnalogOutputMessage
  | WSEncoderMessage
  | WSRelayMessage
  | WSGyroMessage
  | WSAccelerometerMessage
  | WSDriverStationMessage
  | WSJoystickMessage
  | WSHALMessage;
