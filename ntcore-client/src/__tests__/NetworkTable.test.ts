import { NetworkTable } from '../NetworkTable';
import { NetworkTableInstance } from '../NetworkTableInstance';
import { Topic } from '../Topic';
import { BooleanTopic } from '../topics/BooleanTopic';
import { DoubleTopic } from '../topics/DoubleTopic';
import { StringTopic } from '../topics/StringTopic';
import { NetworkTableEntry } from '../NetworkTableEntry';

// Mock NetworkTableInstance
jest.mock('../NetworkTableInstance');
jest.mock('../Topic');
jest.mock('../NetworkTableEntry');

describe('NetworkTable', () => {
  let instance: NetworkTableInstance;
  let table: NetworkTable;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a mock instance
    instance = new NetworkTableInstance() as jest.Mocked<NetworkTableInstance>;
    
    // Create a table
    table = new NetworkTable(instance, 'test');
  });

  test('should create a NetworkTable with the correct path', () => {
    expect(table.getPath()).toBe('test');
  });

  test('should return the instance', () => {
    expect(table.getInstance()).toBe(instance);
  });

  test('should get a subtable', () => {
    const subtable = table.getSubTable('subtable');
    expect(subtable).toBeInstanceOf(NetworkTable);
    expect(subtable.getPath()).toBe('test/subtable');
  });

  test('should get an entry', () => {
    const entry = table.getEntry('entry');
    expect(entry).toBeInstanceOf(NetworkTableEntry);
  });

  test('should get a topic', () => {
    // Setup mock
    const mockTopic = new Topic(instance, 'test/topic');
    (instance.getTopic as jest.Mock).mockReturnValue(mockTopic);
    
    const topic = table.getTopic('topic');
    expect(instance.getTopic).toHaveBeenCalledWith('test/topic');
    expect(topic).toBe(mockTopic);
  });

  test('should get a boolean topic', () => {
    // Setup mock
    const mockTopic = new Topic(instance, 'test/topic');
    (instance.getTopic as jest.Mock).mockReturnValue(mockTopic);
    
    const topic = table.getBooleanTopic('topic');
    expect(instance.getTopic).toHaveBeenCalledWith('test/topic');
    expect(topic).toBeInstanceOf(BooleanTopic);
  });

  test('should get a double topic', () => {
    // Setup mock
    const mockTopic = new Topic(instance, 'test/topic');
    (instance.getTopic as jest.Mock).mockReturnValue(mockTopic);
    
    const topic = table.getDoubleTopic('topic');
    expect(instance.getTopic).toHaveBeenCalledWith('test/topic');
    expect(topic).toBeInstanceOf(DoubleTopic);
  });

  test('should get a string topic', () => {
    // Setup mock
    const mockTopic = new Topic(instance, 'test/topic');
    (instance.getTopic as jest.Mock).mockReturnValue(mockTopic);
    
    const topic = table.getStringTopic('topic');
    expect(instance.getTopic).toHaveBeenCalledWith('test/topic');
    expect(topic).toBeInstanceOf(StringTopic);
  });

  test('should get the basename of a key', () => {
    expect(NetworkTable.basenameKey('/foo/bar')).toBe('bar');
    expect(NetworkTable.basenameKey('bar')).toBe('bar');
    expect(NetworkTable.basenameKey('/foo/')).toBe('');
  });

  test('should normalize a key', () => {
    expect(NetworkTable.normalizeKey('/foo/bar')).toBe('/foo/bar');
    expect(NetworkTable.normalizeKey('foo/bar')).toBe('/foo/bar');
  });

  test('should get the hierarchy of a key', () => {
    const hierarchy = NetworkTable.getHierarchy('/foo/bar/baz');
    expect(hierarchy).toEqual(['/', '/foo', '/foo/bar', '/foo/bar/baz']);
  });

  test('should return a string representation', () => {
    expect(table.toString()).toBe('NetworkTable: test');
  });
});
