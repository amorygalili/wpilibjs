import { 
  NTMessageType, 
  NTMessageFlags, 
  NTErrorCode, 
  NT_PROTOCOL_VERSION 
} from '../NTProtocol';

describe('NTProtocol', () => {
  test('NT_PROTOCOL_VERSION is correct', () => {
    expect(NT_PROTOCOL_VERSION).toBe(0x0300);
  });

  test('NTMessageType enum has correct values', () => {
    expect(NTMessageType.KeepAlive).toBe(0x00);
    expect(NTMessageType.ClientHello).toBe(0x01);
    expect(NTMessageType.ProtoUnsupported).toBe(0x02);
    expect(NTMessageType.ServerHelloComplete).toBe(0x03);
    expect(NTMessageType.ServerHello).toBe(0x04);
    expect(NTMessageType.ClientHelloComplete).toBe(0x05);
    expect(NTMessageType.EntryAssignment).toBe(0x10);
    expect(NTMessageType.EntryUpdate).toBe(0x11);
    expect(NTMessageType.FlagsUpdate).toBe(0x12);
    expect(NTMessageType.EntryDelete).toBe(0x13);
    expect(NTMessageType.ClearEntries).toBe(0x14);
    expect(NTMessageType.RpcDefinition).toBe(0x20);
    expect(NTMessageType.RpcExecution).toBe(0x21);
  });

  test('NTMessageFlags enum has correct values', () => {
    expect(NTMessageFlags.None).toBe(0x00);
    expect(NTMessageFlags.Persistent).toBe(0x01);
  });

  test('NTErrorCode enum has correct values', () => {
    expect(NTErrorCode.None).toBe(0x00);
    expect(NTErrorCode.ProtocolUnsupported).toBe(0x01);
    expect(NTErrorCode.MessageTypeUnsupported).toBe(0x02);
    expect(NTErrorCode.MessageFormatError).toBe(0x03);
    expect(NTErrorCode.EntryExists).toBe(0x10);
    expect(NTErrorCode.EntryNotFound).toBe(0x11);
    expect(NTErrorCode.EntryTypeMismatch).toBe(0x12);
    expect(NTErrorCode.EntryValueInvalid).toBe(0x13);
    expect(NTErrorCode.RpcDefinitionExists).toBe(0x20);
    expect(NTErrorCode.RpcDefinitionNotFound).toBe(0x21);
    expect(NTErrorCode.RpcExecutionFailed).toBe(0x22);
  });
});
