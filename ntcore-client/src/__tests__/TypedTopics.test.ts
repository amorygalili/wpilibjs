import { Topic } from '../Topic';
import { NetworkTableInstance } from '../NetworkTableInstance';
import { BooleanTopic } from '../topics/BooleanTopic';
import { DoubleTopic } from '../topics/DoubleTopic';
import { StringTopic } from '../topics/StringTopic';
import { BooleanEntry } from '../entries/BooleanEntry';
import { DoubleEntry } from '../entries/DoubleEntry';
import { StringEntry } from '../entries/StringEntry';

// Mock Topic and NetworkTableInstance
jest.mock('../Topic');
jest.mock('../NetworkTableInstance');

describe('Typed Topics and Entries', () => {
  let instance: NetworkTableInstance;
  let topic: Topic;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a mock instance
    instance = new NetworkTableInstance() as jest.Mocked<NetworkTableInstance>;
    
    // Create a mock topic
    topic = new Topic(instance, 'test') as jest.Mocked<Topic>;
    
    // Setup the topic
    (topic.exists as jest.Mock).mockReturnValue(true);
    (topic.getType as jest.Mock).mockReturnValue('boolean');
    (topic.getProperties as jest.Mock).mockReturnValue({ persistent: true });
    (topic.subscribe as jest.Mock).mockReturnValue(123);
  });

  describe('BooleanTopic', () => {
    test('should create a BooleanTopic from a Topic', () => {
      const booleanTopic = new BooleanTopic(topic);
      
      expect(booleanTopic.getName()).toBe('test');
      expect(booleanTopic.getType()).toBe('boolean');
      expect(booleanTopic.getProperties()).toEqual({ persistent: true });
      expect(booleanTopic.exists()).toBe(true);
    });

    test('should publish a boolean topic', () => {
      const booleanTopic = new BooleanTopic(topic);
      
      booleanTopic.publish({ persistent: true });
      
      expect(topic.publish).toHaveBeenCalledWith('boolean', { persistent: true });
    });

    test('should get a boolean entry', () => {
      const booleanTopic = new BooleanTopic(topic);
      
      const entry = booleanTopic.getEntry(true);
      
      expect(entry).toBeInstanceOf(BooleanEntry);
    });
  });

  describe('DoubleTopic', () => {
    test('should create a DoubleTopic from a Topic', () => {
      const doubleTopic = new DoubleTopic(topic);
      
      expect(doubleTopic.getName()).toBe('test');
      expect(doubleTopic.getType()).toBe('boolean'); // From the mock
      expect(doubleTopic.getProperties()).toEqual({ persistent: true });
      expect(doubleTopic.exists()).toBe(true);
    });

    test('should publish a double topic', () => {
      const doubleTopic = new DoubleTopic(topic);
      
      doubleTopic.publish({ persistent: true });
      
      expect(topic.publish).toHaveBeenCalledWith('double', { persistent: true });
    });

    test('should get a double entry', () => {
      const doubleTopic = new DoubleTopic(topic);
      
      const entry = doubleTopic.getEntry(123.456);
      
      expect(entry).toBeInstanceOf(DoubleEntry);
    });
  });

  describe('StringTopic', () => {
    test('should create a StringTopic from a Topic', () => {
      const stringTopic = new StringTopic(topic);
      
      expect(stringTopic.getName()).toBe('test');
      expect(stringTopic.getType()).toBe('boolean'); // From the mock
      expect(stringTopic.getProperties()).toEqual({ persistent: true });
      expect(stringTopic.exists()).toBe(true);
    });

    test('should publish a string topic', () => {
      const stringTopic = new StringTopic(topic);
      
      stringTopic.publish({ persistent: true });
      
      expect(topic.publish).toHaveBeenCalledWith('string', { persistent: true });
    });

    test('should get a string entry', () => {
      const stringTopic = new StringTopic(topic);
      
      const entry = stringTopic.getEntry('test-string');
      
      expect(entry).toBeInstanceOf(StringEntry);
    });
  });

  describe('BooleanEntry', () => {
    let booleanTopic: BooleanTopic;
    let entry: BooleanEntry;

    beforeEach(() => {
      booleanTopic = new BooleanTopic(topic);
      entry = new BooleanEntry(booleanTopic, true);
    });

    test('should create a BooleanEntry with the correct default value', () => {
      expect(entry.get()).toBe(true);
    });

    test('should get the topic', () => {
      expect(entry.getTopic()).toBe(booleanTopic);
    });

    test('should set a value', () => {
      entry.set(false);
      
      expect(topic.exists).toHaveBeenCalled();
      expect(topic.publish).toHaveBeenCalled();
      expect(instance.getClient).toHaveBeenCalled();
    });

    test('should set the default value', () => {
      entry.setDefault(false);
      
      // @ts-ignore - accessing private property for testing
      expect(entry.defaultValue).toBe(false);
    });

    test('should check if the entry exists', () => {
      expect(entry.exists()).toBe(true);
      expect(topic.exists).toHaveBeenCalled();
    });

    test('should unpublish the entry', () => {
      entry.unpublish();
      
      expect(topic.unpublish).toHaveBeenCalled();
    });

    test('should close the entry', () => {
      entry.close();
      
      expect(topic.unsubscribe).toHaveBeenCalledWith(123);
    });
  });

  describe('DoubleEntry', () => {
    let doubleTopic: DoubleTopic;
    let entry: DoubleEntry;

    beforeEach(() => {
      doubleTopic = new DoubleTopic(topic);
      entry = new DoubleEntry(doubleTopic, 123.456);
    });

    test('should create a DoubleEntry with the correct default value', () => {
      expect(entry.get()).toBe(123.456);
    });

    test('should get the topic', () => {
      expect(entry.getTopic()).toBe(doubleTopic);
    });

    test('should set a value', () => {
      entry.set(789.012);
      
      expect(topic.exists).toHaveBeenCalled();
      expect(topic.publish).toHaveBeenCalled();
      expect(instance.getClient).toHaveBeenCalled();
    });

    test('should set the default value', () => {
      entry.setDefault(789.012);
      
      // @ts-ignore - accessing private property for testing
      expect(entry.defaultValue).toBe(789.012);
    });

    test('should check if the entry exists', () => {
      expect(entry.exists()).toBe(true);
      expect(topic.exists).toHaveBeenCalled();
    });

    test('should unpublish the entry', () => {
      entry.unpublish();
      
      expect(topic.unpublish).toHaveBeenCalled();
    });

    test('should close the entry', () => {
      entry.close();
      
      expect(topic.unsubscribe).toHaveBeenCalledWith(123);
    });
  });

  describe('StringEntry', () => {
    let stringTopic: StringTopic;
    let entry: StringEntry;

    beforeEach(() => {
      stringTopic = new StringTopic(topic);
      entry = new StringEntry(stringTopic, 'test-string');
    });

    test('should create a StringEntry with the correct default value', () => {
      expect(entry.get()).toBe('test-string');
    });

    test('should get the topic', () => {
      expect(entry.getTopic()).toBe(stringTopic);
    });

    test('should set a value', () => {
      entry.set('new-string');
      
      expect(topic.exists).toHaveBeenCalled();
      expect(topic.publish).toHaveBeenCalled();
      expect(instance.getClient).toHaveBeenCalled();
    });

    test('should set the default value', () => {
      entry.setDefault('new-string');
      
      // @ts-ignore - accessing private property for testing
      expect(entry.defaultValue).toBe('new-string');
    });

    test('should check if the entry exists', () => {
      expect(entry.exists()).toBe(true);
      expect(topic.exists).toHaveBeenCalled();
    });

    test('should unpublish the entry', () => {
      entry.unpublish();
      
      expect(topic.unpublish).toHaveBeenCalled();
    });

    test('should close the entry', () => {
      entry.close();
      
      expect(topic.unsubscribe).toHaveBeenCalledWith(123);
    });
  });
});
