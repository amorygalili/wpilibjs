import { decode } from '@msgpack/msgpack';
import {
  BinaryMessage,
  ClientMessage,
  ServerMessage,
  DataType
} from '../types';

/**
 * Decodes a client message from MessagePack
 * @param data The MessagePack data to decode
 * @returns The decoded client message
 */
export function decodeClientMessage(data: Uint8Array): ClientMessage[] {
  try {
    const messages = decode(data, decodeOptions) as ClientMessage[];
    if (!Array.isArray(messages)) {
      throw new Error('Expected an array of messages');
    }
    return messages;
  } catch (error) {
    throw new Error(`Failed to decode client message: ${error}`);
  }
}

/**
 * Decodes a server message from MessagePack
 * @param data The MessagePack data to decode
 * @returns The decoded server message
 */
export function decodeServerMessage(data: Uint8Array): ServerMessage[] {
  try {
    const messages = decode(data, decodeOptions) as ServerMessage[];
    if (!Array.isArray(messages)) {
      throw new Error('Expected an array of messages');
    }
    return messages;
  } catch (error) {
    throw new Error(`Failed to decode server message: ${error}`);
  }
}

// Configure MessagePack decoding options
const decodeOptions = {
  // Ensure we're using the correct format for NetworkTables
  maxStrLength: 0xFFFFFFFF, // Allow strings of any length
  maxBinLength: 0xFFFFFFFF, // Allow binary data of any length
  maxArrayLength: 0xFFFFFFFF, // Allow arrays of any length
  maxMapSize: 0xFFFFFFFF, // Allow maps of any size
  maxExtLength: 0xFFFFFFFF, // Allow extensions of any length
  maxDepth: 100, // Limit recursion depth to prevent stack overflow
};

/**
 * Decodes a binary message from MessagePack
 * @param data The binary data to decode
 * @returns The decoded binary message
 */
export function decodeBinaryMessage(data: Uint8Array): BinaryMessage {
  try {
    const decoded = decode(data, decodeOptions) as [number, number, number, any];

    if (!Array.isArray(decoded)) {
      throw new Error(`Invalid binary message format: expected array, got ${typeof decoded}`);
    }

    if (decoded.length !== 4) {
      throw new Error(`Invalid binary message format: expected array of length 4, got ${decoded.length}`);
    }

    const [topicId, timestamp, type, value] = decoded;

    if (typeof topicId !== 'number') {
      throw new Error(`Invalid topicId: expected number, got ${typeof topicId}`);
    }

    if (typeof timestamp !== 'number') {
      throw new Error(`Invalid timestamp: expected number, got ${typeof timestamp}`);
    }

    if (typeof type !== 'number') {
      throw new Error(`Invalid type: expected number, got ${typeof type}`);
    }

    return {
      topicId,
      timestamp,
      type: type as DataType,
      value
    };
  } catch (error) {
    console.error('Failed to decode binary message:', error);
    throw new Error(`Failed to decode binary message: ${error}`);
  }
}

/**
 * Decodes multiple binary messages from MessagePack
 * @param data The binary data to decode
 * @returns An array of decoded binary messages
 */
export function decodeBinaryMessages(data: Uint8Array): BinaryMessage[] {
  try {
    // Try to decode as a single message first
    try {
      const message = decodeBinaryMessage(data);
      return [message];
    } catch (singleError) {
      // If single message decoding fails, try to decode as multiple messages
      // This would require a custom implementation based on how multiple messages are packed
      // For now, we'll just throw the original error
      throw singleError;
    }
  } catch (error) {
    console.error('Failed to decode binary messages:', error);
    throw new Error(`Failed to decode binary messages: ${error}`);
  }
}
