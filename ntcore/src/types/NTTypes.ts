/**
 * NetworkTables value types
 */
export enum NTValueType {
  Unassigned = 0,
  Boolean = 1,
  Double = 2,
  String = 3,
  Raw = 4,
  BooleanArray = 5,
  DoubleArray = 6,
  StringArray = 7,
  RPC = 8
}

/**
 * NetworkTables value
 */
export type NTValue =
  | boolean
  | number
  | string
  | Buffer
  | Uint8Array
  | boolean[]
  | number[]
  | string[];

/**
 * NetworkTables entry flags
 */
export enum NTEntryFlags {
  None = 0,
  Persistent = 1
}

/**
 * NetworkTables connection status
 */
export enum NTConnectionStatus {
  Disconnected = 0,
  Connecting = 1,
  Connected = 2
}

/**
 * NetworkTables connection info
 */
export interface NTConnectionInfo {
  /** Remote identifier (e.g. IP address) */
  remoteId: string;
  /** Protocol version */
  protocolVersion: number;
}

/**
 * NetworkTables entry info
 */
export interface NTEntryInfo {
  /** Entry name */
  name: string;
  /** Entry type */
  type: NTValueType;
  /** Entry flags */
  flags: NTEntryFlags;
  /** Last change time (in microseconds since NT epoch) */
  lastChange: bigint;
}

/**
 * NetworkTables entry notification
 */
export interface NTEntryNotification {
  /** Entry name */
  name: string;
  /** Entry value */
  value: NTValue;
  /** Entry flags */
  flags: NTEntryFlags;
  /** Timestamp (in microseconds since NT epoch) */
  timestamp: bigint;
  /** Whether this is a new entry */
  isNew?: boolean;
  /** Whether this entry is being deleted */
  isDelete?: boolean;
}

/**
 * NetworkTables connection notification
 */
export interface NTConnectionNotification {
  /** Connection status */
  connected: boolean;
  /** Connection info */
  conn: NTConnectionInfo;
}

/**
 * NetworkTables RPC definition
 */
export interface NTRpcDefinition {
  /** RPC name */
  name: string;
  /** RPC version */
  version: number;
}

/**
 * NetworkTables RPC call info
 */
export interface NTRpcCallInfo {
  /** RPC definition */
  rpc: NTRpcDefinition;
  /** Call UID */
  callUid: number;
  /** Parameters */
  params: Buffer;
}

/**
 * NetworkTables RPC response info
 */
export interface NTRpcResponseInfo {
  /** RPC definition */
  rpc: NTRpcDefinition;
  /** Call UID */
  callUid: number;
  /** Result */
  result: Buffer;
  /** Error message (empty if no error) */
  error: string;
}

/**
 * NetworkTables entry listener options
 */
export interface NTEntryListenerOptions {
  /** Listen for value changes */
  notifyOnUpdate?: boolean;
  /** Listen for new entries */
  notifyOnNew?: boolean;
  /** Listen for entry deletions */
  notifyOnDelete?: boolean;
  /** Listen for entry flag changes */
  notifyOnFlagsChange?: boolean;
  /** Listen for immediate notifications */
  notifyImmediately?: boolean;
}

/**
 * NetworkTables entry listener
 */
export type NTEntryListener = (notification: NTEntryNotification) => void;

/**
 * NetworkTables connection listener
 */
export type NTConnectionListener = (notification: NTConnectionNotification) => void;

/**
 * NetworkTables RPC callback
 */
export type NTRpcCallback = (callInfo: NTRpcCallInfo) => Promise<Buffer>;
