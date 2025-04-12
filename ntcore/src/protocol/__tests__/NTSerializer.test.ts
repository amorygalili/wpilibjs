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

describe('NTSerializer', () => {
  test('serializeKeepAlive', () => {
    const message: NTKeepAliveMessage = {
      type: NTMessageType.KeepAlive
    };
    
    const buffer = NTSerializer.serializeMessage(message);
    
    expect(buffer.length).toBe(3);
    expect(buffer.readUInt8(0)).toBe(NTMessageType.KeepAlive);
    expect(buffer.readUInt16BE(1)).toBe(0);
  });
  
  test('serializeClientHello', () => {
    const message: NTClientHelloMessage = {
      type: NTMessageType.ClientHello,
      protocolVersion: NT_PROTOCOL_VERSION,
      clientName: 'TestClient'
    };
    
    const buffer = NTSerializer.serializeMessage(message);
    
    expect(buffer.length).toBe(3 + 2 + 2 + 10);
    expect(buffer.readUInt8(0)).toBe(NTMessageType.ClientHello);
    expect(buffer.readUInt16BE(1)).toBe(2 + 2 + 10);
    expect(buffer.readUInt16BE(3)).toBe(NT_PROTOCOL_VERSION);
    expect(buffer.readUInt16BE(5)).toBe(10);
    expect(buffer.toString('utf8', 7, 17)).toBe('TestClient');
  });
  
  test('serializeProtoUnsupported', () => {
    const message: NTProtoUnsupportedMessage = {
      type: NTMessageType.ProtoUnsupported,
      serverVersion: NT_PROTOCOL_VERSION
    };
    
    const buffer = NTSerializer.serializeMessage(message);
    
    expect(buffer.length).toBe(3 + 2);
    expect(buffer.readUInt8(0)).toBe(NTMessageType.ProtoUnsupported);
    expect(buffer.readUInt16BE(1)).toBe(2);
    expect(buffer.readUInt16BE(3)).toBe(NT_PROTOCOL_VERSION);
  });
  
  test('serializeServerHelloComplete', () => {
    const message: NTServerHelloCompleteMessage = {
      type: NTMessageType.ServerHelloComplete
    };
    
    const buffer = NTSerializer.serializeMessage(message);
    
    expect(buffer.length).toBe(3);
    expect(buffer.readUInt8(0)).toBe(NTMessageType.ServerHelloComplete);
    expect(buffer.readUInt16BE(1)).toBe(0);
  });
  
  test('serializeServerHello', () => {
    const message: NTServerHelloMessage = {
      type: NTMessageType.ServerHello,
      serverIdentity: 'TestServer',
      clientIdentity: 'TestClient'
    };
    
    const buffer = NTSerializer.serializeMessage(message);
    
    expect(buffer.length).toBe(3 + 2 + 10 + 2 + 10);
    expect(buffer.readUInt8(0)).toBe(NTMessageType.ServerHello);
    expect(buffer.readUInt16BE(1)).toBe(2 + 10 + 2 + 10);
    expect(buffer.readUInt16BE(3)).toBe(10);
    expect(buffer.toString('utf8', 5, 15)).toBe('TestServer');
    expect(buffer.readUInt16BE(15)).toBe(10);
    expect(buffer.toString('utf8', 17, 27)).toBe('TestClient');
  });
  
  test('serializeClientHelloComplete', () => {
    const message: NTClientHelloCompleteMessage = {
      type: NTMessageType.ClientHelloComplete
    };
    
    const buffer = NTSerializer.serializeMessage(message);
    
    expect(buffer.length).toBe(3);
    expect(buffer.readUInt8(0)).toBe(NTMessageType.ClientHelloComplete);
    expect(buffer.readUInt16BE(1)).toBe(0);
  });
  
  test('serializeEntryAssignment', () => {
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
    
    expect(buffer.length).toBe(3 + 2 + 9 + 1 + 2 + 2 + 1 + 8);
    expect(buffer.readUInt8(0)).toBe(NTMessageType.EntryAssignment);
    expect(buffer.readUInt16BE(1)).toBe(2 + 9 + 1 + 2 + 2 + 1 + 8);
    expect(buffer.readUInt16BE(3)).toBe(9);
    expect(buffer.toString('utf8', 5, 14)).toBe('TestEntry');
    expect(buffer.readUInt8(14)).toBe(NTValueType.Double);
    expect(buffer.readUInt16BE(15)).toBe(42);
    expect(buffer.readUInt16BE(17)).toBe(1);
    expect(buffer.readUInt8(19)).toBe(0);
    expect(buffer.readDoubleLE(20)).toBe(3.14);
  });
  
  test('serializeEntryUpdate', () => {
    const message: NTEntryUpdateMessage = {
      type: NTMessageType.EntryUpdate,
      entryId: 42,
      sequenceNumber: 1,
      value: 3.14
    };
    
    const buffer = NTSerializer.serializeMessage(message);
    
    expect(buffer.length).toBe(3 + 2 + 2 + 8);
    expect(buffer.readUInt8(0)).toBe(NTMessageType.EntryUpdate);
    expect(buffer.readUInt16BE(1)).toBe(2 + 2 + 8);
    expect(buffer.readUInt16BE(3)).toBe(42);
    expect(buffer.readUInt16BE(5)).toBe(1);
    expect(buffer.readDoubleLE(7)).toBe(3.14);
  });
  
  test('serializeFlagsUpdate', () => {
    const message: NTFlagsUpdateMessage = {
      type: NTMessageType.FlagsUpdate,
      entryId: 42,
      flags: 1
    };
    
    const buffer = NTSerializer.serializeMessage(message);
    
    expect(buffer.length).toBe(3 + 2 + 1);
    expect(buffer.readUInt8(0)).toBe(NTMessageType.FlagsUpdate);
    expect(buffer.readUInt16BE(1)).toBe(2 + 1);
    expect(buffer.readUInt16BE(3)).toBe(42);
    expect(buffer.readUInt8(5)).toBe(1);
  });
  
  test('serializeEntryDelete', () => {
    const message: NTEntryDeleteMessage = {
      type: NTMessageType.EntryDelete,
      entryId: 42
    };
    
    const buffer = NTSerializer.serializeMessage(message);
    
    expect(buffer.length).toBe(3 + 2);
    expect(buffer.readUInt8(0)).toBe(NTMessageType.EntryDelete);
    expect(buffer.readUInt16BE(1)).toBe(2);
    expect(buffer.readUInt16BE(3)).toBe(42);
  });
  
  test('serializeClearEntries', () => {
    const message: NTClearEntriesMessage = {
      type: NTMessageType.ClearEntries
    };
    
    const buffer = NTSerializer.serializeMessage(message);
    
    expect(buffer.length).toBe(3);
    expect(buffer.readUInt8(0)).toBe(NTMessageType.ClearEntries);
    expect(buffer.readUInt16BE(1)).toBe(0);
  });
  
  test('serializeValue for boolean', () => {
    const buffer = NTSerializer.serializeValue(true);
    
    expect(buffer.length).toBe(1);
    expect(buffer.readUInt8(0)).toBe(1);
  });
  
  test('serializeValue for number', () => {
    const buffer = NTSerializer.serializeValue(3.14);
    
    expect(buffer.length).toBe(8);
    expect(buffer.readDoubleLE(0)).toBe(3.14);
  });
  
  test('serializeValue for string', () => {
    const buffer = NTSerializer.serializeValue('hello');
    
    expect(buffer.length).toBe(2 + 5);
    expect(buffer.readUInt16BE(0)).toBe(5);
    expect(buffer.toString('utf8', 2, 7)).toBe('hello');
  });
  
  test('serializeValue for Buffer', () => {
    const data = Buffer.from([1, 2, 3, 4, 5]);
    const buffer = NTSerializer.serializeValue(data);
    
    expect(buffer.length).toBe(2 + 5);
    expect(buffer.readUInt16BE(0)).toBe(5);
    expect(buffer.slice(2, 7)).toEqual(data);
  });
  
  test('serializeValue for boolean array', () => {
    const buffer = NTSerializer.serializeValue([true, false, true]);
    
    expect(buffer.length).toBe(2 + 3);
    expect(buffer.readUInt16BE(0)).toBe(3);
    expect(buffer.readUInt8(2)).toBe(1);
    expect(buffer.readUInt8(3)).toBe(0);
    expect(buffer.readUInt8(4)).toBe(1);
  });
  
  test('serializeValue for number array', () => {
    const buffer = NTSerializer.serializeValue([1.1, 2.2, 3.3]);
    
    expect(buffer.length).toBe(2 + 3 * 8);
    expect(buffer.readUInt16BE(0)).toBe(3);
    expect(buffer.readDoubleLE(2)).toBe(1.1);
    expect(buffer.readDoubleLE(10)).toBe(2.2);
    expect(buffer.readDoubleLE(18)).toBe(3.3);
  });
  
  test('serializeValue for string array', () => {
    const buffer = NTSerializer.serializeValue(['a', 'bb', 'ccc']);
    
    expect(buffer.length).toBe(2 + 2 + 1 + 2 + 2 + 2 + 3);
    expect(buffer.readUInt16BE(0)).toBe(3);
    expect(buffer.readUInt16BE(2)).toBe(1);
    expect(buffer.toString('utf8', 4, 5)).toBe('a');
    expect(buffer.readUInt16BE(5)).toBe(2);
    expect(buffer.toString('utf8', 7, 9)).toBe('bb');
    expect(buffer.readUInt16BE(9)).toBe(3);
    expect(buffer.toString('utf8', 11, 14)).toBe('ccc');
  });
});
