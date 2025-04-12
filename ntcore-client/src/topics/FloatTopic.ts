import { Topic } from '../Topic';
import { FloatEntry } from '../entries/FloatEntry';

/**
 * NetworkTables Float topic.
 */
export class FloatTopic extends Topic {
  /** The default type string for this topic type. */
  public static readonly kTypeString = 'float';

  /**
   * Construct from a generic topic.
   *
   * @param topic Topic
   */
  constructor(topic: Topic) {
    super(topic.getInstance(), topic.getName());

    // Copy properties from the generic topic
    if (topic.exists()) {
      this.exists_ = true;
      this.type = topic.getType();
      this.properties = topic.getProperties();
    }
  }

  /**
   * Publishes the topic with the float type.
   *
   * @param typeStr type string (ignored, always uses float type)
   * @param properties properties to set
   * @returns True if successful
   */
  public publish(typeStr: string = FloatTopic.kTypeString, properties: Record<string, any> = {}): boolean {
    return super.publish(FloatTopic.kTypeString, properties);
  }

  /**
   * Create a new entry for the topic.
   *
   * @param defaultValue default value used when a default is not provided to a getter function
   * @returns entry
   */
  public getEntry(defaultValue: number = 0): FloatEntry {
    return new FloatEntry(this, defaultValue);
  }
}
