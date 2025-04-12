/**
 * Bridge between our simulation and the NetworkTables 4 client.
 *
 * This bridge allows our simulation to communicate with Shuffleboard and OutlineViewer
 * by connecting to the same NetworkTables server.
 */
import { EventEmitter } from 'events';
import { NT4Client, NT4DataType } from './NT4Client';
import { networkTables } from './NetworkTablesInterface';

/**
 * Bridge between our simulation and the NetworkTables 4 client.
 *
 * This bridge allows our simulation to communicate with Shuffleboard and OutlineViewer
 * by connecting to the same NetworkTables server.
 */
export class NT4Bridge extends EventEmitter {
  private ntClient: NT4Client;
  private connected: boolean = false;
  private topicMap: Map<string, { type: NT4DataType, value: any }> = new Map();

  /**
   * Create a new NetworkTables 4 bridge.
   *
   * @param serverUrl The URL of the NetworkTables server.
   */
  constructor(ntClient: NT4Client) {
    super();
    this.ntClient = ntClient;

    // Listen for NT4 client events
    this.ntClient.on('connected', () => {
      this.connected = true;
      this.emit('connected');
    });

    this.ntClient.on('disconnected', () => {
      this.connected = false;
      this.emit('disconnected');
    });

    this.ntClient.on('error', (error) => {
      this.emit('error', error);
    });

    this.ntClient.on('valueChanged', (name, value, timestamp) => {
      // Update our internal NetworkTables
      this.updateInternalNetworkTables(name, value);
    });

    // Listen for internal NetworkTables events by monitoring specific topics
    // We'll create listeners for common topics
    const topics = [
      'Robot/LeftMotor',
      'Robot/RightMotor',
      'Robot/Encoder',
      'Robot/LimitSwitch',
      'Robot/Potentiometer',
      'Robot/Enabled',
      'Robot/Mode'
    ];

    // Create listeners for each topic
    topics.forEach(topicName => {
      // Try different types
      try {
        const booleanTopic = networkTables.getBoolean(topicName);
        booleanTopic.on('valueChanged', (value: boolean) => {
          this.updateNT4(topicName, value);
        });
      } catch (e) {
        // Not a boolean topic
      }

      try {
        const numberTopic = networkTables.getNumber(topicName);
        numberTopic.on('valueChanged', (value: number) => {
          this.updateNT4(topicName, value);
        });
      } catch (e) {
        // Not a number topic
      }

      try {
        const stringTopic = networkTables.getString(topicName);
        stringTopic.on('valueChanged', (value: string) => {
          this.updateNT4(topicName, value);
        });
      } catch (e) {
        // Not a string topic
      }
    });
  }

  /**
   * Connect to the NetworkTables server.
   *
   * @returns A promise that resolves when the connection is established.
   */
  public async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    await this.ntClient.connect();

    // Subscribe to all topics
    this.ntClient.subscribe({
      all: true,
      immediate: true
    });
  }

  /**
   * Disconnect from the NetworkTables server.
   */
  public disconnect(): void {
    this.ntClient.disconnect();
  }

  /**
   * Check if the bridge is connected to the NetworkTables server.
   *
   * @returns True if connected, false otherwise.
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Update our internal NetworkTables with a value from NT4.
   *
   * @param name The topic name.
   * @param value The topic value.
   */
  private updateInternalNetworkTables(name: string, value: any): void {
    try {
      // Determine the type of the value and update the appropriate topic
      if (typeof value === 'boolean') {
        const topic = networkTables.getBoolean(name);
        topic.value = value;
      } else if (typeof value === 'number') {
        const topic = networkTables.getNumber(name);
        topic.value = value;
      } else if (typeof value === 'string') {
        const topic = networkTables.getString(name);
        topic.value = value;
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          if (typeof value[0] === 'boolean') {
            const topic = networkTables.getBooleanArray(name);
            topic.value = value;
          } else if (typeof value[0] === 'number') {
            const topic = networkTables.getNumberArray(name);
            topic.value = value;
          } else if (typeof value[0] === 'string') {
            const topic = networkTables.getStringArray(name);
            topic.value = value;
          }
        }
      }
    } catch (error) {
      console.error('Error updating internal NetworkTables:', error);
    }
  }

  /**
   * Update NT4 with a value from our internal NetworkTables.
   *
   * @param name The topic name.
   * @param value The topic value.
   */
  private updateNT4(name: string, value: any): void {
    try {
      // Determine the type of the value
      let type: NT4DataType;
      if (typeof value === 'boolean') {
        type = NT4DataType.Boolean;
      } else if (typeof value === 'number') {
        type = NT4DataType.Double;
      } else if (typeof value === 'string') {
        type = NT4DataType.String;
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          if (typeof value[0] === 'boolean') {
            type = NT4DataType.BooleanArray;
          } else if (typeof value[0] === 'number') {
            type = NT4DataType.DoubleArray;
          } else if (typeof value[0] === 'string') {
            type = NT4DataType.StringArray;
          } else {
            console.warn('Unsupported array element type:', typeof value[0]);
            return;
          }
        } else {
          // Empty array, default to double array
          type = NT4DataType.DoubleArray;
        }
      } else {
        console.warn('Unsupported value type:', typeof value);
        return;
      }

      // Store the type and value
      this.topicMap.set(name, { type, value });

      // Publish to NT4
      this.ntClient.publish(name, value, type);
    } catch (error) {
      console.error('Error updating NT4:', error);
    }
  }
}

// Export singleton instance
export const nt4Bridge = new NT4Bridge(new NT4Client());
