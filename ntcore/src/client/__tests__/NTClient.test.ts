import { NTClient } from '../NTClient';
import { NTInstance } from '../../instance/NTInstance';
import { NTEntryFlags, NTValueType } from '../../types/NTTypes';
import { Socket } from 'net';
import { EventEmitter } from 'events';
import { sleep } from '../../__tests__/helpers/TestUtils';

// Mock the Socket class
jest.mock('net', () => {
  return {
    Socket: jest.fn().mockImplementation(() => {
      const socket = new EventEmitter();
      // Add properties that exist on Socket
      (socket as any).connect = jest.fn().mockImplementation((port: number, host: string, callback?: () => void) => {
        if (callback) {
          callback();
        }
        socket.emit('connect');
        return socket;
      });
      (socket as any).write = jest.fn();
      (socket as any).end = jest.fn().mockImplementation(() => {
        socket.emit('close', false);
        return socket;
      });
      (socket as any).destroy = jest.fn();
      return socket;
    })
  };
});

describe('NTClient', () => {
  let instance: NTInstance;
  let client: NTClient;
  let mockSocket: any;

  beforeEach(() => {
    jest.clearAllMocks();
    instance = new NTInstance();
    client = new NTClient(instance, { host: 'localhost', port: 1735 });
    mockSocket = (Socket as unknown as jest.Mock).mock.results[0].value;
  });

  describe('constructor', () => {
    test('initializes with default options', () => {
      const defaultClient = new NTClient(instance, { host: 'localhost', port: 1735 });
      expect(defaultClient).toBeDefined();
    });

    test('initializes with custom options', () => {
      const customClient = new NTClient(instance, {
        host: '192.168.1.1',
        port: 5810,
        reconnectInterval: 2000,
        maxReconnectAttempts: 5
      });
      expect(customClient).toBeDefined();
    });
  });

  describe('connect', () => {
    test('connects to the server', async () => {
      const connectPromise = client.connect();
      await connectPromise;
      expect(mockSocket.connect).toHaveBeenCalledWith(
        1735,
        'localhost',
        expect.any(Function)
      );
    });

    test('emits connect event', async () => {
      const connectHandler = jest.fn();
      client.on('connect', connectHandler);
      await client.connect();
      expect(connectHandler).toHaveBeenCalled();
    });

    test('sends client hello message', async () => {
      await client.connect();
      expect(mockSocket.write).toHaveBeenCalled();
    });

    test('rejects if connection fails', async () => {
      mockSocket.connect.mockImplementationOnce((port: number, host: string, callback?: () => void) => {
        mockSocket.emit('error', new Error('Connection failed'));
        return mockSocket;
      });

      await expect(client.connect()).rejects.toThrow('Connection failed');
    });

    test('rejects if already connected', async () => {
      await client.connect();
      await expect(client.connect()).rejects.toThrow('Already connected');
    });
  });

  describe('disconnect', () => {
    test('disconnects from the server', async () => {
      await client.connect();
      client.disconnect();
      expect(mockSocket.end).toHaveBeenCalled();
    });

    test('emits disconnect event', async () => {
      const disconnectHandler = jest.fn();
      client.on('disconnect', disconnectHandler);
      await client.connect();
      client.disconnect();
      expect(disconnectHandler).toHaveBeenCalled();
    });

    test('does nothing if not connected', () => {
      client.disconnect();
      expect(mockSocket.end).not.toHaveBeenCalled();
    });
  });

  describe('reconnect', () => {
    test('reconnects after disconnect', async () => {
      await client.connect();
      mockSocket.emit('close', false);
      await sleep(10); // Wait for reconnect
      expect(mockSocket.connect).toHaveBeenCalledTimes(2);
    });

    test('stops reconnecting after max attempts', async () => {
      const customClient = new NTClient(instance, {
        host: 'localhost',
        port: 1735,
        reconnectInterval: 10,
        maxReconnectAttempts: 2
      });

      await customClient.connect();
      const customMockSocket = (Socket as unknown as jest.Mock).mock.results[1].value;

      // First disconnect
      customMockSocket.emit('close', false);
      await sleep(20); // Wait for reconnect

      // Second disconnect
      customMockSocket.emit('close', false);
      await sleep(20); // Wait for reconnect

      // Third disconnect (should not reconnect)
      customMockSocket.emit('close', false);
      await sleep(20); // Wait for reconnect

      expect(customMockSocket.connect).toHaveBeenCalledTimes(3); // Initial + 2 reconnects
    });
  });

  describe('sendValueUpdate', () => {
    test('sends value update when connected', async () => {
      await client.connect();
      client.sendValueUpdate('test', true, NTValueType.Boolean);
      expect(mockSocket.write).toHaveBeenCalledTimes(2); // Hello + update
    });

    test('does nothing when not connected', () => {
      client.sendValueUpdate('test', true, NTValueType.Boolean);
      expect(mockSocket.write).not.toHaveBeenCalled();
    });
  });

  describe('data handling', () => {
    test('processes received data', async () => {
      await client.connect();

      // Simulate receiving data
      const data = Buffer.from([0x00, 0x00, 0x00]); // KeepAlive message
      mockSocket.emit('data', data);

      // No easy way to test internal processing, but at least ensure it doesn't throw
      expect(() => mockSocket.emit('data', data)).not.toThrow();
    });
  });

  describe('error handling', () => {
    test('emits error event', async () => {
      const errorHandler = jest.fn();
      client.on('error', errorHandler);

      await client.connect();
      const error = new Error('Test error');
      mockSocket.emit('error', error);

      expect(errorHandler).toHaveBeenCalledWith(error);
    });
  });
});
