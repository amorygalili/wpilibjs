import { NTValueType, NTEntryFlags } from '../../types/NTTypes';
import { NTInstance } from '../../instance/NTInstance';
import { Topic } from '../Topic';
import { sleep } from '../../__tests__/helpers/TestUtils';

describe('Topic', () => {
  let instance: NTInstance;

  beforeEach(() => {
    instance = new NTInstance();
  });

  test('constructor creates entry if it does not exist', () => {
    const topic = new Topic<boolean>(instance, 'test', false);
    expect(instance.getEntry('test')).toBeDefined();
    expect(instance.getValue('test')).toBe(false);
  });

  test('constructor uses existing entry if it exists', () => {
    instance.createEntry('test', NTValueType.Boolean, true);
    const topic = new Topic<boolean>(instance, 'test', false);
    expect(instance.getValue('test')).toBe(true);
  });

  test('value getter returns current value', () => {
    instance.createEntry('test', NTValueType.Boolean, true);
    const topic = new Topic<boolean>(instance, 'test', false);
    expect(topic.value).toBe(true);
  });

  test('value getter returns default value if entry does not exist', () => {
    const topic = new Topic<boolean>(instance, 'test', false);
    instance.deleteEntry('test');
    expect(topic.value).toBe(false);
  });

  test('value setter updates value', () => {
    const topic = new Topic<boolean>(instance, 'test', false);
    topic.value = true;
    expect(instance.getValue('test')).toBe(true);
  });

  test('setValue updates value', () => {
    const topic = new Topic<boolean>(instance, 'test', false);
    topic.setValue(true);
    expect(instance.getValue('test')).toBe(true);
  });

  test('persistent getter returns whether topic is persistent', () => {
    const topic = new Topic<boolean>(instance, 'test', false);
    expect(topic.persistent).toBe(false);
    instance.setFlags('test', NTEntryFlags.Persistent);
    expect(topic.persistent).toBe(true);
  });

  test('persistent setter updates persistence', () => {
    const topic = new Topic<boolean>(instance, 'test', false);
    topic.persistent = true;
    expect(instance.getFlags('test')).toBe(NTEntryFlags.Persistent);
    topic.persistent = false;
    expect(instance.getFlags('test')).toBe(NTEntryFlags.None);
  });

  test('setPersistent updates persistence', () => {
    const topic = new Topic<boolean>(instance, 'test', false);
    topic.setPersistent(true);
    expect(instance.getFlags('test')).toBe(NTEntryFlags.Persistent);
    topic.setPersistent(false);
    expect(instance.getFlags('test')).toBe(NTEntryFlags.None);
  });

  test('emits valueChanged event when value changes', async () => {
    const topic = new Topic<boolean>(instance, 'test', false);
    const listener = jest.fn();
    topic.on('valueChanged', listener);
    instance.setValue('test', true);
    await sleep(10);
    expect(listener).toHaveBeenCalledWith(true);
  });

  test('emits flagsChanged event when flags change', async () => {
    const topic = new Topic<boolean>(instance, 'test', false);
    const listener = jest.fn();
    topic.on('flagsChanged', listener);
    instance.setFlags('test', NTEntryFlags.Persistent);
    await sleep(10);
    expect(listener).toHaveBeenCalledWith(NTEntryFlags.Persistent);
  });

  test('emits deleted event when entry is deleted', async () => {
    const topic = new Topic<boolean>(instance, 'test', false);
    const listener = jest.fn();
    topic.on('deleted', listener);
    instance.deleteEntry('test');
    await sleep(10);
    expect(listener).toHaveBeenCalled();
  });

  test('dispose removes listener', () => {
    const topic = new Topic<boolean>(instance, 'test', false);
    const listener = jest.fn();
    topic.on('valueChanged', listener);
    topic.dispose();
    instance.setValue('test', true);
    expect(listener).not.toHaveBeenCalled();
  });
});
