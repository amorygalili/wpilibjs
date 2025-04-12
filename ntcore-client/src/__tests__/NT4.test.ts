import { NT4_Client, NT4_Topic } from '../NT4';

// We'll skip complex client tests for now and focus on the NT4_Topic class
describe('NT4_Client', () => {
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
});

describe('NT4_Topic', () => {
  test('should create a topic instance', () => {
    const topic = new NT4_Topic();
    expect(topic).toBeInstanceOf(NT4_Topic);
    expect(topic.uid).toBe(-1);
    expect(topic.name).toBe('');
    expect(topic.type).toBe('');
    expect(topic.properties).toEqual({});
  });

  test('should convert to publish object', () => {
    const topic = new NT4_Topic();
    topic.uid = 123;
    topic.name = 'test/topic';
    topic.type = 'double';
    topic.properties = { persistent: true };

    const publishObj = topic.toPublishObj();

    expect(publishObj).toEqual({
      name: 'test/topic',
      type: 'double',
      pubuid: 123,
      properties: { persistent: true }
    });
  });

  test('should convert to unpublish object', () => {
    const topic = new NT4_Topic();
    topic.uid = 123;

    const unpublishObj = topic.toUnpublishObj();

    expect(unpublishObj).toEqual({
      pubuid: 123
    });
  });

  test('should get type index', () => {
    const topic = new NT4_Topic();

    topic.type = 'boolean';
    expect(topic.getTypeIdx()).toBe(0);

    topic.type = 'double';
    expect(topic.getTypeIdx()).toBe(1);

    topic.type = 'string';
    expect(topic.getTypeIdx()).toBe(4);

    topic.type = 'boolean[]';
    expect(topic.getTypeIdx()).toBe(16);

    topic.type = 'unknown';
    expect(topic.getTypeIdx()).toBe(5); // Default to binary
  });
});
