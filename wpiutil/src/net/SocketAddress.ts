/**
 * A socket address (IP address and port)
 */
export class SocketAddress {
  /**
   * Create a new socket address
   * 
   * @param host The host name or IP address
   * @param port The port number
   */
  constructor(private host: string, private port: number) {}
  
  /**
   * Get the host name or IP address
   * 
   * @returns The host name or IP address
   */
  getHost(): string {
    return this.host;
  }
  
  /**
   * Get the port number
   * 
   * @returns The port number
   */
  getPort(): number {
    return this.port;
  }
  
  /**
   * Convert the socket address to a string
   * 
   * @returns The socket address as a string
   */
  toString(): string {
    return `${this.host}:${this.port}`;
  }
  
  /**
   * Check if this socket address is equal to another
   * 
   * @param other The other socket address
   * @returns True if the socket addresses are equal
   */
  equals(other: SocketAddress): boolean {
    return this.host === other.host && this.port === other.port;
  }
}
