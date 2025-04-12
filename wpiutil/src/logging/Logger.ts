import { LogLevel } from './LogLevel';

/**
 * Interface for log handlers
 */
export interface LogHandler {
  /**
   * Handle a log message
   * 
   * @param level The log level
   * @param name The logger name
   * @param message The log message
   * @param timestamp The timestamp of the log message
   */
  handleLog(level: LogLevel, name: string, message: string, timestamp: number): void;
}

/**
 * Console log handler
 */
export class ConsoleLogHandler implements LogHandler {
  /**
   * Handle a log message
   * 
   * @param level The log level
   * @param name The logger name
   * @param message The log message
   * @param timestamp The timestamp of the log message
   */
  handleLog(level: LogLevel, name: string, message: string, timestamp: number): void {
    const date = new Date(timestamp);
    const timeString = date.toISOString();
    const levelString = LogLevel[level].padEnd(8);
    const logMessage = `[${timeString}] ${levelString} [${name}] ${message}`;
    
    switch (level) {
      case LogLevel.Critical:
      case LogLevel.Error:
        console.error(logMessage);
        break;
      case LogLevel.Warning:
        console.warn(logMessage);
        break;
      case LogLevel.Info:
        console.info(logMessage);
        break;
      case LogLevel.Debug:
      case LogLevel.Trace:
        console.debug(logMessage);
        break;
    }
  }
}

/**
 * Global log handlers
 */
const logHandlers: LogHandler[] = [new ConsoleLogHandler()];

/**
 * Global minimum log level
 */
let globalMinLevel: LogLevel = LogLevel.Info;

/**
 * Add a log handler
 * 
 * @param handler The log handler to add
 */
export function addLogHandler(handler: LogHandler): void {
  logHandlers.push(handler);
}

/**
 * Remove a log handler
 * 
 * @param handler The log handler to remove
 * @returns True if the handler was removed
 */
export function removeLogHandler(handler: LogHandler): boolean {
  const index = logHandlers.indexOf(handler);
  if (index >= 0) {
    logHandlers.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Set the global minimum log level
 * 
 * @param level The minimum log level
 */
export function setGlobalLevel(level: LogLevel): void {
  globalMinLevel = level;
}

/**
 * Get the global minimum log level
 * 
 * @returns The minimum log level
 */
export function getGlobalLevel(): LogLevel {
  return globalMinLevel;
}

/**
 * A logger for a specific subsystem
 */
export class Logger {
  private minLevel: LogLevel | null = null;
  
  /**
   * Create a new logger
   * 
   * @param name The logger name
   */
  constructor(private name: string) {}
  
  /**
   * Set the minimum log level for this logger
   * 
   * @param level The minimum log level
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }
  
  /**
   * Get the minimum log level for this logger
   * 
   * @returns The minimum log level
   */
  getLevel(): LogLevel {
    return this.minLevel !== null ? this.minLevel : globalMinLevel;
  }
  
  /**
   * Check if a log level is enabled
   * 
   * @param level The log level to check
   * @returns True if the log level is enabled
   */
  isEnabledFor(level: LogLevel): boolean {
    return level >= this.getLevel();
  }
  
  /**
   * Log a message at a specific level
   * 
   * @param level The log level
   * @param message The log message
   */
  log(level: LogLevel, message: string): void {
    if (this.isEnabledFor(level)) {
      const timestamp = Date.now();
      for (const handler of logHandlers) {
        handler.handleLog(level, this.name, message, timestamp);
      }
    }
  }
  
  /**
   * Log a critical message
   * 
   * @param message The log message
   */
  critical(message: string): void {
    this.log(LogLevel.Critical, message);
  }
  
  /**
   * Log an error message
   * 
   * @param message The log message
   */
  error(message: string): void {
    this.log(LogLevel.Error, message);
  }
  
  /**
   * Log a warning message
   * 
   * @param message The log message
   */
  warning(message: string): void {
    this.log(LogLevel.Warning, message);
  }
  
  /**
   * Log an info message
   * 
   * @param message The log message
   */
  info(message: string): void {
    this.log(LogLevel.Info, message);
  }
  
  /**
   * Log a debug message
   * 
   * @param message The log message
   */
  debug(message: string): void {
    this.log(LogLevel.Debug, message);
  }
  
  /**
   * Log a trace message
   * 
   * @param message The log message
   */
  trace(message: string): void {
    this.log(LogLevel.Trace, message);
  }
}

/**
 * Get a logger for a specific subsystem
 * 
 * @param name The logger name
 * @returns A logger for the specified subsystem
 */
export function getLogger(name: string): Logger {
  return new Logger(name);
}
