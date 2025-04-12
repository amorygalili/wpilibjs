export * from './encoder';
export * from './decoder';

/**
 * NetworkTables 4.1 WebSocket subprotocols
 */
export const NT4_SUBPROTOCOL = 'v4.1.networktables.first.wpi.edu';
export const NT4_FALLBACK_SUBPROTOCOL = 'networktables.first.wpi.edu';
export const RTT_SUBPROTOCOL = 'rtt.networktables.first.wpi.edu';

/**
 * NetworkTables 4.1 default ports
 */
export const DEFAULT_PORT = 5810;
export const DEFAULT_SECURE_PORT = 5811;

/**
 * NetworkTables 4.1 ping interval (ms)
 */
export const PING_INTERVAL = 200;

/**
 * NetworkTables 4.1 ping timeout (ms)
 */
export const PING_TIMEOUT = 1000;
