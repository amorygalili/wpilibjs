import { Topic } from '../Topic';
import { BooleanEntry } from '../entries/BooleanEntry';

/**
 * NetworkTables Boolean topic.
 */
export class BooleanTopic extends Topic {
  /** The default type string for this topic type. */
  public static readonly kTypeString = 'boolean';

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
   * Publishes the topic with the boolean type.
   *
   * @param typeStr type string (ignored, always uses boolean type)
   * @param properties properties to set
   * @returns True if successful
   */
  public publish(typeStr: string = BooleanTopic.kTypeString, properties: Record<string, any> = {}): boolean {
    return super.publish(BooleanTopic.kTypeString, properties);
  }

  /**
   * Create a new entry for the topic.
   *
   * @param defaultValue default value used when a default is not provided to a getter function
   * @returns entry
   */
  public getEntry(defaultValue: boolean = false): BooleanEntry {
    return new BooleanEntry(this, defaultValue);
  }
}
