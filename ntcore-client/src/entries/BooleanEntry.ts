import { BooleanTopic } from '../topics/BooleanTopic';

/**
 * NetworkTables Boolean entry.
 */
export class BooleanEntry {
  private topic: BooleanTopic;
  private defaultValue: boolean;
  private value: boolean;
  private lastTimestamp: number = 0;
  private subscriptionId: number = -1;

  /**
   * Constructor.
   *
   * @param topic Topic
   * @param defaultValue Default value for get()
   */
  constructor(topic: BooleanTopic, defaultValue: boolean) {
    this.topic = topic;
    this.defaultValue = defaultValue;
    this.value = defaultValue;

    // Subscribe to the topic
    this.subscriptionId = topic.subscribe();
  }

  /**
   * Gets the topic for the entry.
   *
   * @returns Topic
   */
  public getTopic(): BooleanTopic {
    return this.topic;
  }

  /**
   * Gets the entry's value.
   *
   * @returns The value or the default value if the entry does not exist
   */
  public get(): boolean {
    return this.value;
  }

  /**
   * Sets the entry's value.
   *
   * @param value the value to set
   */
  public set(value: boolean): void {
    // Always publish the topic to ensure it's published
    // This ensures the topic is published even if the connection was lost and regained
    this.topic.publish();

    // Set the value
    const client = this.topic.getInstance().getClient();
    client.addSample(this.topic.getName(), value);

    // Update local state
    this.value = value;
    this.lastTimestamp = Date.now() * 1000; // Convert to microseconds
  }

  /**
   * Sets the entry's default value.
   *
   * @param value the default value
   */
  public setDefault(value: boolean): void {
    this.defaultValue = value;
  }

  /**
   * Gets the last time the entry's value was changed.
   *
   * @returns Time in microseconds
   */
  public getLastChange(): number {
    return this.lastTimestamp;
  }

  /**
   * Determines if the entry exists.
   *
   * @returns True if the entry exists
   */
  public exists(): boolean {
    return this.topic.exists();
  }

  /**
   * Stops publishing the entry if it's published.
   */
  public unpublish(): void {
    this.topic.unpublish();
  }

  /**
   * Closes the entry.
   */
  public close(): void {
    if (this.subscriptionId !== -1) {
      this.topic.unsubscribe(this.subscriptionId);
      this.subscriptionId = -1;
    }
  }
}
