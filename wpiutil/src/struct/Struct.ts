import { StructField, StructFieldType, Endianness, getTypeSize } from './StructField';

/**
 * A binary data structure
 */
export class Struct {
  private fields: StructField[] = [];
  private fixedSize: number = 0;
  private hasVariableLength: boolean = false;
  
  /**
   * Create a new struct
   * 
   * @param fields The fields in the struct
   */
  constructor(fields: StructField[] = []) {
    for (const field of fields) {
      this.addField(field);
    }
  }
  
  /**
   * Add a field to the struct
   * 
   * @param field The field to add
   */
  addField(field: StructField): void {
    this.fields.push(field);
    
    const typeSize = getTypeSize(field.type);
    if (typeSize !== undefined) {
      this.fixedSize += typeSize;
    } else {
      this.hasVariableLength = true;
      if (field.size !== undefined) {
        this.fixedSize += field.size;
      }
    }
  }
  
  /**
   * Get the size of the struct in bytes
   * 
   * @param data The data to calculate the size for (required for variable-length structs)
   * @returns The size of the struct in bytes
   */
  getSize(data?: Record<string, any>): number {
    if (!this.hasVariableLength) {
      return this.fixedSize;
    }
    
    if (!data) {
      throw new Error('Data is required to calculate the size of a variable-length struct');
    }
    
    let size = this.fixedSize;
    
    for (const field of this.fields) {
      const typeSize = getTypeSize(field.type);
      if (typeSize === undefined && field.size === undefined) {
        const value = data[field.name];
        
        if (field.type === StructFieldType.String) {
          // Add the length of the string in bytes (UTF-8)
          size += Buffer.from(value, 'utf8').length;
        } else if (field.type === StructFieldType.Buffer) {
          // Add the length of the buffer
          size += value.length;
        }
      }
    }
    
    return size;
  }
  
  /**
   * Pack data into a buffer
   * 
   * @param data The data to pack
   * @returns A buffer containing the packed data
   */
  pack(data: Record<string, any>): Buffer {
    const size = this.getSize(data);
    const buffer = Buffer.alloc(size);
    let offset = 0;
    
    for (const field of this.fields) {
      const value = data[field.name];
      
      if (value === undefined) {
        throw new Error(`Missing value for field ${field.name}`);
      }
      
      offset = this.packField(buffer, offset, field, value);
    }
    
    return buffer;
  }
  
  /**
   * Unpack data from a buffer
   * 
   * @param buffer The buffer to unpack
   * @returns The unpacked data
   */
  unpack(buffer: Buffer): Record<string, any> {
    const data: Record<string, any> = {};
    let offset = 0;
    
    for (const field of this.fields) {
      const result = this.unpackField(buffer, offset, field);
      data[field.name] = result.value;
      offset = result.offset;
    }
    
    return data;
  }
  
  /**
   * Pack a field into a buffer
   * 
   * @param buffer The buffer to pack into
   * @param offset The offset to start packing at
   * @param field The field to pack
   * @param value The value to pack
   * @returns The new offset
   */
  private packField(buffer: Buffer, offset: number, field: StructField, value: any): number {
    const littleEndian = field.endianness === Endianness.Little;
    
    switch (field.type) {
      case StructFieldType.Int8:
        buffer.writeInt8(value, offset);
        return offset + 1;
      
      case StructFieldType.Uint8:
        buffer.writeUint8(value, offset);
        return offset + 1;
      
      case StructFieldType.Int16:
        if (littleEndian) {
          buffer.writeInt16LE(value, offset);
        } else {
          buffer.writeInt16BE(value, offset);
        }
        return offset + 2;
      
      case StructFieldType.Uint16:
        if (littleEndian) {
          buffer.writeUint16LE(value, offset);
        } else {
          buffer.writeUint16BE(value, offset);
        }
        return offset + 2;
      
      case StructFieldType.Int32:
        if (littleEndian) {
          buffer.writeInt32LE(value, offset);
        } else {
          buffer.writeInt32BE(value, offset);
        }
        return offset + 4;
      
      case StructFieldType.Uint32:
        if (littleEndian) {
          buffer.writeUint32LE(value, offset);
        } else {
          buffer.writeUint32BE(value, offset);
        }
        return offset + 4;
      
      case StructFieldType.Int64:
        if (littleEndian) {
          buffer.writeBigInt64LE(BigInt(value), offset);
        } else {
          buffer.writeBigInt64BE(BigInt(value), offset);
        }
        return offset + 8;
      
      case StructFieldType.Uint64:
        if (littleEndian) {
          buffer.writeBigUint64LE(BigInt(value), offset);
        } else {
          buffer.writeBigUint64BE(BigInt(value), offset);
        }
        return offset + 8;
      
      case StructFieldType.Float32:
        if (littleEndian) {
          buffer.writeFloatLE(value, offset);
        } else {
          buffer.writeFloatBE(value, offset);
        }
        return offset + 4;
      
      case StructFieldType.Float64:
        if (littleEndian) {
          buffer.writeDoubleLE(value, offset);
        } else {
          buffer.writeDoubleBE(value, offset);
        }
        return offset + 8;
      
      case StructFieldType.Bool:
        buffer.writeUint8(value ? 1 : 0, offset);
        return offset + 1;
      
      case StructFieldType.String:
        if (field.size !== undefined) {
          // Fixed-length string
          const strBuffer = Buffer.from(value, 'utf8');
          const length = Math.min(strBuffer.length, field.size);
          strBuffer.copy(buffer, offset, 0, length);
          
          // Pad with zeros
          for (let i = length; i < field.size; i++) {
            buffer[offset + i] = 0;
          }
          
          return offset + field.size;
        } else {
          // Variable-length string
          const strBuffer = Buffer.from(value, 'utf8');
          strBuffer.copy(buffer, offset);
          return offset + strBuffer.length;
        }
      
      case StructFieldType.Buffer:
        if (field.size !== undefined) {
          // Fixed-length buffer
          const length = Math.min(value.length, field.size);
          value.copy(buffer, offset, 0, length);
          
          // Pad with zeros
          for (let i = length; i < field.size; i++) {
            buffer[offset + i] = 0;
          }
          
          return offset + field.size;
        } else {
          // Variable-length buffer
          value.copy(buffer, offset);
          return offset + value.length;
        }
      
      default:
        throw new Error(`Unsupported field type: ${field.type}`);
    }
  }
  
  /**
   * Unpack a field from a buffer
   * 
   * @param buffer The buffer to unpack from
   * @param offset The offset to start unpacking at
   * @param field The field to unpack
   * @returns The unpacked value and the new offset
   */
  private unpackField(buffer: Buffer, offset: number, field: StructField): { value: any; offset: number } {
    const littleEndian = field.endianness === Endianness.Little;
    
    switch (field.type) {
      case StructFieldType.Int8:
        return {
          value: buffer.readInt8(offset),
          offset: offset + 1
        };
      
      case StructFieldType.Uint8:
        return {
          value: buffer.readUint8(offset),
          offset: offset + 1
        };
      
      case StructFieldType.Int16:
        return {
          value: littleEndian ? buffer.readInt16LE(offset) : buffer.readInt16BE(offset),
          offset: offset + 2
        };
      
      case StructFieldType.Uint16:
        return {
          value: littleEndian ? buffer.readUint16LE(offset) : buffer.readUint16BE(offset),
          offset: offset + 2
        };
      
      case StructFieldType.Int32:
        return {
          value: littleEndian ? buffer.readInt32LE(offset) : buffer.readInt32BE(offset),
          offset: offset + 4
        };
      
      case StructFieldType.Uint32:
        return {
          value: littleEndian ? buffer.readUint32LE(offset) : buffer.readUint32BE(offset),
          offset: offset + 4
        };
      
      case StructFieldType.Int64:
        return {
          value: littleEndian ? buffer.readBigInt64LE(offset) : buffer.readBigInt64BE(offset),
          offset: offset + 8
        };
      
      case StructFieldType.Uint64:
        return {
          value: littleEndian ? buffer.readBigUint64LE(offset) : buffer.readBigUint64BE(offset),
          offset: offset + 8
        };
      
      case StructFieldType.Float32:
        return {
          value: littleEndian ? buffer.readFloatLE(offset) : buffer.readFloatBE(offset),
          offset: offset + 4
        };
      
      case StructFieldType.Float64:
        return {
          value: littleEndian ? buffer.readDoubleLE(offset) : buffer.readDoubleBE(offset),
          offset: offset + 8
        };
      
      case StructFieldType.Bool:
        return {
          value: buffer.readUint8(offset) !== 0,
          offset: offset + 1
        };
      
      case StructFieldType.String:
        if (field.size !== undefined) {
          // Fixed-length string
          // Find the null terminator or use the full size
          let length = 0;
          while (length < field.size && buffer[offset + length] !== 0) {
            length++;
          }
          
          return {
            value: buffer.toString('utf8', offset, offset + length),
            offset: offset + field.size
          };
        } else {
          // Variable-length string (must be the last field)
          return {
            value: buffer.toString('utf8', offset),
            offset: buffer.length
          };
        }
      
      case StructFieldType.Buffer:
        if (field.size !== undefined) {
          // Fixed-length buffer
          return {
            value: Buffer.from(buffer.subarray(offset, offset + field.size)),
            offset: offset + field.size
          };
        } else {
          // Variable-length buffer (must be the last field)
          return {
            value: Buffer.from(buffer.subarray(offset)),
            offset: buffer.length
          };
        }
      
      default:
        throw new Error(`Unsupported field type: ${field.type}`);
    }
  }
}
