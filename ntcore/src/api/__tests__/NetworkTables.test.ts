import { NetworkTables, ConnectionMode } from '../NetworkTables';
import { Topic } from '../Topic';
import { NTValueType } from '../../types/NTTypes';
import { NTInstance } from '../../instance/NTInstance';
import { sleep } from '../../__tests__/helpers/TestUtils';

// Mock the NTClient and NTServer classes
jest.mock('../../client/NTClient', () => {
  return {
    NTClient: jest.fn().mockImplementation(() => {
      return {
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn()
      };
    })
  };
});

jest.mock('../../server/NTServer', () => {
  return {
    NTServer: jest.fn().mockImplementation(() => {
      return {
        start: jest.fn().mockResolvedValue(undefined),
        stop: jest.fn()
      };
    })
  };
});

describe('NetworkTables', () => {
  let nt: NetworkTables;

  beforeEach(() => {
    nt = new NetworkTables();
  });

  afterEach(() => {
    nt.dispose();
  });

  test('constructor initializes with disconnected mode', () => {
    expect(nt.mode).toBe(ConnectionMode.Disconnected);
    expect(nt.connected).toBe(false);
  });

  test('connectAsClient connects as client', async () => {
    await nt.connectAsClient();
    expect(nt.mode).toBe(ConnectionMode.Client);
    expect(nt.connected).toBe(true);
  });

  test('startServer starts server', async () => {
    await nt.startServer();
    expect(nt.mode).toBe(ConnectionMode.Server);
    expect(nt.connected).toBe(true);
  });

  test('disconnect disconnects', async () => {
    await nt.connectAsClient();
    await nt.disconnect();
    expect(nt.mode).toBe(ConnectionMode.Disconnected);
    expect(nt.connected).toBe(false);
  });

  test('getTopic returns topic', () => {
    const topic = nt.getTopic<boolean>('test', false);
    expect(topic).toBeInstanceOf(Topic);
    expect(topic.name).toBe('test');
    expect(topic.value).toBe(false);
  });

  test('getTopic returns same topic for same name', () => {
    const topic1 = nt.getTopic<boolean>('test', false);
    const topic2 = nt.getTopic<boolean>('test', true);
    expect(topic1).toBe(topic2);
  });

  test('getBoolean returns boolean topic', () => {
    const topic = nt.getBoolean('test');
    expect(topic).toBeInstanceOf(Topic);
    expect(topic.name).toBe('test');
    expect(topic.value).toBe(false);
  });

  test('getNumber returns number topic', () => {
    const topic = nt.getNumber('test');
    expect(topic).toBeInstanceOf(Topic);
    expect(topic.name).toBe('test');
    expect(topic.value).toBe(0);
  });

  test('getString returns string topic', () => {
    const topic = nt.getString('test');
    expect(topic).toBeInstanceOf(Topic);
    expect(topic.name).toBe('test');
    expect(topic.value).toBe('');
  });

  test('getBooleanArray returns boolean array topic', () => {
    const topic = nt.getBooleanArray('test');
    expect(topic).toBeInstanceOf(Topic);
    expect(topic.name).toBe('test');
    expect(topic.value).toEqual([]);
  });

  test('getNumberArray returns number array topic', () => {
    const topic = nt.getNumberArray('test');
    expect(topic).toBeInstanceOf(Topic);
    expect(topic.name).toBe('test');
    expect(topic.value).toEqual([]);
  });

  test('getStringArray returns string array topic', () => {
    const topic = nt.getStringArray('test');
    expect(topic).toBeInstanceOf(Topic);
    expect(topic.name).toBe('test');
    expect(topic.value).toEqual([]);
  });

  test('getRaw returns raw topic', () => {
    const topic = nt.getRaw('test');
    expect(topic).toBeInstanceOf(Topic);
    expect(topic.name).toBe('test');
    expect(topic.value).toBeInstanceOf(Uint8Array);
    expect(topic.value.length).toBe(0);
  });

  test('dispose cleans up resources', async () => {
    const topic = nt.getBoolean('test');
    const listener = jest.fn();
    topic.on('valueChanged', listener);

    nt.dispose();

    // Topic should be disposed
    topic.value = true;
    await sleep(10);
    expect(listener).not.toHaveBeenCalled();

    // Should be disconnected
    expect(nt.mode).toBe(ConnectionMode.Disconnected);
    expect(nt.connected).toBe(false);
  });
});
