/**
 * Network classes for WPILib.
 *
 * This module provides access to NetworkTables and other network-related functionality.
 */

// Export our NetworkTables interface
export { NetworkTablesInterface, networkTables } from './NetworkTablesInterface';

// Export the Driver Station WebSocket server
export { DSWebSocketServer, DSMessageType, DSMessage } from './DSWebSocketServer';

// Export NetworkTables WebSocket server
export { NetworkTablesWebSocketServer, ntWebSocketServer, NTMessageType } from './NetworkTablesWebSocketServer';

// Re-export ntcore-client classes for convenience
export {
  NT4_Client
} from 'ntcore-client';
