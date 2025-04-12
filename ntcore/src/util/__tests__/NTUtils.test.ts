import { getDefaultValue, getValueType, isValidValueForType, parseValue, valueToString } from '../NTUtils';
import { NTValueType } from '../../types/NTTypes';

describe('NTUtils', () => {
  describe('getValueType', () => {
    test('returns Boolean for boolean values', () => {
      expect(getValueType(true)).toBe(NTValueType.Boolean);
      expect(getValueType(false)).toBe(NTValueType.Boolean);
    });

    test('returns Double for number values', () => {
      expect(getValueType(123)).toBe(NTValueType.Double);
      expect(getValueType(3.14)).toBe(NTValueType.Double);
    });

    test('returns String for string values', () => {
      expect(getValueType('hello')).toBe(NTValueType.String);
      expect(getValueType('')).toBe(NTValueType.String);
    });

    test('returns Raw for Buffer values', () => {
      expect(getValueType(Buffer.from([1, 2, 3]))).toBe(NTValueType.Raw);
      expect(getValueType(Buffer.alloc(0))).toBe(NTValueType.Raw);
    });

    test('returns BooleanArray for boolean arrays', () => {
      expect(getValueType([true, false])).toBe(NTValueType.BooleanArray);
      expect(getValueType([])).toBe(NTValueType.BooleanArray);
    });

    test('returns DoubleArray for number arrays', () => {
      expect(getValueType([1, 2, 3])).toBe(NTValueType.DoubleArray);
    });

    test('returns StringArray for string arrays', () => {
      expect(getValueType(['hello', 'world'])).toBe(NTValueType.StringArray);
    });

    test('returns Unassigned for unknown types', () => {
      expect(getValueType(null as any)).toBe(NTValueType.Unassigned);
      expect(getValueType(undefined as any)).toBe(NTValueType.Unassigned);
      expect(getValueType({} as any)).toBe(NTValueType.Unassigned);
    });
  });

  describe('isValidValueForType', () => {
    test('validates Boolean values', () => {
      expect(isValidValueForType(true, NTValueType.Boolean)).toBe(true);
      expect(isValidValueForType(false, NTValueType.Boolean)).toBe(true);
      expect(isValidValueForType(123, NTValueType.Boolean)).toBe(false);
      expect(isValidValueForType('true', NTValueType.Boolean)).toBe(false);
    });

    test('validates Double values', () => {
      expect(isValidValueForType(123, NTValueType.Double)).toBe(true);
      expect(isValidValueForType(3.14, NTValueType.Double)).toBe(true);
      expect(isValidValueForType(true, NTValueType.Double)).toBe(false);
      expect(isValidValueForType('123', NTValueType.Double)).toBe(false);
    });

    test('validates String values', () => {
      expect(isValidValueForType('hello', NTValueType.String)).toBe(true);
      expect(isValidValueForType('', NTValueType.String)).toBe(true);
      expect(isValidValueForType(123, NTValueType.String)).toBe(false);
      expect(isValidValueForType(true, NTValueType.String)).toBe(false);
    });

    test('validates Raw values', () => {
      expect(isValidValueForType(Buffer.from([1, 2, 3]), NTValueType.Raw)).toBe(true);
      expect(isValidValueForType(Buffer.alloc(0), NTValueType.Raw)).toBe(true);
      expect(isValidValueForType([1, 2, 3], NTValueType.Raw)).toBe(false);
      expect(isValidValueForType('hello', NTValueType.Raw)).toBe(false);
    });

    test('validates BooleanArray values', () => {
      expect(isValidValueForType([true, false], NTValueType.BooleanArray)).toBe(true);
      expect(isValidValueForType([], NTValueType.BooleanArray)).toBe(true);
      expect(isValidValueForType([1, 2, 3], NTValueType.BooleanArray)).toBe(false);
      expect(isValidValueForType(['hello', 'world'], NTValueType.BooleanArray)).toBe(false);
    });

    test('validates DoubleArray values', () => {
      expect(isValidValueForType([1, 2, 3], NTValueType.DoubleArray)).toBe(true);
      expect(isValidValueForType([], NTValueType.DoubleArray)).toBe(true);
      expect(isValidValueForType([true, false], NTValueType.DoubleArray)).toBe(false);
      expect(isValidValueForType(['hello', 'world'], NTValueType.DoubleArray)).toBe(false);
    });

    test('validates StringArray values', () => {
      expect(isValidValueForType(['hello', 'world'], NTValueType.StringArray)).toBe(true);
      expect(isValidValueForType([], NTValueType.StringArray)).toBe(true);
      expect(isValidValueForType([1, 2, 3], NTValueType.StringArray)).toBe(false);
      expect(isValidValueForType([true, false], NTValueType.StringArray)).toBe(false);
    });

    test('validates RPC values', () => {
      expect(isValidValueForType(Buffer.from([1, 2, 3]), NTValueType.RPC)).toBe(true);
      expect(isValidValueForType(Buffer.alloc(0), NTValueType.RPC)).toBe(true);
      expect(isValidValueForType([1, 2, 3], NTValueType.RPC)).toBe(false);
      expect(isValidValueForType('hello', NTValueType.RPC)).toBe(false);
    });

    test('returns false for Unassigned type', () => {
      expect(isValidValueForType(true, NTValueType.Unassigned)).toBe(false);
      expect(isValidValueForType(123, NTValueType.Unassigned)).toBe(false);
      expect(isValidValueForType('hello', NTValueType.Unassigned)).toBe(false);
    });
  });

  describe('valueToString', () => {
    test('converts boolean values to strings', () => {
      expect(valueToString(true)).toBe('true');
      expect(valueToString(false)).toBe('false');
    });

    test('converts number values to strings', () => {
      expect(valueToString(123)).toBe('123');
      expect(valueToString(3.14)).toBe('3.14');
    });

    test('converts string values to strings', () => {
      expect(valueToString('hello')).toBe('hello');
      expect(valueToString('')).toBe('');
    });

    test('converts Buffer values to strings', () => {
      expect(valueToString(Buffer.from([1, 2, 3]))).toBe('<Buffer: 3 bytes>');
      expect(valueToString(Buffer.alloc(0))).toBe('<Buffer: 0 bytes>');
    });

    test('converts boolean arrays to strings', () => {
      expect(valueToString([true, false])).toBe('[true, false]');
      expect(valueToString([])).toBe('[]');
    });

    test('converts number arrays to strings', () => {
      expect(valueToString([1, 2, 3])).toBe('[1, 2, 3]');
    });

    test('converts string arrays to strings', () => {
      expect(valueToString(['hello', 'world'])).toBe('["hello", "world"]');
    });

    test('returns <unknown> for unknown types', () => {
      expect(valueToString(null as any)).toBe('<unknown>');
      expect(valueToString(undefined as any)).toBe('<unknown>');
      expect(valueToString({} as any)).toBe('<unknown>');
    });
  });

  describe('parseValue', () => {
    test('parses boolean values', () => {
      expect(parseValue('true', NTValueType.Boolean)).toBe(true);
      expect(parseValue('false', NTValueType.Boolean)).toBe(false);
      expect(parseValue('TRUE', NTValueType.Boolean)).toBe(true);
      expect(parseValue('FALSE', NTValueType.Boolean)).toBe(false);
    });

    test('parses number values', () => {
      expect(parseValue('123', NTValueType.Double)).toBe(123);
      expect(parseValue('3.14', NTValueType.Double)).toBe(3.14);
    });

    test('parses string values', () => {
      expect(parseValue('hello', NTValueType.String)).toBe('hello');
      expect(parseValue('', NTValueType.String)).toBe('');
    });

    test('parses Buffer values', () => {
      expect(parseValue('hello', NTValueType.Raw)).toEqual(Buffer.from('hello', 'utf8'));
      expect(parseValue('', NTValueType.Raw)).toEqual(Buffer.from('', 'utf8'));
    });

    test('parses boolean arrays', () => {
      expect(parseValue('[true, false]', NTValueType.BooleanArray)).toEqual([true, false]);
      expect(parseValue('[]', NTValueType.BooleanArray)).toEqual([]);
    });

    test('parses number arrays', () => {
      expect(parseValue('[1, 2, 3]', NTValueType.DoubleArray)).toEqual([1, 2, 3]);
      expect(parseValue('[]', NTValueType.DoubleArray)).toEqual([]);
    });

    test('parses string arrays', () => {
      expect(parseValue('["hello", "world"]', NTValueType.StringArray)).toEqual(['hello', 'world']);
      expect(parseValue('[]', NTValueType.StringArray)).toEqual([]);
    });

    test('parses RPC values', () => {
      expect(parseValue('hello', NTValueType.RPC)).toEqual(Buffer.from('hello', 'utf8'));
      expect(parseValue('', NTValueType.RPC)).toEqual(Buffer.from('', 'utf8'));
    });

    test('throws for Unassigned type', () => {
      expect(() => parseValue('hello', NTValueType.Unassigned)).toThrow('Invalid type: 0');
    });
  });

  describe('getDefaultValue', () => {
    test('returns default boolean value', () => {
      expect(getDefaultValue(NTValueType.Boolean)).toBe(false);
    });

    test('returns default number value', () => {
      expect(getDefaultValue(NTValueType.Double)).toBe(0);
    });

    test('returns default string value', () => {
      expect(getDefaultValue(NTValueType.String)).toBe('');
    });

    test('returns default Buffer value', () => {
      expect(getDefaultValue(NTValueType.Raw)).toEqual(Buffer.alloc(0));
    });

    test('returns default boolean array', () => {
      expect(getDefaultValue(NTValueType.BooleanArray)).toEqual([]);
    });

    test('returns default number array', () => {
      expect(getDefaultValue(NTValueType.DoubleArray)).toEqual([]);
    });

    test('returns default string array', () => {
      expect(getDefaultValue(NTValueType.StringArray)).toEqual([]);
    });

    test('returns default RPC value', () => {
      expect(getDefaultValue(NTValueType.RPC)).toEqual(Buffer.alloc(0));
    });

    test('throws for Unassigned type', () => {
      expect(() => getDefaultValue(NTValueType.Unassigned)).toThrow('Invalid type: 0');
    });
  });
});
