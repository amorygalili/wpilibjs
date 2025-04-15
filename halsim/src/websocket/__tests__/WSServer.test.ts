import { WSServer } from '../WSServer';
import { HALSimulator } from '../../HALSimulator';
import * as WebSocket from 'ws';

// Mock WebSocket
jest.mock('ws', () => {
  const mockOn = jest.fn();
  const mockClose = jest.fn();
  const mockSend = jest.fn();
  
  class MockWebSocket {
    static OPEN = 1;
    
    readyState = MockWebSocket.OPEN;
    on = mockOn;
    close = mockClose;
    send = mockSend;
  }
  
  class MockServer {
    on = mockOn;
    close = mockClose;
    
    constructor() {
      // Return the instance for testing
      return this;
    }
  }
  
  return {
    WebSocket: MockWebSocket,
    Server: MockServer,
    __mockOn: mockOn,
    __mockClose: mockClose,
    __mockSend: mockSend,
    __resetMocks: () => {
      mockOn.mockReset();
      mockClose.mockReset();
      mockSend.mockReset();
    }
  };
});

// Get the mocked functions
const mockWs = WebSocket as any;

describe('WSServer', () => {
  let hal: HALSimulator;
  let server: WSServer;
  
  beforeEach(() => {
    // Reset mocks
    mockWs.__resetMocks();
    
    // Create a new HAL simulator
    hal = new HALSimulator();
    
    // Create a new WebSocket server
    server = new WSServer(hal, {
      port: 3300,
      host: 'localhost',
      path: '/wpilibws'
    });
  });
  
  test('should create a WebSocket server with the correct options', () => {
    server.start();
    
    // Check that the WebSocket server was created with the correct options
    expect(mockWs.Server).toHaveBeenCalledWith({
      port: 3300,
      host: 'localhost',
      path: '/wpilibws'
    });
  });
  
  test('should set up event handlers when started', () => {
    server.start();
    
    // Check that event handlers were set up
    expect(mockWs.__mockOn).toHaveBeenCalledWith('connection', expect.any(Function));
    expect(mockWs.__mockOn).toHaveBeenCalledWith('error', expect.any(Function));
  });
  
  test('should close the server when stopped', () => {
    server.start();
    server.stop();
    
    // Check that the server was closed
    expect(mockWs.__mockClose).toHaveBeenCalled();
  });
  
  test('should not throw when stopping a server that was not started', () => {
    expect(() => server.stop()).not.toThrow();
  });
  
  test('should not create a new server if one already exists', () => {
    server.start();
    mockWs.Server.mockClear();
    
    server.start();
    
    // Check that a new server was not created
    expect(mockWs.Server).not.toHaveBeenCalled();
  });
  
  // Test connection handling
  test('should handle client connections', () => {
    server.start();
    
    // Get the connection handler
    const connectionHandler = mockWs.__mockOn.mock.calls.find(
      call => call[0] === 'connection'
    )[1];
    
    // Create a mock client
    const mockClient = new mockWs.WebSocket();
    
    // Call the connection handler
    connectionHandler(mockClient);
    
    // Check that event handlers were set up on the client
    expect(mockClient.on).toHaveBeenCalledWith('message', expect.any(Function));
    expect(mockClient.on).toHaveBeenCalledWith('close', expect.any(Function));
    expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function));
  });
  
  // Test message handling (simplified)
  test('should handle DIO messages', () => {
    server.start();
    
    // Create a digital input
    const channel = 5;
    const dio = hal.createDigitalInput(channel);
    
    // Get the connection handler
    const connectionHandler = mockWs.__mockOn.mock.calls.find(
      call => call[0] === 'connection'
    )[1];
    
    // Create a mock client
    const mockClient = new mockWs.WebSocket();
    
    // Call the connection handler
    connectionHandler(mockClient);
    
    // Get the message handler
    const messageHandler = mockClient.on.mock.calls.find(
      call => call[0] === 'message'
    )[1];
    
    // Create a DIO message
    const message = {
      type: 'DIO',
      device: channel.toString(),
      data: {
        '>value': false
      }
    };
    
    // Call the message handler
    messageHandler(Buffer.from(JSON.stringify(message)));
    
    // Check that the DIO value was updated
    expect(dio.getValue()).toBe(false);
  });
});
