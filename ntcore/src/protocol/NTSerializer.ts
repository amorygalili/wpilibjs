import { NTValue, NTValueType } from '../types/NTTypes';
import {
  NTClientHelloMessage,
  NTClientHelloCompleteMessage,
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
  NTServerHelloMessage,
  NTServerHelloCompleteMessage
} from './NTProtocol';

/**
 * NetworkTables protocol serializer
 * 
 * Serializes NetworkTables protocol messages to binary format
 */
export class NTSerializer {
  /**
   * Serialize a message to a buffer
   * 
   * @param message Message to serialize
   * @returns Serialized message buffer
   */
  static serializeMessage(message: NTMessage): Buffer {
    switch (message.type) {
      case NTMessageType.KeepAlive:
        return NTSerializer.serializeKeepAlive(message);
      case NTMessageType.ClientHello:
        return NTSerializer.serializeClientHello(message);
      case NTMessageType.ProtoUnsupported:
        return NTSerializer.serializeProtoUnsupported(message);
      case NTMessageType.ServerHelloComplete:
        return NTSerializer.serializeServerHelloComplete(message);
      case NTMessageType.ServerHello:
        return NTSerializer.serializeServerHello(message);
      case NTMessageType.ClientHelloComplete:
        return NTSerializer.serializeClientHelloComplete(message);
      case NTMessageType.EntryAssignment:
        return NTSerializer.serializeEntryAssignment(message);
      case NTMessageType.EntryUpdate:
        return NTSerializer.serializeEntryUpdate(message);
      case NTMessageType.FlagsUpdate:
        return NTSerializer.serializeFlagsUpdate(message);
      case NTMessageType.EntryDelete:
        return NTSerializer.serializeEntryDelete(message);
      case NTMessageType.ClearEntries:
        return NTSerializer.serializeClearEntries(message);
      case NTMessageType.RpcDefinition:
        return NTSerializer.serializeRpcDefinition(message);
      case NTMessageType.RpcExecution:
        return NTSerializer.serializeRpcExecution(message);
      default:
        throw new Error(`Unknown message type: ${(message as any).type}`);
    }
  }

  /**
   * Serialize a message header
   * 
   * @param header Message header
   * @returns Serialized header buffer
   */
  static serializeHeader(header: NTMessageHeader): Buffer {
    const buffer = Buffer.alloc(3);
    buffer.writeUInt8(header.type, 0);
    buffer.writeUInt16BE(header.length, 1);
    return buffer;
  }

  /**
   * Serialize a keep-alive message
   * 
   * @param message Keep-alive message
   * @returns Serialized message buffer
   */
  static serializeKeepAlive(message: NTKeepAliveMessage): Buffer {
    // Keep-alive message has no payload
    return NTSerializer.serializeHeader({
      type: NTMessageType.KeepAlive,
      length: 0
    });
  }

  /**
   * Serialize a client hello message
   * 
   * @param message Client hello message
   * @returns Serialized message buffer
   */
  static serializeClientHello(message: NTClientHelloMessage): Buffer {
    // Calculate the payload length
    const clientNameBuffer = Buffer.from(message.clientName, 'utf8');
    const payloadLength = 2 + 2 + clientNameBuffer.length;

    // Create the header
    const header = NTSerializer.serializeHeader({
      type: NTMessageType.ClientHello,
      length: payloadLength
    });

    // Create the payload
    const payload = Buffer.alloc(payloadLength);
    payload.writeUInt16BE(message.protocolVersion, 0);
    payload.writeUInt16BE(clientNameBuffer.length, 2);
    clientNameBuffer.copy(payload, 4);

    // Combine the header and payload
    return Buffer.concat([header, payload]);
  }

  /**
   * Serialize a protocol unsupported message
   * 
   * @param message Protocol unsupported message
   * @returns Serialized message buffer
   */
  static serializeProtoUnsupported(message: NTProtoUnsupportedMessage): Buffer {
    // Calculate the payload length
    const payloadLength = 2;

    // Create the header
    const header = NTSerializer.serializeHeader({
      type: NTMessageType.ProtoUnsupported,
      length: payloadLength
    });

    // Create the payload
    const payload = Buffer.alloc(payloadLength);
    payload.writeUInt16BE(message.serverVersion, 0);

    // Combine the header and payload
    return Buffer.concat([header, payload]);
  }

  /**
   * Serialize a server hello complete message
   * 
   * @param message Server hello complete message
   * @returns Serialized message buffer
   */
  static serializeServerHelloComplete(message: NTServerHelloCompleteMessage): Buffer {
    // Server hello complete message has no payload
    return NTSerializer.serializeHeader({
      type: NTMessageType.ServerHelloComplete,
      length: 0
    });
  }

  /**
   * Serialize a server hello message
   * 
   * @param message Server hello message
   * @returns Serialized message buffer
   */
  static serializeServerHello(message: NTServerHelloMessage): Buffer {
    // Calculate the payload length
    const serverIdentityBuffer = Buffer.from(message.serverIdentity, 'utf8');
    const clientIdentityBuffer = Buffer.from(message.clientIdentity, 'utf8');
    const payloadLength = 2 + serverIdentityBuffer.length + 2 + clientIdentityBuffer.length;

    // Create the header
    const header = NTSerializer.serializeHeader({
      type: NTMessageType.ServerHello,
      length: payloadLength
    });

    // Create the payload
    const payload = Buffer.alloc(payloadLength);
    payload.writeUInt16BE(serverIdentityBuffer.length, 0);
    serverIdentityBuffer.copy(payload, 2);
    payload.writeUInt16BE(clientIdentityBuffer.length, 2 + serverIdentityBuffer.length);
    clientIdentityBuffer.copy(payload, 2 + serverIdentityBuffer.length + 2);

    // Combine the header and payload
    return Buffer.concat([header, payload]);
  }

  /**
   * Serialize a client hello complete message
   * 
   * @param message Client hello complete message
   * @returns Serialized message buffer
   */
  static serializeClientHelloComplete(message: NTClientHelloCompleteMessage): Buffer {
    // Client hello complete message has no payload
    return NTSerializer.serializeHeader({
      type: NTMessageType.ClientHelloComplete,
      length: 0
    });
  }

  /**
   * Serialize an entry assignment message
   * 
   * @param message Entry assignment message
   * @returns Serialized message buffer
   */
  static serializeEntryAssignment(message: NTEntryAssignmentMessage): Buffer {
    // Calculate the payload length
    const nameBuffer = Buffer.from(message.name, 'utf8');
    const valueBuffer = NTSerializer.serializeValue(message.value, message.entryType);
    const payloadLength = 2 + nameBuffer.length + 1 + 2 + 2 + 1 + valueBuffer.length;

    // Create the header
    const header = NTSerializer.serializeHeader({
      type: NTMessageType.EntryAssignment,
      length: payloadLength
    });

    // Create the payload
    const payload = Buffer.alloc(payloadLength);
    let offset = 0;

    // Write the name
    payload.writeUInt16BE(nameBuffer.length, offset);
    offset += 2;
    nameBuffer.copy(payload, offset);
    offset += nameBuffer.length;

    // Write the type
    payload.writeUInt8(message.entryType, offset);
    offset += 1;

    // Write the entry ID
    payload.writeUInt16BE(message.entryId, offset);
    offset += 2;

    // Write the sequence number
    payload.writeUInt16BE(message.sequenceNumber, offset);
    offset += 2;

    // Write the flags
    payload.writeUInt8(message.flags, offset);
    offset += 1;

    // Write the value
    valueBuffer.copy(payload, offset);

    // Combine the header and payload
    return Buffer.concat([header, payload]);
  }

  /**
   * Serialize an entry update message
   * 
   * @param message Entry update message
   * @returns Serialized message buffer
   */
  static serializeEntryUpdate(message: NTEntryUpdateMessage): Buffer {
    // Calculate the payload length
    const valueBuffer = NTSerializer.serializeValue(message.value);
    const payloadLength = 2 + 2 + valueBuffer.length;

    // Create the header
    const header = NTSerializer.serializeHeader({
      type: NTMessageType.EntryUpdate,
      length: payloadLength
    });

    // Create the payload
    const payload = Buffer.alloc(payloadLength);
    let offset = 0;

    // Write the entry ID
    payload.writeUInt16BE(message.entryId, offset);
    offset += 2;

    // Write the sequence number
    payload.writeUInt16BE(message.sequenceNumber, offset);
    offset += 2;

    // Write the value
    valueBuffer.copy(payload, offset);

    // Combine the header and payload
    return Buffer.concat([header, payload]);
  }

  /**
   * Serialize a flags update message
   * 
   * @param message Flags update message
   * @returns Serialized message buffer
   */
  static serializeFlagsUpdate(message: NTFlagsUpdateMessage): Buffer {
    // Calculate the payload length
    const payloadLength = 2 + 1;

    // Create the header
    const header = NTSerializer.serializeHeader({
      type: NTMessageType.FlagsUpdate,
      length: payloadLength
    });

    // Create the payload
    const payload = Buffer.alloc(payloadLength);
    payload.writeUInt16BE(message.entryId, 0);
    payload.writeUInt8(message.flags, 2);

    // Combine the header and payload
    return Buffer.concat([header, payload]);
  }

  /**
   * Serialize an entry delete message
   * 
   * @param message Entry delete message
   * @returns Serialized message buffer
   */
  static serializeEntryDelete(message: NTEntryDeleteMessage): Buffer {
    // Calculate the payload length
    const payloadLength = 2;

    // Create the header
    const header = NTSerializer.serializeHeader({
      type: NTMessageType.EntryDelete,
      length: payloadLength
    });

    // Create the payload
    const payload = Buffer.alloc(payloadLength);
    payload.writeUInt16BE(message.entryId, 0);

    // Combine the header and payload
    return Buffer.concat([header, payload]);
  }

  /**
   * Serialize a clear entries message
   * 
   * @param message Clear entries message
   * @returns Serialized message buffer
   */
  static serializeClearEntries(message: NTClearEntriesMessage): Buffer {
    // Clear entries message has no payload
    return NTSerializer.serializeHeader({
      type: NTMessageType.ClearEntries,
      length: 0
    });
  }

  /**
   * Serialize an RPC definition message
   * 
   * @param message RPC definition message
   * @returns Serialized message buffer
   */
  static serializeRpcDefinition(message: NTRpcDefinitionMessage): Buffer {
    // Calculate the payload length
    const nameBuffer = Buffer.from(message.name, 'utf8');
    const payloadLength = 2 + nameBuffer.length + 2 + 2 + message.definition.length;

    // Create the header
    const header = NTSerializer.serializeHeader({
      type: NTMessageType.RpcDefinition,
      length: payloadLength
    });

    // Create the payload
    const payload = Buffer.alloc(payloadLength);
    let offset = 0;

    // Write the name
    payload.writeUInt16BE(nameBuffer.length, offset);
    offset += 2;
    nameBuffer.copy(payload, offset);
    offset += nameBuffer.length;

    // Write the entry ID
    payload.writeUInt16BE(message.entryId, offset);
    offset += 2;

    // Write the definition length
    payload.writeUInt16BE(message.definition.length, offset);
    offset += 2;

    // Write the definition
    message.definition.copy(payload, offset);

    // Combine the header and payload
    return Buffer.concat([header, payload]);
  }

  /**
   * Serialize an RPC execution message
   * 
   * @param message RPC execution message
   * @returns Serialized message buffer
   */
  static serializeRpcExecution(message: NTRpcExecutionMessage): Buffer {
    // Calculate the payload length
    const payloadLength = 2 + 4 + 2 + message.parameters.length;

    // Create the header
    const header = NTSerializer.serializeHeader({
      type: NTMessageType.RpcExecution,
      length: payloadLength
    });

    // Create the payload
    const payload = Buffer.alloc(payloadLength);
    let offset = 0;

    // Write the entry ID
    payload.writeUInt16BE(message.entryId, offset);
    offset += 2;

    // Write the unique ID
    payload.writeUInt32BE(message.uniqueId, offset);
    offset += 4;

    // Write the parameters length
    payload.writeUInt16BE(message.parameters.length, offset);
    offset += 2;

    // Write the parameters
    message.parameters.copy(payload, offset);

    // Combine the header and payload
    return Buffer.concat([header, payload]);
  }

  /**
   * Serialize a value
   * 
   * @param value Value to serialize
   * @param type Value type (optional, will be inferred if not provided)
   * @returns Serialized value buffer
   */
  static serializeValue(value: NTValue, type?: number): Buffer {
    // If type is not provided, infer it from the value
    if (type === undefined) {
      if (typeof value === 'boolean') {
        type = NTValueType.Boolean;
      } else if (typeof value === 'number') {
        type = NTValueType.Double;
      } else if (typeof value === 'string') {
        type = NTValueType.String;
      } else if (Buffer.isBuffer(value)) {
        type = NTValueType.Raw;
      } else if (Array.isArray(value)) {
        if (value.length === 0) {
          type = NTValueType.BooleanArray;
        } else if (typeof value[0] === 'boolean') {
          type = NTValueType.BooleanArray;
        } else if (typeof value[0] === 'number') {
          type = NTValueType.DoubleArray;
        } else if (typeof value[0] === 'string') {
          type = NTValueType.StringArray;
        } else {
          throw new Error('Unsupported array type');
        }
      } else {
        throw new Error('Unsupported value type');
      }
    }

    // Serialize the value based on the type
    switch (type) {
      case NTValueType.Boolean:
        return NTSerializer.serializeBoolean(value as boolean);
      case NTValueType.Double:
        return NTSerializer.serializeDouble(value as number);
      case NTValueType.String:
        return NTSerializer.serializeString(value as string);
      case NTValueType.Raw:
        return NTSerializer.serializeRaw(value as Buffer);
      case NTValueType.BooleanArray:
        return NTSerializer.serializeBooleanArray(value as boolean[]);
      case NTValueType.DoubleArray:
        return NTSerializer.serializeDoubleArray(value as number[]);
      case NTValueType.StringArray:
        return NTSerializer.serializeStringArray(value as string[]);
      case NTValueType.RPC:
        return NTSerializer.serializeRaw(value as Buffer);
      default:
        throw new Error(`Unsupported value type: ${type}`);
    }
  }

  /**
   * Serialize a boolean value
   * 
   * @param value Boolean value
   * @returns Serialized value buffer
   */
  static serializeBoolean(value: boolean): Buffer {
    const buffer = Buffer.alloc(1);
    buffer.writeUInt8(value ? 1 : 0, 0);
    return buffer;
  }

  /**
   * Serialize a double value
   * 
   * @param value Double value
   * @returns Serialized value buffer
   */
  static serializeDouble(value: number): Buffer {
    const buffer = Buffer.alloc(8);
    buffer.writeDoubleLE(value, 0);
    return buffer;
  }

  /**
   * Serialize a string value
   * 
   * @param value String value
   * @returns Serialized value buffer
   */
  static serializeString(value: string): Buffer {
    const stringBuffer = Buffer.from(value, 'utf8');
    const buffer = Buffer.alloc(2 + stringBuffer.length);
    buffer.writeUInt16BE(stringBuffer.length, 0);
    stringBuffer.copy(buffer, 2);
    return buffer;
  }

  /**
   * Serialize a raw value
   * 
   * @param value Raw value
   * @returns Serialized value buffer
   */
  static serializeRaw(value: Buffer): Buffer {
    const buffer = Buffer.alloc(2 + value.length);
    buffer.writeUInt16BE(value.length, 0);
    value.copy(buffer, 2);
    return buffer;
  }

  /**
   * Serialize a boolean array value
   * 
   * @param value Boolean array value
   * @returns Serialized value buffer
   */
  static serializeBooleanArray(value: boolean[]): Buffer {
    const buffer = Buffer.alloc(2 + value.length);
    buffer.writeUInt16BE(value.length, 0);
    for (let i = 0; i < value.length; i++) {
      buffer.writeUInt8(value[i] ? 1 : 0, 2 + i);
    }
    return buffer;
  }

  /**
   * Serialize a double array value
   * 
   * @param value Double array value
   * @returns Serialized value buffer
   */
  static serializeDoubleArray(value: number[]): Buffer {
    const buffer = Buffer.alloc(2 + value.length * 8);
    buffer.writeUInt16BE(value.length, 0);
    for (let i = 0; i < value.length; i++) {
      buffer.writeDoubleLE(value[i], 2 + i * 8);
    }
    return buffer;
  }

  /**
   * Serialize a string array value
   * 
   * @param value String array value
   * @returns Serialized value buffer
   */
  static serializeStringArray(value: string[]): Buffer {
    // Calculate the total length
    let totalLength = 2; // Array length (2 bytes)
    const stringBuffers: Buffer[] = [];
    for (const str of value) {
      const stringBuffer = Buffer.from(str, 'utf8');
      stringBuffers.push(stringBuffer);
      totalLength += 2 + stringBuffer.length; // String length (2 bytes) + string data
    }

    // Create the buffer
    const buffer = Buffer.alloc(totalLength);
    buffer.writeUInt16BE(value.length, 0);
    let offset = 2;
    for (let i = 0; i < value.length; i++) {
      const stringBuffer = stringBuffers[i];
      buffer.writeUInt16BE(stringBuffer.length, offset);
      offset += 2;
      stringBuffer.copy(buffer, offset);
      offset += stringBuffer.length;
    }
    return buffer;
  }
}
