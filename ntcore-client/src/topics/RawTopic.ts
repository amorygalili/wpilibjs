import { Topic } from '../Topic';
import { RawEntry } from '../entries/RawEntry';

/**
 * NetworkTables Raw topic.
 */
export class RawTopic extends Topic {
  /** The default type string for this topic type. */
  public static readonly kTypeString = 'raw';

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
   * Publishes the topic with the raw type.
   *
   * @param typeStr type string (ignored, always uses raw type)
   * @param properties properties to set
   * @returns True if successful
   */
  public publish(typeStr: string = RawTopic.kTypeString, properties: Record<string, any> = {}): boolean {
    return super.publish(RawTopic.kTypeString, properties);
  }

  /**
   * Create a new entry for the topic.
   *
   * @param defaultValue default value used when a default is not provided to a getter function
   * @returns entry
   */
  public getEntry(defaultValue: Uint8Array = new Uint8Array(0)): RawEntry {
    return new RawEntry(this, defaultValue);
  }
}
