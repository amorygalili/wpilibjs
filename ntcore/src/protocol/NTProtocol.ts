/**
 * NetworkTables protocol version
 */
export const NT_PROTOCOL_VERSION = 0x0300; // Version 3.0

/**
 * NetworkTables protocol revision
 */
export const NT_PROTOCOL_REVISION = 0x01; // Revision 1

/**
 * NetworkTables protocol message types
 */
export enum NTMessageType {
  // Keep-alive message
  KeepAlive = 0x00,
  
  // Client hello message
  ClientHello = 0x01,
  
  // Protocol version unsupported message
  ProtoUnsupported = 0x02,
  
  // Server hello complete message
  ServerHelloComplete = 0x03,
  
  // Server hello message
  ServerHello = 0x04,
  
  // Client hello complete message
  ClientHelloComplete = 0x05,
  
  // Entry assignment message
  EntryAssignment = 0x10,
  
  // Entry update message
  EntryUpdate = 0x11,
  
  // Entry flags update message
  FlagsUpdate = 0x12,
  
  // Entry delete message
  EntryDelete = 0x13,
  
  // Clear all entries message
  ClearEntries = 0x14,
  
  // RPC definition message
  RpcDefinition = 0x20,
  
  // RPC execution message
  RpcExecution = 0x21
}

/**
 * NetworkTables protocol message flags
 */
export enum NTMessageFlags {
  None = 0x00,
  
  // Entry is persistent
  Persistent = 0x01
}

/**
 * NetworkTables protocol error codes
 */
export enum NTErrorCode {
  // No error
  None = 0x00,
  
  // Protocol version unsupported
  ProtocolUnsupported = 0x01,
  
  // Message type unsupported
  MessageTypeUnsupported = 0x02,
  
  // Message format error
  MessageFormatError = 0x03,
  
  // Entry already exists
  EntryExists = 0x10,
  
  // Entry does not exist
  EntryNotFound = 0x11,
  
  // Entry type mismatch
  EntryTypeMismatch = 0x12,
  
  // Entry value invalid
  EntryValueInvalid = 0x13,
  
  // RPC definition already exists
  RpcDefinitionExists = 0x20,
  
  // RPC definition does not exist
  RpcDefinitionNotFound = 0x21,
  
  // RPC execution failed
  RpcExecutionFailed = 0x22
}

/**
 * NetworkTables protocol message header
 */
export interface NTMessageHeader {
  /** Message type */
  type: NTMessageType;
  
  /** Message length (not including header) */
  length: number;
}

/**
 * NetworkTables protocol keep-alive message
 */
export interface NTKeepAliveMessage {
  /** Message type (always KeepAlive) */
  type: NTMessageType.KeepAlive;
}

/**
 * NetworkTables protocol client hello message
 */
export interface NTClientHelloMessage {
  /** Message type (always ClientHello) */
  type: NTMessageType.ClientHello;
  
  /** Protocol version */
  protocolVersion: number;
  
  /** Client name */
  clientName: string;
}

/**
 * NetworkTables protocol protocol unsupported message
 */
export interface NTProtoUnsupportedMessage {
  /** Message type (always ProtoUnsupported) */
  type: NTMessageType.ProtoUnsupported;
  
  /** Server supported protocol version */
  serverVersion: number;
}

/**
 * NetworkTables protocol server hello complete message
 */
export interface NTServerHelloCompleteMessage {
  /** Message type (always ServerHelloComplete) */
  type: NTMessageType.ServerHelloComplete;
}

/**
 * NetworkTables protocol server hello message
 */
export interface NTServerHelloMessage {
  /** Message type (always ServerHello) */
  type: NTMessageType.ServerHello;
  
  /** Server identity */
  serverIdentity: string;
  
  /** Client identity */
  clientIdentity: string;
}

/**
 * NetworkTables protocol client hello complete message
 */
export interface NTClientHelloCompleteMessage {
  /** Message type (always ClientHelloComplete) */
  type: NTMessageType.ClientHelloComplete;
}

/**
 * NetworkTables protocol entry assignment message
 */
export interface NTEntryAssignmentMessage {
  /** Message type (always EntryAssignment) */
  type: NTMessageType.EntryAssignment;
  
  /** Entry name */
  name: string;
  
  /** Entry type */
  entryType: number;
  
  /** Entry ID */
  entryId: number;
  
  /** Entry sequence number */
  sequenceNumber: number;
  
  /** Entry flags */
  flags: number;
  
  /** Entry value */
  value: any;
}

/**
 * NetworkTables protocol entry update message
 */
export interface NTEntryUpdateMessage {
  /** Message type (always EntryUpdate) */
  type: NTMessageType.EntryUpdate;
  
  /** Entry ID */
  entryId: number;
  
  /** Entry sequence number */
  sequenceNumber: number;
  
  /** Entry value */
  value: any;
}

/**
 * NetworkTables protocol flags update message
 */
export interface NTFlagsUpdateMessage {
  /** Message type (always FlagsUpdate) */
  type: NTMessageType.FlagsUpdate;
  
  /** Entry ID */
  entryId: number;
  
  /** Entry flags */
  flags: number;
}

/**
 * NetworkTables protocol entry delete message
 */
export interface NTEntryDeleteMessage {
  /** Message type (always EntryDelete) */
  type: NTMessageType.EntryDelete;
  
  /** Entry ID */
  entryId: number;
}

/**
 * NetworkTables protocol clear all entries message
 */
export interface NTClearEntriesMessage {
  /** Message type (always ClearEntries) */
  type: NTMessageType.ClearEntries;
}

/**
 * NetworkTables protocol RPC definition message
 */
export interface NTRpcDefinitionMessage {
  /** Message type (always RpcDefinition) */
  type: NTMessageType.RpcDefinition;
  
  /** Entry name */
  name: string;
  
  /** Entry ID */
  entryId: number;
  
  /** RPC definition */
  definition: Buffer;
}

/**
 * NetworkTables protocol RPC execution message
 */
export interface NTRpcExecutionMessage {
  /** Message type (always RpcExecution) */
  type: NTMessageType.RpcExecution;
  
  /** Entry ID */
  entryId: number;
  
  /** Unique ID */
  uniqueId: number;
  
  /** RPC parameters */
  parameters: Buffer;
}

/**
 * NetworkTables protocol message
 */
export type NTMessage =
  | NTKeepAliveMessage
  | NTClientHelloMessage
  | NTProtoUnsupportedMessage
  | NTServerHelloCompleteMessage
  | NTServerHelloMessage
  | NTClientHelloCompleteMessage
  | NTEntryAssignmentMessage
  | NTEntryUpdateMessage
  | NTFlagsUpdateMessage
  | NTEntryDeleteMessage
  | NTClearEntriesMessage
  | NTRpcDefinitionMessage
  | NTRpcExecutionMessage;
