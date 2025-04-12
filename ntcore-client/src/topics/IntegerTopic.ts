import { Topic } from '../Topic';
import { IntegerEntry } from '../entries/IntegerEntry';

/**
 * NetworkTables Integer topic.
 */
export class IntegerTopic extends Topic {
  /** The default type string for this topic type. */
  public static readonly kTypeString = 'int';

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
   * Publishes the topic with the integer type.
   *
   * @param typeStr type string (ignored, always uses integer type)
   * @param properties properties to set
   * @returns True if successful
   */
  public publish(typeStr: string = IntegerTopic.kTypeString, properties: Record<string, any> = {}): boolean {
    return super.publish(IntegerTopic.kTypeString, properties);
  }

  /**
   * Create a new entry for the topic.
   *
   * @param defaultValue default value used when a default is not provided to a getter function
   * @returns entry
   */
  public getEntry(defaultValue: number = 0): IntegerEntry {
    return new IntegerEntry(this, defaultValue);
  }
}
