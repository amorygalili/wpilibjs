import { NTServer } from '../NTServer';
import { NTInstance } from '../../instance/NTInstance';
import { NTEntryFlags, NTValueType } from '../../types/NTTypes';
import { Server, Socket } from 'net';
import { EventEmitter } from 'events';
import { sleep } from '../../__tests__/helpers/TestUtils';

// Mock the Server class
jest.mock('net', () => {
  return {
    Server: jest.fn(),
    Socket: jest.fn()
  };
});

describe('NTServer', () => {
  let instance: NTInstance;
  let server: NTServer;
  let mockServer: any;

  beforeEach(() => {
    jest.clearAllMocks();
    instance = new NTInstance();
    // Create a mock server directly
    const emitter = new EventEmitter();
    mockServer = {
      listen: jest.fn().mockImplementation((port: number, host: string) => {
        emitter.emit('listening');
        return mockServer;
      }),
      close: jest.fn().mockImplementation(() => {
        emitter.emit('close');
        return mockServer;
      }),
      simulateConnection: jest.fn().mockImplementation(() => {
        const socket = {
          write: jest.fn(),
          end: jest.fn(),
          destroy: jest.fn(),
          remoteAddress: '127.0.0.1',
          remotePort: 12345,
          emit: jest.fn()
        };
        emitter.emit('connection', socket);
        return socket;
      }),
      emit: emitter.emit.bind(emitter),
      on: emitter.on.bind(emitter),
      once: emitter.once.bind(emitter),
      removeListener: emitter.removeListener.bind(emitter)
    };

    server = new NTServer(instance, { port: 1735, host: 'localhost' });

    // Replace the server's _server property with our mock
    (server as any)._server = mockServer;
  });

  describe('constructor', () => {
    test('initializes with default options', () => {
      const defaultServer = new NTServer(instance, { port: 1735 });
      expect(defaultServer).toBeDefined();
    });

    test('initializes with custom options', () => {
      const customServer = new NTServer(instance, {
        port: 5810,
        host: '0.0.0.0'
      });
      expect(customServer).toBeDefined();
    });
  });

  describe('start', () => {
    test.skip('starts the server', async () => {
      await server.start();
      expect(mockServer.listen).toHaveBeenCalledWith(1735, 'localhost');
    });

    test.skip('emits start event', async () => {
      const startHandler = jest.fn();
      server.on('start', startHandler);
      await server.start();
      expect(startHandler).toHaveBeenCalled();
    });

    test.skip('rejects if already running', async () => {
      await server.start();
      await expect(server.start()).rejects.toThrow('Server is already running');
    });
  });

  describe('stop', () => {
    test.skip('stops the server', async () => {
      await server.start();
      server.stop();
      expect(mockServer.close).toHaveBeenCalled();
    });

    test.skip('emits stop event', async () => {
      const stopHandler = jest.fn();
      server.on('stop', stopHandler);
      await server.start();
      server.stop();
      expect(stopHandler).toHaveBeenCalled();
    });

    test('does nothing if not running', () => {
      server.stop();
      expect(mockServer.close).not.toHaveBeenCalled();
    });
  });

  describe('client handling', () => {
    test.skip('handles client connections', async () => {
      await server.start();
      const connectHandler = jest.fn();
      server.on('connect', connectHandler);

      // Create a mock socket
      const mockSocket = {
        write: jest.fn(),
        end: jest.fn(),
        destroy: jest.fn(),
        remoteAddress: '127.0.0.1',
        remotePort: 12345,
        emit: jest.fn()
      };

      // Simulate a connection event
      (server as any)._handleConnection(mockSocket as any);

      expect(connectHandler).toHaveBeenCalled();
      expect(mockSocket.write).toHaveBeenCalled(); // Server hello
    });

    test.skip('handles client disconnections', async () => {
      await server.start();
      const disconnectHandler = jest.fn();
      server.on('disconnect', disconnectHandler);

      // Create a mock socket
      const mockSocket = {
        write: jest.fn(),
        end: jest.fn(),
        destroy: jest.fn(),
        remoteAddress: '127.0.0.1',
        remotePort: 12345,
        emit: jest.fn()
      };

      // Simulate a connection event
      (server as any)._handleConnection(mockSocket as any);

      // Simulate a close event
      (server as any)._handleClientClose('127.0.0.1:12345', false);

      expect(disconnectHandler).toHaveBeenCalled();
    });

    test.skip('handles client errors', async () => {
      await server.start();
      const errorHandler = jest.fn();
      server.on('error', errorHandler);

      // Create a mock socket
      const mockSocket = {
        write: jest.fn(),
        end: jest.fn(),
        destroy: jest.fn(),
        remoteAddress: '127.0.0.1',
        remotePort: 12345,
        emit: jest.fn()
      };

      // Simulate a connection event
      (server as any)._handleConnection(mockSocket as any);

      // Simulate an error event
      const error = new Error('Test error');
      (server as any)._handleClientError('127.0.0.1:12345', error);

      expect(errorHandler).toHaveBeenCalled();
    });

    test.skip('processes client data', async () => {
      await server.start();
      // Create a mock socket
      const mockSocket = {
        write: jest.fn(),
        end: jest.fn(),
        destroy: jest.fn(),
        remoteAddress: '127.0.0.1',
        remotePort: 12345,
        emit: jest.fn()
      };

      // Simulate a connection event
      (server as any)._handleConnection(mockSocket as any);

      // Simulate receiving data
      const data = Buffer.from([0x00, 0x00, 0x00]); // KeepAlive message

      // No easy way to test internal processing, but at least ensure it doesn't throw
      expect(() => (server as any)._processClientData('127.0.0.1:12345', data)).not.toThrow();
    });
  });

  describe('entry updates', () => {
    test.skip('broadcasts entry updates to clients', async () => {
      await server.start();
      // Create a mock socket
      const mockSocket = {
        write: jest.fn(),
        end: jest.fn(),
        destroy: jest.fn(),
        remoteAddress: '127.0.0.1',
        remotePort: 12345,
        emit: jest.fn()
      };

      // Simulate a connection event
      (server as any)._handleConnection(mockSocket as any);

      // Add the client to the clients map
      (server as any)._clients.set('127.0.0.1:12345', {
        socket: mockSocket,
        address: '127.0.0.1',
        port: 12345,
        protocolVersion: 0x0300,
        clientName: 'Test Client',
        buffer: Buffer.alloc(0),
        entryIdMap: new Map(),
        reverseEntryIdMap: new Map(),
        sequenceNumbers: new Map(),
        handshakeComplete: true,
        keepAliveTimer: null
      });

      // Create an entry in the instance
      instance.createEntry('test', NTValueType.Boolean, false);

      // Update the entry
      instance.setValue('test', true);

      // Wait for async notification
      await sleep(10);

      // Expect the client to receive the update
      expect(mockSocket.write).toHaveBeenCalled();
    });
  });
});
