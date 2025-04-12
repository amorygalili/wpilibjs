import { Topic } from '../Topic';
import { StringEntry } from '../entries/StringEntry';

/**
 * NetworkTables String topic.
 */
export class StringTopic extends Topic {
  /** The default type string for this topic type. */
  public static readonly kTypeString = 'string';

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
   * Publishes the topic with the string type.
   *
   * @param typeStr type string (ignored, always uses string type)
   * @param properties properties to set
   * @returns True if successful
   */
  public publish(typeStr: string = StringTopic.kTypeString, properties: Record<string, any> = {}): boolean {
    return super.publish(StringTopic.kTypeString, properties);
  }

  /**
   * Create a new entry for the topic.
   *
   * @param defaultValue default value used when a default is not provided to a getter function
   * @returns entry
   */
  public getEntry(defaultValue: string = ''): StringEntry {
    return new StringEntry(this, defaultValue);
  }
}
