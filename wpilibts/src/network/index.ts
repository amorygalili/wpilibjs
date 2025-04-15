/**
 * Network classes for WPILib.
 *
 * This module provides access to NetworkTables and other network-related functionality.
 */

// Export NetworkTables classes from ntcore-client
export { NetworkTableInstance, NetworkTable, NetworkTableEntry } from 'ntcore-client';

// Export the Driver Station WebSocket server
export { DSWebSocketServer, DSMessageType, DSMessage } from './DSWebSocketServer';

// Export NetworkTables WebSocket server
export { NetworkTablesWebSocketServer, ntWebSocketServer, NTMessageType } from './NetworkTablesWebSocketServer';

// Re-export ntcore-client classes for convenience
export {
  NT4_Client
} from 'ntcore-client';
