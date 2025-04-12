/**
 * Simple NetworkTables interface for WPILib.
 *
 * This is a placeholder for backward compatibility.
 * Use the ntcore-client package directly for NetworkTables functionality.
 */

/**
 * NetworkTables interface for WPILib.
 *
 * This class is a placeholder for backward compatibility.
 * Use the ntcore-client package directly for NetworkTables functionality.
 */
export class NetworkTablesInterface {
  private static instance: NetworkTablesInterface;

  /**
   * Get the singleton instance of the NetworkTablesInterface.
   */
  public static getInstance(): NetworkTablesInterface {
    if (!NetworkTablesInterface.instance) {
      NetworkTablesInterface.instance = new NetworkTablesInterface();
    }
    return NetworkTablesInterface.instance;
  }

  private constructor() {
    console.warn('NetworkTablesInterface is deprecated. Use ntcore-client directly.');
  }

  /**
   * Start the NetworkTables server.
   *
   * @param port The port to listen on (default: 5810)
   */
  public startServer(port: number = 5810): void {
    console.warn('NetworkTablesInterface is deprecated. Use ntcore-client directly.');
  }

  /**
   * Start the NetworkTables client.
   *
   * @param identity The client identity
   * @param serverAddr The server address (default: 'localhost')
   * @param port The server port (default: 5810)
   */
  public startClient(identity: string, serverAddr: string = 'localhost', port: number = 5810): void {
    console.warn('NetworkTablesInterface is deprecated. Use ntcore-client directly.');
  }

  /**
   * Check if connected to NetworkTables.
   *
   * @returns True if connected, false otherwise
   */
  public isConnected(): boolean {
    console.warn('NetworkTablesInterface is deprecated. Use ntcore-client directly.');
    return false;
  }
}

// Export singleton instance
export const networkTables = NetworkTablesInterface.getInstance();
