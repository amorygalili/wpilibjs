import { NTEntry } from '../NTEntry';
import { NTEntryFlags, NTValueType } from '../../types/NTTypes';

describe('NTEntry', () => {
  test('constructor creates a new NTEntry', () => {
    const entry = new NTEntry('test', NTValueType.Boolean, false);
    expect(entry).toBeInstanceOf(NTEntry);
    expect(entry.name).toBe('test');
    expect(entry.type).toBe(NTValueType.Boolean);
    expect(entry.value).toBe(false);
    expect(entry.flags).toBe(NTEntryFlags.None);
    expect(entry.lastChange).toBe(0n);
  });

  test('constructor with flags and lastChange', () => {
    const entry = new NTEntry('test', NTValueType.Boolean, false, NTEntryFlags.Persistent, 123n);
    expect(entry.flags).toBe(NTEntryFlags.Persistent);
    expect(entry.lastChange).toBe(123n);
  });

  test('setValue updates the value and lastChange', () => {
    const entry = new NTEntry('test', NTValueType.Boolean, false);
    entry.setValue(true, 123n);
    expect(entry.value).toBe(true);
    expect(entry.lastChange).toBe(123n);
  });

  test('setValue does not update if the value is the same', () => {
    const entry = new NTEntry('test', NTValueType.Boolean, false);
    entry.setValue(false, 123n);
    expect(entry.lastChange).toBe(0n);
  });

  test('setValue notifies listeners', () => {
    const entry = new NTEntry('test', NTValueType.Boolean, false);
    const listener = jest.fn();
    entry.addEntryListener(listener);
    entry.setValue(true, 123n);
    expect(listener).toHaveBeenCalledWith({
      name: 'test',
      value: true,
      flags: NTEntryFlags.None,
      timestamp: 123n
    });
  });

  test('setFlags updates the flags and lastChange', () => {
    const entry = new NTEntry('test', NTValueType.Boolean, false);
    entry.setFlags(NTEntryFlags.Persistent, 123n);
    expect(entry.flags).toBe(NTEntryFlags.Persistent);
    expect(entry.lastChange).toBe(123n);
  });

  test('setFlags does not update if the flags are the same', () => {
    const entry = new NTEntry('test', NTValueType.Boolean, false);
    entry.setFlags(NTEntryFlags.None, 123n);
    expect(entry.lastChange).toBe(0n);
  });

  test('setFlags notifies listeners', () => {
    const entry = new NTEntry('test', NTValueType.Boolean, false);
    const listener = jest.fn();
    entry.addEntryListener(listener);
    entry.setFlags(NTEntryFlags.Persistent, 123n);
    expect(listener).toHaveBeenCalledWith({
      name: 'test',
      value: false,
      flags: NTEntryFlags.Persistent,
      timestamp: 123n
    });
  });

  test('getInfo returns the entry info', () => {
    const entry = new NTEntry('test', NTValueType.Boolean, false, NTEntryFlags.Persistent, 123n);
    const info = entry.getInfo();
    expect(info).toEqual({
      name: 'test',
      type: NTValueType.Boolean,
      flags: NTEntryFlags.Persistent,
      lastChange: 123n
    });
  });

  test('addEntryListener and removeEntryListener', () => {
    const entry = new NTEntry('test', NTValueType.Boolean, false);
    const listener = jest.fn();
    const id = entry.addEntryListener(listener);
    entry.setValue(true, 123n);
    expect(listener).toHaveBeenCalledTimes(1);
    entry.removeEntryListener(id);
    entry.setValue(false, 456n);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('_valueEquals for boolean values', () => {
    const entry = new NTEntry('test', NTValueType.Boolean, false);
    expect((entry as any)._valueEquals(false)).toBe(true);
    expect((entry as any)._valueEquals(true)).toBe(false);
  });

  test('_valueEquals for number values', () => {
    const entry = new NTEntry('test', NTValueType.Double, 123);
    expect((entry as any)._valueEquals(123)).toBe(true);
    expect((entry as any)._valueEquals(456)).toBe(false);
  });

  test('_valueEquals for string values', () => {
    const entry = new NTEntry('test', NTValueType.String, 'hello');
    expect((entry as any)._valueEquals('hello')).toBe(true);
    expect((entry as any)._valueEquals('world')).toBe(false);
  });

  test('_valueEquals for Buffer values', () => {
    const buffer = Buffer.from([1, 2, 3]);
    const entry = new NTEntry('test', NTValueType.Raw, buffer);
    expect((entry as any)._valueEquals(Buffer.from([1, 2, 3]))).toBe(true);
    expect((entry as any)._valueEquals(Buffer.from([4, 5, 6]))).toBe(false);
  });

  test('_valueEquals for array values', () => {
    const entry = new NTEntry('test', NTValueType.DoubleArray, [1, 2, 3]);
    expect((entry as any)._valueEquals([1, 2, 3])).toBe(true);
    expect((entry as any)._valueEquals([4, 5, 6])).toBe(false);
    expect((entry as any)._valueEquals([1, 2])).toBe(false);
  });
});
