import { Logger, LogHandler, addLogHandler, removeLogHandler, setGlobalLevel, getGlobalLevel, getLogger } from '../Logger';
import { LogLevel } from '../LogLevel';

describe('Logger', () => {
  // Create a mock LogHandler
  class MockLogHandler implements LogHandler {
    public logs: { level: LogLevel; name: string; message: string; timestamp: number }[] = [];
    
    handleLog(level: LogLevel, name: string, message: string, timestamp: number): void {
      this.logs.push({ level, name, message, timestamp });
    }
    
    clear(): void {
      this.logs = [];
    }
  }
  
  let mockHandler: MockLogHandler;
  
  beforeEach(() => {
    // Reset the global log level
    setGlobalLevel(LogLevel.Info);
    
    // Create a new mock handler
    mockHandler = new MockLogHandler();
    
    // Add the mock handler
    addLogHandler(mockHandler);
  });
  
  afterEach(() => {
    // Remove the mock handler
    removeLogHandler(mockHandler);
  });
  
  test('getLogger returns a Logger', () => {
    const logger = getLogger('test');
    expect(logger).toBeInstanceOf(Logger);
  });
  
  test('setGlobalLevel and getGlobalLevel', () => {
    // Default level should be Info
    expect(getGlobalLevel()).toBe(LogLevel.Info);
    
    // Set the global level to Debug
    setGlobalLevel(LogLevel.Debug);
    expect(getGlobalLevel()).toBe(LogLevel.Debug);
    
    // Set the global level to Error
    setGlobalLevel(LogLevel.Error);
    expect(getGlobalLevel()).toBe(LogLevel.Error);
  });
  
  test('addLogHandler and removeLogHandler', () => {
    // Create a new mock handler
    const handler = new MockLogHandler();
    
    // Add the handler
    addLogHandler(handler);
    
    // Log a message
    const logger = getLogger('test');
    logger.info('test message');
    
    // Handler should have received the message
    expect(handler.logs.length).toBe(1);
    expect(handler.logs[0].message).toBe('test message');
    
    // Remove the handler
    removeLogHandler(handler);
    
    // Clear the logs
    handler.clear();
    
    // Log another message
    logger.info('another message');
    
    // Handler should not have received the message
    expect(handler.logs.length).toBe(0);
  });
  
  test('Logger.setLevel and Logger.getLevel', () => {
    const logger = getLogger('test');
    
    // Default level should be the global level
    expect(logger.getLevel()).toBe(LogLevel.Info);
    
    // Set the logger level to Debug
    logger.setLevel(LogLevel.Debug);
    expect(logger.getLevel()).toBe(LogLevel.Debug);
    
    // Set the logger level to Error
    logger.setLevel(LogLevel.Error);
    expect(logger.getLevel()).toBe(LogLevel.Error);
  });
  
  test('Logger.isEnabledFor', () => {
    const logger = getLogger('test');
    
    // Set the logger level to Info
    logger.setLevel(LogLevel.Info);
    
    // Info and above should be enabled
    expect(logger.isEnabledFor(LogLevel.Info)).toBe(true);
    expect(logger.isEnabledFor(LogLevel.Warning)).toBe(true);
    expect(logger.isEnabledFor(LogLevel.Error)).toBe(true);
    expect(logger.isEnabledFor(LogLevel.Critical)).toBe(true);
    
    // Debug and Trace should be disabled
    expect(logger.isEnabledFor(LogLevel.Debug)).toBe(false);
    expect(logger.isEnabledFor(LogLevel.Trace)).toBe(false);
  });
  
  test('Logger.log', () => {
    const logger = getLogger('test');
    
    // Log a message
    logger.log(LogLevel.Info, 'test message');
    
    // Handler should have received the message
    expect(mockHandler.logs.length).toBe(1);
    expect(mockHandler.logs[0].level).toBe(LogLevel.Info);
    expect(mockHandler.logs[0].name).toBe('test');
    expect(mockHandler.logs[0].message).toBe('test message');
    expect(typeof mockHandler.logs[0].timestamp).toBe('number');
  });
  
  test('Logger convenience methods', () => {
    const logger = getLogger('test');
    
    // Set the logger level to Trace
    logger.setLevel(LogLevel.Trace);
    
    // Clear the logs
    mockHandler.clear();
    
    // Log messages at different levels
    logger.critical('critical message');
    logger.error('error message');
    logger.warning('warning message');
    logger.info('info message');
    logger.debug('debug message');
    logger.trace('trace message');
    
    // Handler should have received all messages
    expect(mockHandler.logs.length).toBe(6);
    expect(mockHandler.logs[0].level).toBe(LogLevel.Critical);
    expect(mockHandler.logs[0].message).toBe('critical message');
    expect(mockHandler.logs[1].level).toBe(LogLevel.Error);
    expect(mockHandler.logs[1].message).toBe('error message');
    expect(mockHandler.logs[2].level).toBe(LogLevel.Warning);
    expect(mockHandler.logs[2].message).toBe('warning message');
    expect(mockHandler.logs[3].level).toBe(LogLevel.Info);
    expect(mockHandler.logs[3].message).toBe('info message');
    expect(mockHandler.logs[4].level).toBe(LogLevel.Debug);
    expect(mockHandler.logs[4].message).toBe('debug message');
    expect(mockHandler.logs[5].level).toBe(LogLevel.Trace);
    expect(mockHandler.logs[5].message).toBe('trace message');
  });
  
  test('Logger respects level settings', () => {
    const logger = getLogger('test');
    
    // Set the logger level to Warning
    logger.setLevel(LogLevel.Warning);
    
    // Clear the logs
    mockHandler.clear();
    
    // Log messages at different levels
    logger.critical('critical message');
    logger.error('error message');
    logger.warning('warning message');
    logger.info('info message');
    logger.debug('debug message');
    logger.trace('trace message');
    
    // Handler should have received only Warning and above
    expect(mockHandler.logs.length).toBe(3);
    expect(mockHandler.logs[0].level).toBe(LogLevel.Critical);
    expect(mockHandler.logs[1].level).toBe(LogLevel.Error);
    expect(mockHandler.logs[2].level).toBe(LogLevel.Warning);
  });
  
  test('Multiple loggers have separate levels', () => {
    const logger1 = getLogger('test1');
    const logger2 = getLogger('test2');
    
    // Set different levels
    logger1.setLevel(LogLevel.Error);
    logger2.setLevel(LogLevel.Debug);
    
    // Clear the logs
    mockHandler.clear();
    
    // Log messages at Info level
    logger1.info('info from logger1');
    logger2.info('info from logger2');
    
    // Only logger2 should have logged
    expect(mockHandler.logs.length).toBe(1);
    expect(mockHandler.logs[0].name).toBe('test2');
    expect(mockHandler.logs[0].message).toBe('info from logger2');
  });
});
