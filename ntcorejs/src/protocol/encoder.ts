import { encode, ExtensionCodec } from '@msgpack/msgpack';
import {
  BinaryMessage,
  ClientMessage,
  ServerMessage,
  DataType,
  Value
} from '../types';

/**
 * Encodes a client message as MessagePack
 * @param message The client message to encode
 * @returns The encoded message as a Uint8Array
 */
export function encodeClientMessage(message: ClientMessage): Uint8Array {
  return encode([message], encodeOptions);
}

/**
 * Encodes a server message as MessagePack
 * @param message The server message to encode
 * @returns The encoded message as a Uint8Array
 */
export function encodeServerMessage(message: ServerMessage): Uint8Array {
  return encode([message], encodeOptions);
}

// Create a custom extension codec for NetworkTables
const extensionCodec = new ExtensionCodec();

// Configure MessagePack encoding options
const encodeOptions = {
  extensionCodec,
  // Ensure we're using the correct format for NetworkTables
  forceFloat32: false,  // Use float64 for floating point numbers
  forceIntegerToFloat: false, // Don't convert integers to floats
  ignoreUndefined: true, // Ignore undefined values
  sortKeys: false, // Don't sort keys (not needed for arrays)
};

/**
 * Encodes a binary message as MessagePack
 * @param topicId The topic ID
 * @param timestamp The timestamp in microseconds
 * @param type The data type
 * @param value The value
 * @returns The encoded message as a Uint8Array
 */
export function encodeBinaryMessage(
  topicId: number,
  timestamp: number,
  type: DataType,
  value: any
): Uint8Array {
  try {
    const message = [topicId, timestamp, type, value];
    return encode(message, encodeOptions);
  } catch (error) {
    console.error('Failed to encode binary message:', error);
    throw new Error(`Failed to encode binary message: ${error}`);
  }
}

/**
 * Encodes a value as a binary message
 * @param topicId The topic ID
 * @param value The value object
 * @returns The encoded message as a Uint8Array
 */
export function encodeValue(topicId: number, value: Value): Uint8Array {
  return encodeBinaryMessage(topicId, value.time, value.type, value.value);
}

/**
 * Encodes an RTT measurement message
 * @param timestamp The timestamp in microseconds
 * @returns The encoded message as a Uint8Array
 */
export function encodeRTT(timestamp: number): Uint8Array {
  try {
    const message = [-1, timestamp, 0, 0];
    return encode(message, encodeOptions);
  } catch (error) {
    console.error('Failed to encode RTT message:', error);
    throw new Error(`Failed to encode RTT message: ${error}`);
  }
}
