import { Topic } from '../Topic';
import { NetworkTableInstance } from '../NetworkTableInstance';
import { NT4_Client } from '../NT4_Node';

// Mock NetworkTableInstance and NT4_Client
jest.mock('../NetworkTableInstance');
jest.mock('../NT4_Node');

describe('Topic', () => {
  let instance: NetworkTableInstance;
  let topic: Topic;
  let mockClient: jest.Mocked<NT4_Client>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a mock instance
    instance = new NetworkTableInstance() as jest.Mocked<NetworkTableInstance>;
    
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
    
    // Create a topic
    topic = new Topic(instance, 'test');
  });

  test('should create a Topic with the correct name', () => {
    expect(topic.getName()).toBe('test');
  });

  test('should return the instance', () => {
    expect(topic.getInstance()).toBe(instance);
  });

  test('should get and set properties', () => {
    // Set a property
    topic.setProperty('persistent', true);
    
    // Should have updated the local property
    expect(topic.getProperty('persistent')).toBe(true);
    
    // Should have tried to publish the topic with the updated properties
    expect(mockClient.publishTopic).toHaveBeenCalledWith(
      'test',
      '',
      { persistent: true }
    );
  });

  test('should get and set all properties', () => {
    // Set properties
    const props = { persistent: true, retained: false };
    topic.setProperties(props);
    
    // Should have updated the local properties
    expect(topic.getProperties()).toEqual(props);
    
    // Should have tried to publish the topic with the updated properties
    expect(mockClient.publishTopic).toHaveBeenCalledWith(
      'test',
      '',
      props
    );
  });

  test('should publish a topic', () => {
    // Publish the topic
    topic.publish('boolean', { persistent: true });
    
    // Should have updated the local properties
    expect(topic.getType()).toBe('boolean');
    expect(topic.getProperties()).toEqual({ persistent: true });
    expect(topic.exists()).toBe(true);
    
    // Should have published the topic
    expect(mockClient.publishTopic).toHaveBeenCalledWith(
      'test',
      'boolean',
      { persistent: true }
    );
  });

  test('should unpublish a topic', () => {
    // First publish the topic
    topic.publish('boolean');
    
    // Then unpublish it
    topic.unpublish();
    
    // Should have unpublished the topic
    expect(mockClient.unpublishTopic).toHaveBeenCalledWith('test');
    expect(topic.exists()).toBe(false);
  });

  test('should subscribe to a topic', () => {
    // Setup mock
    mockClient.subscribe.mockReturnValue(123);
    
    // Subscribe to the topic
    const subuid = topic.subscribe(0.2, true);
    
    // Should have subscribed to the topic
    expect(mockClient.subscribe).toHaveBeenCalledWith(
      ['test'],
      false,
      true,
      0.2
    );
    expect(subuid).toBe(123);
  });

  test('should unsubscribe from a topic', () => {
    // Unsubscribe from the topic
    topic.unsubscribe(123);
    
    // Should have unsubscribed from the topic
    expect(mockClient.unsubscribe).toHaveBeenCalledWith(123);
  });
});
