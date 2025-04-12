import { NetworkTableInstance } from '../NetworkTableInstance';
import { NetworkTable } from '../NetworkTable';
import { Topic } from '../Topic';
import { BooleanTopic } from '../topics/BooleanTopic';
import { DoubleTopic } from '../topics/DoubleTopic';
import { StringTopic } from '../topics/StringTopic';
import { NT4_Client } from '../NT4_Node';

// Mock NT4_Client
jest.mock('../NT4_Node');
jest.mock('../NetworkTable');
jest.mock('../Topic');

describe('NetworkTableInstance', () => {
  let instance: NetworkTableInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset the default instance
    // @ts-ignore - accessing private static property for testing
    NetworkTableInstance.defaultInstance = null;
    
    // Create a new instance
    instance = NetworkTableInstance.create();
  });

  test('should create a new instance', () => {
    expect(instance).toBeInstanceOf(NetworkTableInstance);
  });

  test('should get the default instance', () => {
    const defaultInstance = NetworkTableInstance.getDefault();
    expect(defaultInstance).toBeInstanceOf(NetworkTableInstance);
    
    // Getting it again should return the same instance
    const defaultInstance2 = NetworkTableInstance.getDefault();
    expect(defaultInstance2).toBe(defaultInstance);
  });

  test('should start a client', () => {
    // @ts-ignore - accessing private property for testing
    const mockClient = instance.client as jest.Mocked<NT4_Client>;
    
    instance.startClient4('test-client', 'localhost', 5810);
    
    // Should create a new client with the correct parameters
    expect(NT4_Client).toHaveBeenCalledWith(
      'localhost:5810',
      'test-client',
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function)
    );
    
    // Should connect the client
    expect(mockClient.connect).toHaveBeenCalled();
  });

  test('should stop the client', () => {
    // @ts-ignore - accessing private property for testing
    const mockClient = instance.client as jest.Mocked<NT4_Client>;
    
    instance.stopClient();
    
    expect(mockClient.disconnect).toHaveBeenCalled();
    // @ts-ignore - accessing private property for testing
    expect(instance.connected).toBe(false);
  });

  test('should get a table', () => {
    const table = instance.getTable('test');
    
    expect(NetworkTable).toHaveBeenCalledWith(instance, 'test');
    expect(table).toBeInstanceOf(NetworkTable);
  });

  test('should get a topic', () => {
    const topic = instance.getTopic('test');
    
    expect(Topic).toHaveBeenCalledWith(instance, 'test');
    expect(topic).toBeInstanceOf(Topic);
  });

  test('should get a boolean topic', () => {
    // Setup mock
    const mockTopic = new Topic(instance, 'test');
    (Topic as jest.Mock).mockReturnValue(mockTopic);
    
    const topic = instance.getBooleanTopic('test');
    
    expect(Topic).toHaveBeenCalledWith(instance, 'test');
    expect(topic).toBeInstanceOf(BooleanTopic);
  });

  test('should get a double topic', () => {
    // Setup mock
    const mockTopic = new Topic(instance, 'test');
    (Topic as jest.Mock).mockReturnValue(mockTopic);
    
    const topic = instance.getDoubleTopic('test');
    
    expect(Topic).toHaveBeenCalledWith(instance, 'test');
    expect(topic).toBeInstanceOf(DoubleTopic);
  });

  test('should get a string topic', () => {
    // Setup mock
    const mockTopic = new Topic(instance, 'test');
    (Topic as jest.Mock).mockReturnValue(mockTopic);
    
    const topic = instance.getStringTopic('test');
    
    expect(Topic).toHaveBeenCalledWith(instance, 'test');
    expect(topic).toBeInstanceOf(StringTopic);
  });

  test('should get the network mode', () => {
    // @ts-ignore - accessing private property for testing
    instance.connected = false;
    expect(instance.getNetworkMode()).toBe(NetworkTableInstance.NetworkMode.kNetModeNone);
    
    // @ts-ignore - accessing private property for testing
    instance.connected = true;
    expect(instance.getNetworkMode()).toBe(NetworkTableInstance.NetworkMode.kNetModeClient4);
  });

  test('should get the server time', () => {
    // @ts-ignore - accessing private property for testing
    const mockClient = instance.client as jest.Mocked<NT4_Client>;
    mockClient.getServerTime_us.mockReturnValue(12345);
    
    expect(instance.getServerTime()).toBe(12345);
    expect(mockClient.getServerTime_us).toHaveBeenCalled();
  });

  test('should get the network latency', () => {
    // @ts-ignore - accessing private property for testing
    const mockClient = instance.client as jest.Mocked<NT4_Client>;
    mockClient.getNetworkLatency_us.mockReturnValue(67890);
    
    expect(instance.getNetworkLatency()).toBe(67890);
    expect(mockClient.getNetworkLatency_us).toHaveBeenCalled();
  });
});
