import { NTValue, NTValueType } from '../types/NTTypes';
import {
  NTClientHelloCompleteMessage,
  NTClientHelloMessage,
  NTClearEntriesMessage,
  NTEntryAssignmentMessage,
  NTEntryDeleteMessage,
  NTEntryUpdateMessage,
  NTFlagsUpdateMessage,
  NTKeepAliveMessage,
  NTMessage,
  NTMessageHeader,
  NTMessageType,
  NTProtoUnsupportedMessage,
  NTRpcDefinitionMessage,
  NTRpcExecutionMessage,
  NTServerHelloCompleteMessage,
  NTServerHelloMessage
} from './NTProtocol';

/**
 * NetworkTables protocol deserializer
 *
 * Deserializes NetworkTables protocol messages from binary format
 */
export class NTDeserializer {
  /**
   * Deserialize a message from a buffer
   *
   * @param buffer Buffer containing the message
   * @returns Deserialized message and the number of bytes consumed
   */
  static deserializeMessage(buffer: Buffer): { message: NTMessage; bytesConsumed: number } {
    // Check if the buffer is large enough for a header
    if (buffer.length < 3) {
      throw new Error('Buffer too small for message header');
    }

    // Deserialize the header
    const header = NTDeserializer.deserializeHeader(buffer);

    // Check if the buffer is large enough for the entire message
    if (buffer.length < 3 + header.length) {
      throw new Error('Buffer too small for message');
    }

    // Deserialize the message based on the type
    let message: NTMessage;
    switch (header.type) {
      case NTMessageType.KeepAlive:
        message = NTDeserializer.deserializeKeepAlive(buffer);
        break;
      case NTMessageType.ClientHello:
        message = NTDeserializer.deserializeClientHello(buffer);
        break;
      case NTMessageType.ProtoUnsupported:
        message = NTDeserializer.deserializeProtoUnsupported(buffer);
        break;
      case NTMessageType.ServerHelloComplete:
        message = NTDeserializer.deserializeServerHelloComplete(buffer);
        break;
      case NTMessageType.ServerHello:
        message = NTDeserializer.deserializeServerHello(buffer);
        break;
      case NTMessageType.ClientHelloComplete:
        message = NTDeserializer.deserializeClientHelloComplete(buffer);
        break;
      case NTMessageType.EntryAssignment:
        message = NTDeserializer.deserializeEntryAssignment(buffer);
        break;
      case NTMessageType.EntryUpdate:
        message = NTDeserializer.deserializeEntryUpdate(buffer);
        break;
      case NTMessageType.FlagsUpdate:
        message = NTDeserializer.deserializeFlagsUpdate(buffer);
        break;
      case NTMessageType.EntryDelete:
        message = NTDeserializer.deserializeEntryDelete(buffer);
        break;
      case NTMessageType.ClearEntries:
        message = NTDeserializer.deserializeClearEntries(buffer);
        break;
      case NTMessageType.RpcDefinition:
        message = NTDeserializer.deserializeRpcDefinition(buffer);
        break;
      case NTMessageType.RpcExecution:
        message = NTDeserializer.deserializeRpcExecution(buffer);
        break;
      default:
        throw new Error(`Unknown message type: ${header.type}`);
    }

    return { message, bytesConsumed: 3 + header.length };
  }

  /**
   * Deserialize a message header from a buffer
   *
   * @param buffer Buffer containing the header
   * @returns Deserialized header
   */
  static deserializeHeader(buffer: Buffer): NTMessageHeader {
    const type = buffer.readUInt8(0) as NTMessageType;
    const length = buffer.readUInt16BE(1);
    return { type, length };
  }

  /**
   * Deserialize a keep-alive message from a buffer
   *
   * @param buffer Buffer containing the message
   * @returns Deserialized message
   */
  static deserializeKeepAlive(buffer: Buffer): NTKeepAliveMessage {
    return { type: NTMessageType.KeepAlive };
  }

  /**
   * Deserialize a client hello message from a buffer
   *
   * @param buffer Buffer containing the message
   * @returns Deserialized message
   */
  static deserializeClientHello(buffer: Buffer): NTClientHelloMessage {
    const protocolVersion = buffer.readUInt16BE(3);
    const clientNameLength = buffer.readUInt16BE(5);
    const clientName = buffer.toString('utf8', 7, 7 + clientNameLength);
    return { type: NTMessageType.ClientHello, protocolVersion, clientName };
  }

  /**
   * Deserialize a protocol unsupported message from a buffer
   *
   * @param buffer Buffer containing the message
   * @returns Deserialized message
   */
  static deserializeProtoUnsupported(buffer: Buffer): NTProtoUnsupportedMessage {
    const serverVersion = buffer.readUInt16BE(3);
    return { type: NTMessageType.ProtoUnsupported, serverVersion };
  }

  /**
   * Deserialize a server hello complete message from a buffer
   *
   * @param buffer Buffer containing the message
   * @returns Deserialized message
   */
  static deserializeServerHelloComplete(buffer: Buffer): NTServerHelloCompleteMessage {
    return { type: NTMessageType.ServerHelloComplete };
  }

  /**
   * Deserialize a server hello message from a buffer
   *
   * @param buffer Buffer containing the message
   * @returns Deserialized message
   */
  static deserializeServerHello(buffer: Buffer): NTServerHelloMessage {
    const serverIdentityLength = buffer.readUInt16BE(3);
    const serverIdentity = buffer.toString('utf8', 5, 5 + serverIdentityLength);
    const clientIdentityLength = buffer.readUInt16BE(5 + serverIdentityLength);
    const clientIdentity = buffer.toString('utf8', 7 + serverIdentityLength, 7 + serverIdentityLength + clientIdentityLength);
    return { type: NTMessageType.ServerHello, serverIdentity, clientIdentity };
  }

  /**
   * Deserialize a client hello complete message from a buffer
   *
   * @param buffer Buffer containing the message
   * @returns Deserialized message
   */
  static deserializeClientHelloComplete(buffer: Buffer): NTClientHelloCompleteMessage {
    return { type: NTMessageType.ClientHelloComplete };
  }

  /**
   * Deserialize an entry assignment message from a buffer
   *
   * @param buffer Buffer containing the message
   * @returns Deserialized message
   */
  static deserializeEntryAssignment(buffer: Buffer): NTEntryAssignmentMessage {
    // Check if buffer has enough bytes for the message type (1 byte) and message length (2 bytes)
    if (buffer.length < 3) {
      throw new Error(`Buffer too small for entry assignment header: ${buffer.length} bytes`);
    }

    let offset = 3;

    // Check if buffer has enough bytes for the name length (2 bytes)
    if (buffer.length < offset + 2) {
      throw new Error(`Buffer too small for entry name length: ${buffer.length} bytes`);
    }

    // Read the name
    const nameLength = buffer.readUInt16BE(offset);
    offset += 2;

    // Check if buffer has enough bytes for the name
    if (buffer.length < offset + nameLength) {
      throw new Error(`Buffer too small for entry name: ${buffer.length} bytes, need ${offset + nameLength} bytes`);
    }

    const name = buffer.toString('utf8', offset, offset + nameLength);
    offset += nameLength;

    // Check if buffer has enough bytes for the type (1 byte)
    if (buffer.length < offset + 1) {
      throw new Error(`Buffer too small for entry type: ${buffer.length} bytes`);
    }

    // Read the type
    const entryType = buffer.readUInt8(offset);
    offset += 1;

    // Check if buffer has enough bytes for the entry ID (2 bytes)
    if (buffer.length < offset + 2) {
      throw new Error(`Buffer too small for entry ID: ${buffer.length} bytes`);
    }

    // Read the entry ID
    const entryId = buffer.readUInt16BE(offset);
    offset += 2;

    // Check if buffer has enough bytes for the sequence number (2 bytes)
    if (buffer.length < offset + 2) {
      throw new Error(`Buffer too small for sequence number: ${buffer.length} bytes`);
    }

    // Read the sequence number
    const sequenceNumber = buffer.readUInt16BE(offset);
    offset += 2;

    // Check if buffer has enough bytes for the flags (1 byte)
    if (buffer.length < offset + 1) {
      throw new Error(`Buffer too small for flags: ${buffer.length} bytes`);
    }

    // Read the flags
    const flags = buffer.readUInt8(offset);
    offset += 1;

    // Read the value
    const { value, bytesConsumed } = NTDeserializer.deserializeValue(buffer.slice(offset), entryType);

    return { type: NTMessageType.EntryAssignment, name, entryType, entryId, sequenceNumber, flags, value };
  }

  /**
   * Deserialize an entry update message from a buffer
   *
   * @param buffer Buffer containing the message
   * @returns Deserialized message
   */
  static deserializeEntryUpdate(buffer: Buffer): NTEntryUpdateMessage {
    // Check if buffer has enough bytes for the message type (1 byte) and message length (2 bytes)
    if (buffer.length < 3) {
      throw new Error(`Buffer too small for entry update header: ${buffer.length} bytes`);
    }

    let offset = 3;

    // Check if buffer has enough bytes for the entry ID (2 bytes)
    if (buffer.length < offset + 2) {
      throw new Error(`Buffer too small for entry ID: ${buffer.length} bytes`);
    }

    // Read the entry ID
    const entryId = buffer.readUInt16BE(offset);
    offset += 2;

    // Check if buffer has enough bytes for the sequence number (2 bytes)
    if (buffer.length < offset + 2) {
      throw new Error(`Buffer too small for sequence number: ${buffer.length} bytes`);
    }

    // Read the sequence number
    const sequenceNumber = buffer.readUInt16BE(offset);
    offset += 2;

    // Read the value type (1 byte)
    if (buffer.length < offset + 1) {
      throw new Error(`Buffer too small for value type: ${buffer.length} bytes`);
    }

    const valueType = buffer.readUInt8(offset);
    offset += 1;

    // Read the value
    const { value } = NTDeserializer.deserializeValue(buffer.slice(offset), valueType);

    return { type: NTMessageType.EntryUpdate, entryId, sequenceNumber, value };
  }

  /**
   * Deserialize a flags update message from a buffer
   *
   * @param buffer Buffer containing the message
   * @returns Deserialized message
   */
  static deserializeFlagsUpdate(buffer: Buffer): NTFlagsUpdateMessage {
    const entryId = buffer.readUInt16BE(3);
    const flags = buffer.readUInt8(5);
    return { type: NTMessageType.FlagsUpdate, entryId, flags };
  }

  /**
   * Deserialize an entry delete message from a buffer
   *
   * @param buffer Buffer containing the message
   * @returns Deserialized message
   */
  static deserializeEntryDelete(buffer: Buffer): NTEntryDeleteMessage {
    const entryId = buffer.readUInt16BE(3);
    return { type: NTMessageType.EntryDelete, entryId };
  }

  /**
   * Deserialize a clear entries message from a buffer
   *
   * @param buffer Buffer containing the message
   * @returns Deserialized message
   */
  static deserializeClearEntries(buffer: Buffer): NTClearEntriesMessage {
    return { type: NTMessageType.ClearEntries };
  }

  /**
   * Deserialize an RPC definition message from a buffer
   *
   * @param buffer Buffer containing the message
   * @returns Deserialized message
   */
  static deserializeRpcDefinition(buffer: Buffer): NTRpcDefinitionMessage {
    let offset = 3;

    // Read the name
    const nameLength = buffer.readUInt16BE(offset);
    offset += 2;
    const name = buffer.toString('utf8', offset, offset + nameLength);
    offset += nameLength;

    // Read the entry ID
    const entryId = buffer.readUInt16BE(offset);
    offset += 2;

    // Read the definition
    const definitionLength = buffer.readUInt16BE(offset);
    offset += 2;
    const definition = Buffer.alloc(definitionLength);
    buffer.copy(definition, 0, offset, offset + definitionLength);

    return { type: NTMessageType.RpcDefinition, name, entryId, definition };
  }

  /**
   * Deserialize an RPC execution message from a buffer
   *
   * @param buffer Buffer containing the message
   * @returns Deserialized message
   */
  static deserializeRpcExecution(buffer: Buffer): NTRpcExecutionMessage {
    let offset = 3;

    // Read the entry ID
    const entryId = buffer.readUInt16BE(offset);
    offset += 2;

    // Read the unique ID
    const uniqueId = buffer.readUInt32BE(offset);
    offset += 4;

    // Read the parameters
    const parametersLength = buffer.readUInt16BE(offset);
    offset += 2;
    const parameters = Buffer.alloc(parametersLength);
    buffer.copy(parameters, 0, offset, offset + parametersLength);

    return { type: NTMessageType.RpcExecution, entryId, uniqueId, parameters };
  }

  /**
   * Deserialize a value from a buffer
   *
   * @param buffer Buffer containing the value
   * @param type Value type (optional, will be inferred if not provided)
   * @returns Deserialized value and the number of bytes consumed
   */
  static deserializeValue(buffer: Buffer, type?: number): { value: NTValue; bytesConsumed: number } {
    // If type is not provided, infer it from the first byte
    if (type === undefined) {
      // Check if buffer has enough bytes for the type (1 byte)
      if (buffer.length < 1) {
        throw new Error(`Buffer too small for value type: ${buffer.length} bytes`);
      }
      type = buffer.readUInt8(0);
      buffer = buffer.slice(1);
    }

    // Validate the type
    if (type < 0 || type > 7) {
      console.warn(`Received invalid value type: ${type}, defaulting to Double`);
      type = NTValueType.Double;
    }

    // Deserialize the value based on the type
    switch (type) {
      case NTValueType.Boolean:
        return NTDeserializer.deserializeBoolean(buffer);
      case NTValueType.Double:
        return NTDeserializer.deserializeDouble(buffer);
      case NTValueType.String:
        return NTDeserializer.deserializeString(buffer);
      case NTValueType.Raw:
        return NTDeserializer.deserializeRaw(buffer);
      case NTValueType.BooleanArray:
        return NTDeserializer.deserializeBooleanArray(buffer);
      case NTValueType.DoubleArray:
        return NTDeserializer.deserializeDoubleArray(buffer);
      case NTValueType.StringArray:
        return NTDeserializer.deserializeStringArray(buffer);
      case NTValueType.RPC:
        return NTDeserializer.deserializeRaw(buffer);
      default:
        console.warn(`Unsupported value type: ${type}, defaulting to Double`);
        // Default to Double with a value of 0
        return { value: 0, bytesConsumed: 0 };
    }
  }

  /**
   * Deserialize a boolean value from a buffer
   *
   * @param buffer Buffer containing the value
   * @returns Deserialized value and the number of bytes consumed
   */
  static deserializeBoolean(buffer: Buffer): { value: boolean; bytesConsumed: number } {
    // Check if buffer has enough bytes for a boolean (1 byte)
    if (buffer.length < 1) {
      throw new Error(`Buffer too small for boolean: ${buffer.length} bytes`);
    }
    const value = buffer.readUInt8(0) !== 0;
    return { value, bytesConsumed: 1 };
  }

  /**
   * Deserialize a double value from a buffer
   *
   * @param buffer Buffer containing the value
   * @returns Deserialized value and the number of bytes consumed
   */
  static deserializeDouble(buffer: Buffer): { value: number; bytesConsumed: number } {
    // Check if buffer has enough bytes for a double (8 bytes)
    if (buffer.length < 8) {
      throw new Error(`Buffer too small for double: ${buffer.length} bytes`);
    }
    const value = buffer.readDoubleLE(0);
    return { value, bytesConsumed: 8 };
  }

  /**
   * Deserialize a string value from a buffer
   *
   * @param buffer Buffer containing the value
   * @returns Deserialized value and the number of bytes consumed
   */
  static deserializeString(buffer: Buffer): { value: string; bytesConsumed: number } {
    // Check if buffer has enough bytes for the length (2 bytes)
    if (buffer.length < 2) {
      throw new Error(`Buffer too small for string length: ${buffer.length} bytes`);
    }
    const length = buffer.readUInt16BE(0);

    // Check if buffer has enough bytes for the string
    if (buffer.length < 2 + length) {
      throw new Error(`Buffer too small for string: ${buffer.length} bytes, need ${2 + length} bytes`);
    }

    const value = buffer.toString('utf8', 2, 2 + length);
    return { value, bytesConsumed: 2 + length };
  }

  /**
   * Deserialize a raw value from a buffer
   *
   * @param buffer Buffer containing the value
   * @returns Deserialized value and the number of bytes consumed
   */
  static deserializeRaw(buffer: Buffer): { value: Buffer; bytesConsumed: number } {
    // Check if buffer has enough bytes for the length (2 bytes)
    if (buffer.length < 2) {
      throw new Error(`Buffer too small for raw data length: ${buffer.length} bytes`);
    }
    const length = buffer.readUInt16BE(0);

    // Check if buffer has enough bytes for the raw data
    if (buffer.length < 2 + length) {
      throw new Error(`Buffer too small for raw data: ${buffer.length} bytes, need ${2 + length} bytes`);
    }

    const value = Buffer.alloc(length);
    buffer.copy(value, 0, 2, 2 + length);
    return { value, bytesConsumed: 2 + length };
  }

  /**
   * Deserialize a boolean array value from a buffer
   *
   * @param buffer Buffer containing the value
   * @returns Deserialized value and the number of bytes consumed
   */
  static deserializeBooleanArray(buffer: Buffer): { value: boolean[]; bytesConsumed: number } {
    // Check if buffer has enough bytes for the length (2 bytes)
    if (buffer.length < 2) {
      throw new Error(`Buffer too small for boolean array length: ${buffer.length} bytes`);
    }
    const length = buffer.readUInt16BE(0);

    // Check if buffer has enough bytes for the boolean array
    if (buffer.length < 2 + length) {
      throw new Error(`Buffer too small for boolean array: ${buffer.length} bytes, need ${2 + length} bytes`);
    }

    const value: boolean[] = [];
    for (let i = 0; i < length; i++) {
      value.push(buffer.readUInt8(2 + i) !== 0);
    }
    return { value, bytesConsumed: 2 + length };
  }

  /**
   * Deserialize a double array value from a buffer
   *
   * @param buffer Buffer containing the value
   * @returns Deserialized value and the number of bytes consumed
   */
  static deserializeDoubleArray(buffer: Buffer): { value: number[]; bytesConsumed: number } {
    // Check if buffer has enough bytes for the length (2 bytes)
    if (buffer.length < 2) {
      throw new Error(`Buffer too small for double array length: ${buffer.length} bytes`);
    }
    const length = buffer.readUInt16BE(0);

    // Check if buffer has enough bytes for the double array (each double is 8 bytes)
    if (buffer.length < 2 + length * 8) {
      throw new Error(`Buffer too small for double array: ${buffer.length} bytes, need ${2 + length * 8} bytes`);
    }

    const value: number[] = [];
    for (let i = 0; i < length; i++) {
      value.push(buffer.readDoubleLE(2 + i * 8));
    }
    return { value, bytesConsumed: 2 + length * 8 };
  }

  /**
   * Deserialize a string array value from a buffer
   *
   * @param buffer Buffer containing the value
   * @returns Deserialized value and the number of bytes consumed
   */
  static deserializeStringArray(buffer: Buffer): { value: string[]; bytesConsumed: number } {
    // Check if buffer has enough bytes for the length (2 bytes)
    if (buffer.length < 2) {
      throw new Error(`Buffer too small for string array length: ${buffer.length} bytes`);
    }
    const length = buffer.readUInt16BE(0);

    const value: string[] = [];
    let offset = 2;

    for (let i = 0; i < length; i++) {
      // Check if buffer has enough bytes for the string length (2 bytes)
      if (buffer.length < offset + 2) {
        throw new Error(`Buffer too small for string length at index ${i}: ${buffer.length} bytes, offset ${offset}`);
      }

      const stringLength = buffer.readUInt16BE(offset);
      offset += 2;

      // Check if buffer has enough bytes for the string
      if (buffer.length < offset + stringLength) {
        throw new Error(`Buffer too small for string at index ${i}: ${buffer.length} bytes, need ${offset + stringLength} bytes`);
      }

      value.push(buffer.toString('utf8', offset, offset + stringLength));
      offset += stringLength;
    }

    return { value, bytesConsumed: offset };
  }
}
