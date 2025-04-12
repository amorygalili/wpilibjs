import * as net from 'net';
import { SocketAddress } from './SocketAddress';
import { getLogger } from '../logging/Logger';

const logger = getLogger('TcpClient');

/**
 * A TCP client
 */
export class TcpClient {
  private socket: net.Socket | null = null;
  private connected: boolean = false;
  private readonly dataListeners: ((data: Buffer) => void)[] = [];
  private readonly errorListeners: ((error: Error) => void)[] = [];
  private readonly connectListeners: (() => void)[] = [];
  private readonly closeListeners: (() => void)[] = [];
  
  /**
   * Create a new TCP client
   */
  constructor() {
    this.socket = new net.Socket();
    this.setupListeners();
  }
  
  /**
   * Set up the socket event listeners
   */
  private setupListeners(): void {
    if (!this.socket) {
      return;
    }
    
    this.socket.on('data', (data: Buffer) => {
      for (const listener of this.dataListeners) {
        try {
          listener(data);
        } catch (error) {
          logger.error(`Error in data listener: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    });
    
    this.socket.on('error', (error: Error) => {
      for (const listener of this.errorListeners) {
        try {
          listener(error);
        } catch (error) {
          logger.error(`Error in error listener: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    });
    
    this.socket.on('connect', () => {
      this.connected = true;
      for (const listener of this.connectListeners) {
        try {
          listener();
        } catch (error) {
          logger.error(`Error in connect listener: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    });
    
    this.socket.on('close', () => {
      this.connected = false;
      for (const listener of this.closeListeners) {
        try {
          listener();
        } catch (error) {
          logger.error(`Error in close listener: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    });
  }
  
  /**
   * Connect to a server
   * 
   * @param address The server address
   * @returns A promise that resolves when the connection is established
   */
  connect(address: SocketAddress): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket is closed'));
        return;
      }
      
      const onConnect = () => {
        this.socket?.removeListener('connect', onConnect);
        this.socket?.removeListener('error', onError);
        resolve();
      };
      
      const onError = (error: Error) => {
        this.socket?.removeListener('connect', onConnect);
        this.socket?.removeListener('error', onError);
        reject(error);
      };
      
      this.socket.once('connect', onConnect);
      this.socket.once('error', onError);
      
      this.socket.connect({
        host: address.getHost(),
        port: address.getPort()
      });
    });
  }
  
  /**
   * Disconnect from the server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.end();
    }
  }
  
  /**
   * Check if the client is connected
   * 
   * @returns True if the client is connected
   */
  isConnected(): boolean {
    return this.connected;
  }
  
  /**
   * Send data to the server
   * 
   * @param data The data to send
   * @returns A promise that resolves when the data has been sent
   */
  send(data: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket is closed'));
        return;
      }
      
      if (!this.connected) {
        reject(new Error('Not connected'));
        return;
      }
      
      this.socket.write(data, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
  
  /**
   * Add a data listener
   * 
   * @param listener The listener function
   */
  addDataListener(listener: (data: Buffer) => void): void {
    this.dataListeners.push(listener);
  }
  
  /**
   * Remove a data listener
   * 
   * @param listener The listener function
   * @returns True if the listener was removed
   */
  removeDataListener(listener: (data: Buffer) => void): boolean {
    const index = this.dataListeners.indexOf(listener);
    if (index >= 0) {
      this.dataListeners.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * Add an error listener
   * 
   * @param listener The listener function
   */
  addErrorListener(listener: (error: Error) => void): void {
    this.errorListeners.push(listener);
  }
  
  /**
   * Remove an error listener
   * 
   * @param listener The listener function
   * @returns True if the listener was removed
   */
  removeErrorListener(listener: (error: Error) => void): boolean {
    const index = this.errorListeners.indexOf(listener);
    if (index >= 0) {
      this.errorListeners.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * Add a connect listener
   * 
   * @param listener The listener function
   */
  addConnectListener(listener: () => void): void {
    this.connectListeners.push(listener);
  }
  
  /**
   * Remove a connect listener
   * 
   * @param listener The listener function
   * @returns True if the listener was removed
   */
  removeConnectListener(listener: () => void): boolean {
    const index = this.connectListeners.indexOf(listener);
    if (index >= 0) {
      this.connectListeners.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * Add a close listener
   * 
   * @param listener The listener function
   */
  addCloseListener(listener: () => void): void {
    this.closeListeners.push(listener);
  }
  
  /**
   * Remove a close listener
   * 
   * @param listener The listener function
   * @returns True if the listener was removed
   */
  removeCloseListener(listener: () => void): boolean {
    const index = this.closeListeners.indexOf(listener);
    if (index >= 0) {
      this.closeListeners.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * Close the client
   */
  close(): void {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    
    this.connected = false;
  }
}
