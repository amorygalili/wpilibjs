import { NTValue, NTValueType } from '../types/NTTypes';

/**
 * Get the type of a value
 * 
 * @param value Value
 * @returns Value type
 */
export function getValueType(value: NTValue): NTValueType {
  // Check the type of the value
  if (typeof value === 'boolean') {
    return NTValueType.Boolean;
  } else if (typeof value === 'number') {
    return NTValueType.Double;
  } else if (typeof value === 'string') {
    return NTValueType.String;
  } else if (Buffer.isBuffer(value)) {
    return NTValueType.Raw;
  } else if (Array.isArray(value)) {
    // Check the type of the first element
    if (value.length === 0) {
      // Empty array, assume boolean array
      return NTValueType.BooleanArray;
    } else if (typeof value[0] === 'boolean') {
      return NTValueType.BooleanArray;
    } else if (typeof value[0] === 'number') {
      return NTValueType.DoubleArray;
    } else if (typeof value[0] === 'string') {
      return NTValueType.StringArray;
    }
  }

  // Unknown type
  return NTValueType.Unassigned;
}

/**
 * Check if a value is valid for a type
 * 
 * @param value Value
 * @param type Value type
 * @returns True if the value is valid for the type
 */
export function isValidValueForType(value: NTValue, type: NTValueType): boolean {
  // Check the type
  switch (type) {
    case NTValueType.Boolean:
      return typeof value === 'boolean';
    case NTValueType.Double:
      return typeof value === 'number';
    case NTValueType.String:
      return typeof value === 'string';
    case NTValueType.Raw:
      return Buffer.isBuffer(value);
    case NTValueType.BooleanArray:
      return Array.isArray(value) && (value.length === 0 || typeof value[0] === 'boolean');
    case NTValueType.DoubleArray:
      return Array.isArray(value) && (value.length === 0 || typeof value[0] === 'number');
    case NTValueType.StringArray:
      return Array.isArray(value) && (value.length === 0 || typeof value[0] === 'string');
    case NTValueType.RPC:
      return Buffer.isBuffer(value);
    default:
      return false;
  }
}

/**
 * Convert a value to a string
 * 
 * @param value Value
 * @returns String representation of the value
 */
export function valueToString(value: NTValue): string {
  // Check the type of the value
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  } else if (typeof value === 'number') {
    return value.toString();
  } else if (typeof value === 'string') {
    return value;
  } else if (Buffer.isBuffer(value)) {
    return `<Buffer: ${value.length} bytes>`;
  } else if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    } else if (typeof value[0] === 'boolean') {
      return `[${value.map(v => v ? 'true' : 'false').join(', ')}]`;
    } else if (typeof value[0] === 'number') {
      return `[${value.join(', ')}]`;
    } else if (typeof value[0] === 'string') {
      return `[${value.map(v => `"${v}"`).join(', ')}]`;
    }
  }

  // Unknown type
  return '<unknown>';
}

/**
 * Parse a string to a value
 * 
 * @param str String
 * @param type Value type
 * @returns Parsed value
 */
export function parseValue(str: string, type: NTValueType): NTValue {
  // Parse the string based on the type
  switch (type) {
    case NTValueType.Boolean:
      return str.toLowerCase() === 'true';
    case NTValueType.Double:
      return parseFloat(str);
    case NTValueType.String:
      return str;
    case NTValueType.Raw:
      return Buffer.from(str, 'utf8');
    case NTValueType.BooleanArray:
      if (str === '[]') {
        return [];
      }
      return str.substring(1, str.length - 1).split(',').map(s => s.trim().toLowerCase() === 'true');
    case NTValueType.DoubleArray:
      if (str === '[]') {
        return [];
      }
      return str.substring(1, str.length - 1).split(',').map(s => parseFloat(s.trim()));
    case NTValueType.StringArray:
      if (str === '[]') {
        return [];
      }
      return str.substring(1, str.length - 1).split(',').map(s => {
        const trimmed = s.trim();
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          return trimmed.substring(1, trimmed.length - 1);
        }
        return trimmed;
      });
    case NTValueType.RPC:
      return Buffer.from(str, 'utf8');
    default:
      throw new Error(`Invalid type: ${type}`);
  }
}

/**
 * Get the default value for a type
 * 
 * @param type Value type
 * @returns Default value
 */
export function getDefaultValue(type: NTValueType): NTValue {
  // Get the default value based on the type
  switch (type) {
    case NTValueType.Boolean:
      return false;
    case NTValueType.Double:
      return 0;
    case NTValueType.String:
      return '';
    case NTValueType.Raw:
      return Buffer.alloc(0);
    case NTValueType.BooleanArray:
      return [];
    case NTValueType.DoubleArray:
      return [];
    case NTValueType.StringArray:
      return [];
    case NTValueType.RPC:
      return Buffer.alloc(0);
    default:
      throw new Error(`Invalid type: ${type}`);
  }
}
