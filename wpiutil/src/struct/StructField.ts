/**
 * Data types for struct fields
 */
export enum StructFieldType {
  Int8,
  Uint8,
  Int16,
  Uint16,
  Int32,
  Uint32,
  Int64,
  Uint64,
  Float32,
  Float64,
  Bool,
  String,
  Buffer
}

/**
 * Endianness for struct fields
 */
export enum Endianness {
  Little,
  Big
}

/**
 * A field in a struct
 */
export interface StructField {
  /**
   * The name of the field
   */
  name: string;
  
  /**
   * The type of the field
   */
  type: StructFieldType;
  
  /**
   * The size of the field in bytes (for variable-length fields)
   */
  size?: number;
  
  /**
   * The endianness of the field
   */
  endianness?: Endianness;
}

/**
 * Create a struct field
 * 
 * @param name The name of the field
 * @param type The type of the field
 * @param options Additional options for the field
 * @returns A struct field
 */
export function field(
  name: string,
  type: StructFieldType,
  options: { size?: number; endianness?: Endianness } = {}
): StructField {
  return {
    name,
    type,
    size: options.size,
    endianness: options.endianness ?? Endianness.Little
  };
}

/**
 * Get the size of a struct field type in bytes
 * 
 * @param type The struct field type
 * @returns The size of the type in bytes, or undefined for variable-length types
 */
export function getTypeSize(type: StructFieldType): number | undefined {
  switch (type) {
    case StructFieldType.Int8:
    case StructFieldType.Uint8:
    case StructFieldType.Bool:
      return 1;
    case StructFieldType.Int16:
    case StructFieldType.Uint16:
      return 2;
    case StructFieldType.Int32:
    case StructFieldType.Uint32:
    case StructFieldType.Float32:
      return 4;
    case StructFieldType.Int64:
    case StructFieldType.Uint64:
    case StructFieldType.Float64:
      return 8;
    case StructFieldType.String:
    case StructFieldType.Buffer:
      return undefined; // Variable length
  }
}
