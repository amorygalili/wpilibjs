import { NT4_Client, NT4_Topic } from '../NT4_Node';

// We'll skip complex client tests for now and focus on the NT4_Topic class
describe('NT4_Node_Client', () => {
  let client: NT4_Client;

  afterEach(() => {
    // Make sure to clean up the client to avoid open handles
    if (client) {
      client.disconnect();
    }
  });

  test('should create a client instance', () => {
    // Create a simple client with mock functions
    client = new NT4_Client(
      'localhost',
      'test-client',
      jest.fn(),
      jest.fn(),
      jest.fn(),
      jest.fn(),
      jest.fn()
    );

    expect(client).toBeInstanceOf(NT4_Client);
  });

  test('NT4_Topic should have correct properties', () => {
    const topic = new NT4_Topic();
    topic.name = 'test-topic';
    topic.type = 'double';
    topic.properties = { persistent: true };
    topic.uid = 123;

    expect(topic.name).toBe('test-topic');
    expect(topic.type).toBe('double');
    expect(topic.properties).toEqual({ persistent: true });
    expect(topic.uid).toBe(123);
    expect(topic.getTypeIdx()).toBe(1); // double type index
  });

  test('NT4_Topic should convert to publish object', () => {
    const topic = new NT4_Topic();
    topic.name = 'test-topic';
    topic.type = 'double';
    topic.properties = { persistent: true };
    topic.uid = 123;

    const publishObj = topic.toPublishObj();
    expect(publishObj).toEqual({
      name: 'test-topic',
      type: 'double',
      pubuid: 123,
      properties: { persistent: true }
    });
  });

  test('NT4_Topic should convert to unpublish object', () => {
    const topic = new NT4_Topic();
    topic.uid = 123;

    const unpublishObj = topic.toUnpublishObj();
    expect(unpublishObj).toEqual({
      pubuid: 123
    });
  });

  test('NT4_Topic should handle unknown type', () => {
    const topic = new NT4_Topic();
    topic.type = 'unknown-type';
    
    expect(topic.getTypeIdx()).toBe(5); // Default to binary
  });
});
