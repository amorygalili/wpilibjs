import { Topic } from '../Topic';
import { DoubleEntry } from '../entries/DoubleEntry';

/**
 * NetworkTables Double topic.
 */
export class DoubleTopic extends Topic {
  /** The default type string for this topic type. */
  public static readonly kTypeString = 'double';

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
   * Publishes the topic with the double type.
   *
   * @param typeStr type string (ignored, always uses double type)
   * @param properties properties to set
   * @returns True if successful
   */
  public publish(typeStr: string = DoubleTopic.kTypeString, properties: Record<string, any> = {}): boolean {
    return super.publish(DoubleTopic.kTypeString, properties);
  }

  /**
   * Create a new entry for the topic.
   *
   * @param defaultValue default value used when a default is not provided to a getter function
   * @returns entry
   */
  public getEntry(defaultValue: number = 0): DoubleEntry {
    return new DoubleEntry(this, defaultValue);
  }
}
