import { Struct } from '../Struct';
import { StructFieldType, Endianness, field } from '../StructField';

describe('Struct', () => {
  test('constructor creates a new Struct', () => {
    const struct = new Struct();
    expect(struct).toBeInstanceOf(Struct);
  });

  test('constructor with fields creates a new Struct', () => {
    const struct = new Struct([
      field('field1', StructFieldType.Int32),
      field('field2', StructFieldType.Float64)
    ]);
    expect(struct).toBeInstanceOf(Struct);
  });

  test('addField adds a field to the struct', () => {
    const struct = new Struct();
    struct.addField(field('field1', StructFieldType.Int32));
    struct.addField(field('field2', StructFieldType.Float64));

    // Pack and unpack to verify fields were added
    const data = { field1: 42, field2: 3.14 };
    const buffer = struct.pack(data);
    const unpacked = struct.unpack(buffer);

    expect(unpacked.field1).toBe(42);
    expect(unpacked.field2).toBe(3.14);
  });

  test('getSize returns the size of the struct', () => {
    const struct = new Struct([
      field('field1', StructFieldType.Int32),  // 4 bytes
      field('field2', StructFieldType.Float64) // 8 bytes
    ]);

    // Size should be 12 bytes
    expect(struct.getSize()).toBe(12);
  });

  test('getSize with variable-length fields', () => {
    const struct = new Struct([
      field('field1', StructFieldType.Int32),  // 4 bytes
      field('field2', StructFieldType.String)  // Variable length
    ]);

    // Size depends on the data
    const data = { field1: 42, field2: 'hello' };
    expect(struct.getSize(data)).toBe(4 + 5); // 4 bytes for Int32 + 5 bytes for 'hello'
  });

  test('pack and unpack with fixed-length fields', () => {
    const struct = new Struct([
      field('field1', StructFieldType.Int8),
      field('field2', StructFieldType.Uint8),
      field('field3', StructFieldType.Int16),
      field('field4', StructFieldType.Uint16),
      field('field5', StructFieldType.Int32),
      field('field6', StructFieldType.Uint32),
      field('field7', StructFieldType.Float32),
      field('field8', StructFieldType.Float64),
      field('field9', StructFieldType.Bool)
    ]);

    const data = {
      field1: -42,
      field2: 42,
      field3: -1000,
      field4: 1000,
      field5: -100000,
      field6: 100000,
      field7: 3.14,
      field8: 2.71828,
      field9: true
    };

    const buffer = struct.pack(data);
    const unpacked = struct.unpack(buffer);

    expect(unpacked.field1).toBe(-42);
    expect(unpacked.field2).toBe(42);
    expect(unpacked.field3).toBe(-1000);
    expect(unpacked.field4).toBe(1000);
    expect(unpacked.field5).toBe(-100000);
    expect(unpacked.field6).toBe(100000);
    expect(unpacked.field7).toBeCloseTo(3.14, 5);
    expect(unpacked.field8).toBeCloseTo(2.71828, 10);
    expect(unpacked.field9).toBe(true);
  });

  test.skip('pack and unpack with variable-length fields', () => {
    const struct = new Struct([
      field('field1', StructFieldType.Int32),
      field('field2', StructFieldType.String),
      field('field3', StructFieldType.Buffer)
    ]);

    const data = {
      field1: 42,
      field2: 'hello',
      field3: Buffer.from([1, 2, 3, 4, 5])
    };

    const buffer = struct.pack(data);
    const unpacked = struct.unpack(buffer);

    expect(unpacked.field1).toBe(42);
    expect(unpacked.field2).toEqual('hello');
    expect(Buffer.isBuffer(unpacked.field3)).toBe(true);
    expect(unpacked.field3.length).toBe(5);
    expect(unpacked.field3[0]).toBe(1);
    expect(unpacked.field3[4]).toBe(5);
  });

  test('pack and unpack with fixed-length string and buffer', () => {
    const struct = new Struct([
      field('field1', StructFieldType.String, { size: 10 }),
      field('field2', StructFieldType.Buffer, { size: 5 })
    ]);

    const data = {
      field1: 'hello',
      field2: Buffer.from([1, 2, 3])
    };

    const buffer = struct.pack(data);
    const unpacked = struct.unpack(buffer);

    expect(unpacked.field1).toBe('hello');
    expect(Buffer.isBuffer(unpacked.field2)).toBe(true);
    expect(unpacked.field2.length).toBe(5);
    expect(unpacked.field2[0]).toBe(1);
    expect(unpacked.field2[2]).toBe(3);
    expect(unpacked.field2[3]).toBe(0); // Padded with zeros
    expect(unpacked.field2[4]).toBe(0); // Padded with zeros
  });

  test('pack and unpack with different endianness', () => {
    const structLE = new Struct([
      field('field1', StructFieldType.Int32, { endianness: Endianness.Little }),
      field('field2', StructFieldType.Float64, { endianness: Endianness.Little })
    ]);

    const structBE = new Struct([
      field('field1', StructFieldType.Int32, { endianness: Endianness.Big }),
      field('field2', StructFieldType.Float64, { endianness: Endianness.Big })
    ]);

    const data = {
      field1: 42,
      field2: 3.14
    };

    const bufferLE = structLE.pack(data);
    const bufferBE = structBE.pack(data);

    // The buffers should be different
    expect(bufferLE).not.toEqual(bufferBE);

    // But unpacking should give the same results
    const unpackedLE = structLE.unpack(bufferLE);
    const unpackedBE = structBE.unpack(bufferBE);

    expect(unpackedLE.field1).toBe(42);
    expect(unpackedLE.field2).toBeCloseTo(3.14, 10);
    expect(unpackedBE.field1).toBe(42);
    expect(unpackedBE.field2).toBeCloseTo(3.14, 10);
  });

  test('pack throws error for missing fields', () => {
    const struct = new Struct([
      field('field1', StructFieldType.Int32),
      field('field2', StructFieldType.Float64)
    ]);

    // Missing field2
    const data = { field1: 42 };

    expect(() => struct.pack(data)).toThrow('Missing value for field field2');
  });

  test('getSize throws error for variable-length struct without data', () => {
    const struct = new Struct([
      field('field1', StructFieldType.Int32),
      field('field2', StructFieldType.String)
    ]);

    expect(() => struct.getSize()).toThrow('Data is required to calculate the size of a variable-length struct');
  });
});
