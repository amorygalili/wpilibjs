import { NetworkTableInstance } from './NetworkTableInstance';

/**
 * NetworkTables Topic.
 */
export class Topic {
  protected instance: NetworkTableInstance;
  protected name: string;
  protected type: string = '';
  protected properties: Record<string, any> = {};
  protected exists_: boolean = false;

  /**
   * Constructor. Use NetworkTableInstance.getTopic() instead.
   */
  constructor(instance: NetworkTableInstance, name: string) {
    this.instance = instance;
    this.name = name;
  }

  /**
   * Gets the instance for the topic.
   *
   * @returns Instance
   */
  public getInstance(): NetworkTableInstance {
    return this.instance;
  }

  /**
   * Gets the name of the topic.
   *
   * @returns Topic name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Gets the type of the topic.
   *
   * @returns Topic type
   */
  public getType(): string {
    return this.type;
  }

  /**
   * Determines if the topic exists.
   *
   * @returns True if the topic exists
   */
  public exists(): boolean {
    return this.exists_;
  }

  /**
   * Gets a property of the topic.
   *
   * @param name property name
   * @returns Property value or undefined if the property doesn't exist
   */
  public getProperty(name: string): any {
    return this.properties[name];
  }

  /**
   * Sets a property of the topic.
   *
   * @param name property name
   * @param value property value
   */
  public setProperty(name: string, value: any): void {
    this.properties[name] = value;

    // Update the topic properties in the NT4 client
    const client = this.instance.getClient();
    try {
      // Try to update the topic properties
      // This is a best-effort approach since we don't have direct access to the NT4 client's internal state
      client.setProperties(this.name, { [name]: value });
    } catch (error) {
      console.warn(`Could not update property ${name} for topic ${this.name}:`, error);
    }
  }

  /**
   * Gets all properties of the topic.
   *
   * @returns Properties
   */
  public getProperties(): Record<string, any> {
    return { ...this.properties };
  }

  /**
   * Sets the topic's properties.
   *
   * @param properties properties to set
   */
  public setProperties(properties: Record<string, any>): void {
    this.properties = { ...properties };

    // Update the topic properties in the NT4 client
    const client = this.instance.getClient();
    try {
      // Try to update the topic properties
      // This is a best-effort approach since we don't have direct access to the NT4 client's internal state
      client.setProperties(this.name, properties);
    } catch (error) {
      console.warn(`Could not update properties for topic ${this.name}:`, error);
    }
  }

  /**
   * Publishes the topic with a specific type.
   *
   * @param typeStr type string
   * @param properties properties to set
   * @returns True if successful
   */
  public publish(typeStr: string, properties: Record<string, any> = {}): boolean {
    try {
      const client = this.instance.getClient();
      client.publishTopic(this.name, typeStr);
      if (Object.keys(properties).length > 0) {
        client.setProperties(this.name, properties);
      }
      this.type = typeStr;
      this.properties = { ...properties };
      this.exists_ = true;
      return true;
    } catch (error) {
      console.error(`Error publishing topic ${this.name}:`, error);
      return false;
    }
  }

  /**
   * Unpublishes the topic.
   */
  public unpublish(): void {
    try {
      const client = this.instance.getClient();
      client.unpublishTopic(this.name);
      this.exists_ = false;
    } catch (error) {
      console.error(`Error unpublishing topic ${this.name}:`, error);
    }
  }

  /**
   * Subscribes to the topic.
   *
   * @param periodic how frequently to send updates
   * @param all if true, send all values; if false, only send the most recent value
   * @returns Subscription ID
   */
  public subscribe(periodic: number = 0.1, all: boolean = false): number {
    const client = this.instance.getClient();
    return client.subscribe([this.name], false, all, periodic);
  }

  /**
   * Unsubscribes from the topic.
   *
   * @param subuid subscription ID
   */
  public unsubscribe(subuid: number): void {
    const client = this.instance.getClient();
    client.unsubscribe(subuid);
  }
}
