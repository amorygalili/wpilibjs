import { NTSerializer } from '../NTSerializer';
import { NTDeserializer } from '../NTDeserializer';
import { 
  NTMessageType, 
  NTClientHelloMessage, 
  NTProtoUnsupportedMessage, 
  NTServerHelloCompleteMessage, 
  NTServerHelloMessage, 
  NTClientHelloCompleteMessage, 
  NTEntryAssignmentMessage, 
  NTEntryUpdateMessage, 
  NTFlagsUpdateMessage, 
  NTEntryDeleteMessage, 
  NTClearEntriesMessage, 
  NTKeepAliveMessage,
  NT_PROTOCOL_VERSION
} from '../NTProtocol';
import { NTValueType } from '../../types/NTTypes';

describe('NTDeserializer', () => {
  test('deserializeKeepAlive', () => {
    const message: NTKeepAliveMessage = {
      type: NTMessageType.KeepAlive
    };
    
    const buffer = NTSerializer.serializeMessage(message);
    const { message: deserializedMessage, bytesConsumed } = NTDeserializer.deserializeMessage(buffer);
    
    expect(bytesConsumed).toBe(3);
    expect(deserializedMessage).toEqual(message);
  });
  
  test('deserializeClientHello', () => {
    const message: NTClientHelloMessage = {
      type: NTMessageType.ClientHello,
      protocolVersion: NT_PROTOCOL_VERSION,
      clientName: 'TestClient'
    };
    
    const buffer = NTSerializer.serializeMessage(message);
    const { message: deserializedMessage, bytesConsumed } = NTDeserializer.deserializeMessage(buffer);
    
    expect(bytesConsumed).toBe(3 + 2 + 2 + 10);
    expect(deserializedMessage).toEqual(message);
  });
  
  test('deserializeProtoUnsupported', () => {
    const message: NTProtoUnsupportedMessage = {
      type: NTMessageType.ProtoUnsupported,
      serverVersion: NT_PROTOCOL_VERSION
    };
    
    const buffer = NTSerializer.serializeMessage(message);
    const { message: deserializedMessage, bytesConsumed } = NTDeserializer.deserializeMessage(buffer);
    
    expect(bytesConsumed).toBe(3 + 2);
    expect(deserializedMessage).toEqual(message);
  });
  
  test('deserializeServerHelloComplete', () => {
    const message: NTServerHelloCompleteMessage = {
      type: NTMessageType.ServerHelloComplete
    };
    
    const buffer = NTSerializer.serializeMessage(message);
    const { message: deserializedMessage, bytesConsumed } = NTDeserializer.deserializeMessage(buffer);
    
    expect(bytesConsumed).toBe(3);
    expect(deserializedMessage).toEqual(message);
  });
  
  test('deserializeServerHello', () => {
    const message: NTServerHelloMessage = {
      type: NTMessageType.ServerHello,
      serverIdentity: 'TestServer',
      clientIdentity: 'TestClient'
    };
    
    const buffer = NTSerializer.serializeMessage(message);
    const { message: deserializedMessage, bytesConsumed } = NTDeserializer.deserializeMessage(buffer);
    
    expect(bytesConsumed).toBe(3 + 2 + 10 + 2 + 10);
    expect(deserializedMessage).toEqual(message);
  });
  
  test('deserializeClientHelloComplete', () => {
    const message: NTClientHelloCompleteMessage = {
      type: NTMessageType.ClientHelloComplete
    };
    
    const buffer = NTSerializer.serializeMessage(message);
    const { message: deserializedMessage, bytesConsumed } = NTDeserializer.deserializeMessage(buffer);
    
    expect(bytesConsumed).toBe(3);
    expect(deserializedMessage).toEqual(message);
  });
  
  test('deserializeEntryAssignment', () => {
    const message: NTEntryAssignmentMessage = {
      type: NTMessageType.EntryAssignment,
      name: 'TestEntry',
      entryType: NTValueType.Double,
      entryId: 42,
      sequenceNumber: 1,
      flags: 0,
      value: 3.14
    };
    
    const buffer = NTSerializer.serializeMessage(message);
    const { message: deserializedMessage, bytesConsumed } = NTDeserializer.deserializeMessage(buffer);
    
    expect(bytesConsumed).toBe(3 + 2 + 9 + 1 + 2 + 2 + 1 + 8);
    expect(deserializedMessage).toEqual(message);
  });
  
  test('deserializeEntryUpdate', () => {
    const message: NTEntryUpdateMessage = {
      type: NTMessageType.EntryUpdate,
      entryId: 42,
      sequenceNumber: 1,
      value: 3.14
    };
    
    const buffer = NTSerializer.serializeMessage(message);
    const { message: deserializedMessage, bytesConsumed } = NTDeserializer.deserializeMessage(buffer);
    
    expect(bytesConsumed).toBe(3 + 2 + 2 + 8);
    expect(deserializedMessage).toEqual(message);
  });
  
  test('deserializeFlagsUpdate', () => {
    const message: NTFlagsUpdateMessage = {
      type: NTMessageType.FlagsUpdate,
      entryId: 42,
      flags: 1
    };
    
    const buffer = NTSerializer.serializeMessage(message);
    const { message: deserializedMessage, bytesConsumed } = NTDeserializer.deserializeMessage(buffer);
    
    expect(bytesConsumed).toBe(3 + 2 + 1);
    expect(deserializedMessage).toEqual(message);
  });
  
  test('deserializeEntryDelete', () => {
    const message: NTEntryDeleteMessage = {
      type: NTMessageType.EntryDelete,
      entryId: 42
    };
    
    const buffer = NTSerializer.serializeMessage(message);
    const { message: deserializedMessage, bytesConsumed } = NTDeserializer.deserializeMessage(buffer);
    
    expect(bytesConsumed).toBe(3 + 2);
    expect(deserializedMessage).toEqual(message);
  });
  
  test('deserializeClearEntries', () => {
    const message: NTClearEntriesMessage = {
      type: NTMessageType.ClearEntries
    };
    
    const buffer = NTSerializer.serializeMessage(message);
    const { message: deserializedMessage, bytesConsumed } = NTDeserializer.deserializeMessage(buffer);
    
    expect(bytesConsumed).toBe(3);
    expect(deserializedMessage).toEqual(message);
  });
  
  test('deserializeValue for boolean', () => {
    const value = true;
    const buffer = NTSerializer.serializeValue(value);
    const { value: deserializedValue, bytesConsumed } = NTDeserializer.deserializeValue(buffer, NTValueType.Boolean);
    
    expect(bytesConsumed).toBe(1);
    expect(deserializedValue).toBe(value);
  });
  
  test('deserializeValue for number', () => {
    const value = 3.14;
    const buffer = NTSerializer.serializeValue(value);
    const { value: deserializedValue, bytesConsumed } = NTDeserializer.deserializeValue(buffer, NTValueType.Double);
    
    expect(bytesConsumed).toBe(8);
    expect(deserializedValue).toBe(value);
  });
  
  test('deserializeValue for string', () => {
    const value = 'hello';
    const buffer = NTSerializer.serializeValue(value);
    const { value: deserializedValue, bytesConsumed } = NTDeserializer.deserializeValue(buffer, NTValueType.String);
    
    expect(bytesConsumed).toBe(2 + 5);
    expect(deserializedValue).toBe(value);
  });
  
  test('deserializeValue for Buffer', () => {
    const value = Buffer.from([1, 2, 3, 4, 5]);
    const buffer = NTSerializer.serializeValue(value);
    const { value: deserializedValue, bytesConsumed } = NTDeserializer.deserializeValue(buffer, NTValueType.Raw);
    
    expect(bytesConsumed).toBe(2 + 5);
    expect(Buffer.isBuffer(deserializedValue)).toBe(true);
    expect(deserializedValue).toEqual(value);
  });
  
  test('deserializeValue for boolean array', () => {
    const value = [true, false, true];
    const buffer = NTSerializer.serializeValue(value);
    const { value: deserializedValue, bytesConsumed } = NTDeserializer.deserializeValue(buffer, NTValueType.BooleanArray);
    
    expect(bytesConsumed).toBe(2 + 3);
    expect(deserializedValue).toEqual(value);
  });
  
  test('deserializeValue for number array', () => {
    const value = [1.1, 2.2, 3.3];
    const buffer = NTSerializer.serializeValue(value);
    const { value: deserializedValue, bytesConsumed } = NTDeserializer.deserializeValue(buffer, NTValueType.DoubleArray);
    
    expect(bytesConsumed).toBe(2 + 3 * 8);
    expect(deserializedValue).toEqual(value);
  });
  
  test('deserializeValue for string array', () => {
    const value = ['a', 'bb', 'ccc'];
    const buffer = NTSerializer.serializeValue(value);
    const { value: deserializedValue, bytesConsumed } = NTDeserializer.deserializeValue(buffer, NTValueType.StringArray);
    
    expect(bytesConsumed).toBe(2 + 2 + 1 + 2 + 2 + 2 + 3);
    expect(deserializedValue).toEqual(value);
  });
});
