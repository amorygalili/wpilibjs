import { NetworkTableEntry } from '../NetworkTableEntry';
import { NetworkTableInstance } from '../NetworkTableInstance';
import { Topic } from '../Topic';
import { NT4_Client } from '../NT4_Node';

// Mock NetworkTableInstance, Topic, and NT4_Client
jest.mock('../NetworkTableInstance');
jest.mock('../Topic');
jest.mock('../NT4_Node');

describe('NetworkTableEntry', () => {
  let instance: NetworkTableInstance;
  let entry: NetworkTableEntry;
  let mockTopic: jest.Mocked<Topic>;
  let mockClient: jest.Mocked<NT4_Client>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a mock instance
    instance = new NetworkTableInstance() as jest.Mocked<NetworkTableInstance>;
    
    // Create a mock topic
    mockTopic = new Topic(instance, 'test') as jest.Mocked<Topic>;
    (instance.getTopic as jest.Mock).mockReturnValue(mockTopic);
    
    // Create a mock client
    mockClient = new NT4_Client(
      'localhost',
      'test',
      jest.fn(),
      jest.fn(),
      jest.fn(),
      jest.fn(),
      jest.fn()
    ) as jest.Mocked<NT4_Client>;
    
    // Setup the instance to return the mock client
    (instance.getClient as jest.Mock).mockReturnValue(mockClient);
    
    // Create an entry
    entry = new NetworkTableEntry(instance, 'test');
  });

  test('should create a NetworkTableEntry with the correct name', () => {
    expect(entry.getName()).toBe('test');
  });

  test('should return the instance', () => {
    expect(entry.getInstance()).toBe(instance);
  });

  test('should return the topic', () => {
    expect(entry.getTopic()).toBe(mockTopic);
  });

  test('should check if the entry exists', () => {
    // Setup mock
    (mockTopic.exists as jest.Mock).mockReturnValue(true);
    
    expect(entry.exists()).toBe(true);
    expect(mockTopic.exists).toHaveBeenCalled();
  });

  test('should get the last change time', () => {
    // @ts-ignore - accessing private property for testing
    entry.lastTimestamp = 12345;
    
    expect(entry.getLastChange()).toBe(12345);
  });

  test('should get and set a boolean value', () => {
    // Set a value
    entry.setBoolean(true);
    
    // Should have published the topic if it doesn't exist
    expect(mockTopic.exists).toHaveBeenCalled();
    expect(mockClient.publishTopic).toHaveBeenCalledWith('test', 'boolean');
    
    // Should have set the value
    expect(mockClient.addSample).toHaveBeenCalledWith('test', true);
    
    // Should have updated the local value
    // @ts-ignore - accessing private property for testing
    expect(entry.lastValue).toBe(true);
    
    // Get the value
    // @ts-ignore - accessing private property for testing
    entry.lastValue = true;
    expect(entry.getBoolean(false)).toBe(true);
    
    // Get with default value when no value is set
    // @ts-ignore - accessing private property for testing
    entry.lastValue = null;
    expect(entry.getBoolean(false)).toBe(false);
  });

  test('should get and set a double value', () => {
    // Set a value
    entry.setDouble(123.456);
    
    // Should have published the topic if it doesn't exist
    expect(mockTopic.exists).toHaveBeenCalled();
    expect(mockClient.publishTopic).toHaveBeenCalledWith('test', 'double');
    
    // Should have set the value
    expect(mockClient.addSample).toHaveBeenCalledWith('test', 123.456);
    
    // Should have updated the local value
    // @ts-ignore - accessing private property for testing
    expect(entry.lastValue).toBe(123.456);
    
    // Get the value
    // @ts-ignore - accessing private property for testing
    entry.lastValue = 123.456;
    expect(entry.getDouble(0)).toBe(123.456);
    
    // Get with default value when no value is set
    // @ts-ignore - accessing private property for testing
    entry.lastValue = null;
    expect(entry.getDouble(0)).toBe(0);
  });

  test('should get and set a string value', () => {
    // Set a value
    entry.setString('test-string');
    
    // Should have published the topic if it doesn't exist
    expect(mockTopic.exists).toHaveBeenCalled();
    expect(mockClient.publishTopic).toHaveBeenCalledWith('test', 'string');
    
    // Should have set the value
    expect(mockClient.addSample).toHaveBeenCalledWith('test', 'test-string');
    
    // Should have updated the local value
    // @ts-ignore - accessing private property for testing
    expect(entry.lastValue).toBe('test-string');
    
    // Get the value
    // @ts-ignore - accessing private property for testing
    entry.lastValue = 'test-string';
    expect(entry.getString('')).toBe('test-string');
    
    // Get with default value when no value is set
    // @ts-ignore - accessing private property for testing
    entry.lastValue = null;
    expect(entry.getString('')).toBe('');
  });

  test('should get and set a boolean array value', () => {
    const array = [true, false, true];
    
    // Set a value
    entry.setBooleanArray(array);
    
    // Should have published the topic if it doesn't exist
    expect(mockTopic.exists).toHaveBeenCalled();
    expect(mockClient.publishTopic).toHaveBeenCalledWith('test', 'boolean[]');
    
    // Should have set the value
    expect(mockClient.addSample).toHaveBeenCalledWith('test', array);
    
    // Should have updated the local value
    // @ts-ignore - accessing private property for testing
    expect(entry.lastValue).toBe(array);
    
    // Get the value
    // @ts-ignore - accessing private property for testing
    entry.lastValue = array;
    expect(entry.getBooleanArray([])).toBe(array);
    
    // Get with default value when no value is set
    // @ts-ignore - accessing private property for testing
    entry.lastValue = null;
    expect(entry.getBooleanArray([])).toEqual([]);
  });

  test('should get and set a double array value', () => {
    const array = [1.1, 2.2, 3.3];
    
    // Set a value
    entry.setDoubleArray(array);
    
    // Should have published the topic if it doesn't exist
    expect(mockTopic.exists).toHaveBeenCalled();
    expect(mockClient.publishTopic).toHaveBeenCalledWith('test', 'double[]');
    
    // Should have set the value
    expect(mockClient.addSample).toHaveBeenCalledWith('test', array);
    
    // Should have updated the local value
    // @ts-ignore - accessing private property for testing
    expect(entry.lastValue).toBe(array);
    
    // Get the value
    // @ts-ignore - accessing private property for testing
    entry.lastValue = array;
    expect(entry.getDoubleArray([])).toBe(array);
    
    // Get with default value when no value is set
    // @ts-ignore - accessing private property for testing
    entry.lastValue = null;
    expect(entry.getDoubleArray([])).toEqual([]);
  });

  test('should get and set a string array value', () => {
    const array = ['one', 'two', 'three'];
    
    // Set a value
    entry.setStringArray(array);
    
    // Should have published the topic if it doesn't exist
    expect(mockTopic.exists).toHaveBeenCalled();
    expect(mockClient.publishTopic).toHaveBeenCalledWith('test', 'string[]');
    
    // Should have set the value
    expect(mockClient.addSample).toHaveBeenCalledWith('test', array);
    
    // Should have updated the local value
    // @ts-ignore - accessing private property for testing
    expect(entry.lastValue).toBe(array);
    
    // Get the value
    // @ts-ignore - accessing private property for testing
    entry.lastValue = array;
    expect(entry.getStringArray([])).toBe(array);
    
    // Get with default value when no value is set
    // @ts-ignore - accessing private property for testing
    entry.lastValue = null;
    expect(entry.getStringArray([])).toEqual([]);
  });
});
