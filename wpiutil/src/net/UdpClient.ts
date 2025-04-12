import * as dgram from 'dgram';
import { SocketAddress } from './SocketAddress';
import { getLogger } from '../logging/Logger';

const logger = getLogger('UdpClient');

/**
 * A UDP client
 */
export class UdpClient {
  private socket: dgram.Socket | null = null;
  private bound: boolean = false;
  private readonly messageListeners: ((msg: Buffer, rinfo: dgram.RemoteInfo) => void)[] = [];
  private readonly errorListeners: ((error: Error) => void)[] = [];
  
  /**
   * Create a new UDP client
   */
  constructor() {
    this.socket = dgram.createSocket('udp4');
    this.setupListeners();
  }
  
  /**
   * Set up the socket event listeners
   */
  private setupListeners(): void {
    if (!this.socket) {
      return;
    }
    
    this.socket.on('message', (msg: Buffer, rinfo: dgram.RemoteInfo) => {
      for (const listener of this.messageListeners) {
        try {
          listener(msg, rinfo);
        } catch (error) {
          logger.error(`Error in message listener: ${error instanceof Error ? error.message : String(error)}`);
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
  }
  
  /**
   * Bind the socket to a local address
   * 
   * @param address The local address to bind to
   * @returns A promise that resolves when the socket is bound
   */
  bind(address: SocketAddress): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket is closed'));
        return;
      }
      
      const onListening = () => {
        this.socket?.removeListener('listening', onListening);
        this.socket?.removeListener('error', onError);
        this.bound = true;
        resolve();
      };
      
      const onError = (error: Error) => {
        this.socket?.removeListener('listening', onListening);
        this.socket?.removeListener('error', onError);
        reject(error);
      };
      
      this.socket.once('listening', onListening);
      this.socket.once('error', onError);
      
      this.socket.bind({
        address: address.getHost(),
        port: address.getPort()
      });
    });
  }
  
  /**
   * Send data to a remote address
   * 
   * @param data The data to send
   * @param address The remote address
   * @returns A promise that resolves when the data has been sent
   */
  send(data: Buffer, address: SocketAddress): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket is closed'));
        return;
      }
      
      this.socket.send(data, 0, data.length, address.getPort(), address.getHost(), (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
  
  /**
   * Check if the socket is bound
   * 
   * @returns True if the socket is bound
   */
  isBound(): boolean {
    return this.bound;
  }
  
  /**
   * Add a message listener
   * 
   * @param listener The listener function
   */
  addMessageListener(listener: (msg: Buffer, rinfo: dgram.RemoteInfo) => void): void {
    this.messageListeners.push(listener);
  }
  
  /**
   * Remove a message listener
   * 
   * @param listener The listener function
   * @returns True if the listener was removed
   */
  removeMessageListener(listener: (msg: Buffer, rinfo: dgram.RemoteInfo) => void): boolean {
    const index = this.messageListeners.indexOf(listener);
    if (index >= 0) {
      this.messageListeners.splice(index, 1);
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
   * Close the socket
   */
  close(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.bound = false;
  }
}
