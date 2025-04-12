import * as net from 'net';
import { SocketAddress } from './SocketAddress';
import { getLogger } from '../logging/Logger';

const logger = getLogger('TcpServer');

/**
 * A TCP server
 */
export class TcpServer {
  private server: net.Server | null = null;
  private clients: net.Socket[] = [];
  private listening: boolean = false;
  private readonly connectionListeners: ((socket: net.Socket) => void)[] = [];
  private readonly errorListeners: ((error: Error) => void)[] = [];
  
  /**
   * Create a new TCP server
   */
  constructor() {
    this.server = net.createServer();
    this.setupListeners();
  }
  
  /**
   * Set up the server event listeners
   */
  private setupListeners(): void {
    if (!this.server) {
      return;
    }
    
    this.server.on('connection', (socket: net.Socket) => {
      this.clients.push(socket);
      
      socket.on('close', () => {
        const index = this.clients.indexOf(socket);
        if (index >= 0) {
          this.clients.splice(index, 1);
        }
      });
      
      for (const listener of this.connectionListeners) {
        try {
          listener(socket);
        } catch (error) {
          logger.error(`Error in connection listener: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    });
    
    this.server.on('error', (error: Error) => {
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
   * Start listening for connections
   * 
   * @param address The address to listen on
   * @returns A promise that resolves when the server is listening
   */
  listen(address: SocketAddress): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        reject(new Error('Server is closed'));
        return;
      }
      
      const onListening = () => {
        this.server?.removeListener('listening', onListening);
        this.server?.removeListener('error', onError);
        this.listening = true;
        resolve();
      };
      
      const onError = (error: Error) => {
        this.server?.removeListener('listening', onListening);
        this.server?.removeListener('error', onError);
        reject(error);
      };
      
      this.server.once('listening', onListening);
      this.server.once('error', onError);
      
      this.server.listen({
        host: address.getHost(),
        port: address.getPort()
      });
    });
  }
  
  /**
   * Stop listening for connections
   */
  stop(): void {
    if (this.server) {
      this.server.close();
    }
    
    this.listening = false;
  }
  
  /**
   * Check if the server is listening
   * 
   * @returns True if the server is listening
   */
  isListening(): boolean {
    return this.listening;
  }
  
  /**
   * Get the number of connected clients
   * 
   * @returns The number of connected clients
   */
  getClientCount(): number {
    return this.clients.length;
  }
  
  /**
   * Send data to all connected clients
   * 
   * @param data The data to send
   */
  broadcast(data: Buffer): void {
    for (const client of this.clients) {
      try {
        client.write(data);
      } catch (error) {
        logger.error(`Error broadcasting to client: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  
  /**
   * Add a connection listener
   * 
   * @param listener The listener function
   */
  addConnectionListener(listener: (socket: net.Socket) => void): void {
    this.connectionListeners.push(listener);
  }
  
  /**
   * Remove a connection listener
   * 
   * @param listener The listener function
   * @returns True if the listener was removed
   */
  removeConnectionListener(listener: (socket: net.Socket) => void): boolean {
    const index = this.connectionListeners.indexOf(listener);
    if (index >= 0) {
      this.connectionListeners.splice(index, 1);
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
   * Close the server and disconnect all clients
   */
  close(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    
    for (const client of this.clients) {
      client.destroy();
    }
    
    this.clients = [];
    this.listening = false;
  }
}
