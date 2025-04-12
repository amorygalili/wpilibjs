import { NTConnectionStatus, NTEntryFlags, NTValueType } from '../NTTypes';

describe('NTTypes', () => {
  test('NTValueType enum has correct values', () => {
    expect(NTValueType.Unassigned).toBe(0);
    expect(NTValueType.Boolean).toBe(1);
    expect(NTValueType.Double).toBe(2);
    expect(NTValueType.String).toBe(3);
    expect(NTValueType.Raw).toBe(4);
    expect(NTValueType.BooleanArray).toBe(5);
    expect(NTValueType.DoubleArray).toBe(6);
    expect(NTValueType.StringArray).toBe(7);
    expect(NTValueType.RPC).toBe(8);
  });

  test('NTEntryFlags enum has correct values', () => {
    expect(NTEntryFlags.None).toBe(0);
    expect(NTEntryFlags.Persistent).toBe(1);
  });

  test('NTConnectionStatus enum has correct values', () => {
    expect(NTConnectionStatus.Disconnected).toBe(0);
    expect(NTConnectionStatus.Connecting).toBe(1);
    expect(NTConnectionStatus.Connected).toBe(2);
  });
});
