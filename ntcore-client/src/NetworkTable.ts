import { NetworkTableInstance } from './NetworkTableInstance';
import { Topic } from './Topic';
import { BooleanTopic } from './topics/BooleanTopic';
import { DoubleTopic } from './topics/DoubleTopic';
import { IntegerTopic } from './topics/IntegerTopic';
import { FloatTopic } from './topics/FloatTopic';
import { StringTopic } from './topics/StringTopic';
import { RawTopic } from './topics/RawTopic';
import { BooleanArrayTopic } from './topics/BooleanArrayTopic';
import { DoubleArrayTopic } from './topics/DoubleArrayTopic';
import { IntegerArrayTopic } from './topics/IntegerArrayTopic';
import { FloatArrayTopic } from './topics/FloatArrayTopic';
import { StringArrayTopic } from './topics/StringArrayTopic';
import { NetworkTableEntry } from './NetworkTableEntry';

/**
 * A network table that knows its subtable path.
 */
export class NetworkTable {
  private instance: NetworkTableInstance;
  private path: string;
  private pathWithSep: string;
  private entries: Map<string, NetworkTableEntry> = new Map();
  private subtables: Map<string, NetworkTable> = new Map();

  /**
   * The path separator for sub-tables and keys
   */
  public static readonly PATH_SEPARATOR = '/';

  /**
   * Constructor. Use NetworkTableInstance.getTable() instead.
   */
  constructor(instance: NetworkTableInstance, path: string) {
    this.instance = instance;
    this.path = path;
    this.pathWithSep = path + NetworkTable.PATH_SEPARATOR;
  }

  /**
   * Gets the instance for the table.
   * 
   * @returns Instance
   */
  public getInstance(): NetworkTableInstance {
    return this.instance;
  }

  /**
   * Gets the table's path.
   * 
   * @returns Path
   */
  public getPath(): string {
    return this.path;
  }

  /**
   * Gets a subtable.
   * 
   * @param key the key name
   * @returns The network table
   */
  public getSubTable(key: string): NetworkTable {
    if (this.subtables.has(key)) {
      return this.subtables.get(key)!;
    }
    const subTablePath = this.path === '' ? key : `${this.path}${NetworkTable.PATH_SEPARATOR}${key}`;
    const subTable = new NetworkTable(this.instance, subTablePath);
    this.subtables.set(key, subTable);
    return subTable;
  }

  /**
   * Gets the entry for a key.
   * 
   * @param key the key name
   * @returns Network table entry
   */
  public getEntry(key: string): NetworkTableEntry {
    if (this.entries.has(key)) {
      return this.entries.get(key)!;
    }
    const fullKey = this.pathWithSep + key;
    const entry = new NetworkTableEntry(this.instance, fullKey);
    this.entries.set(key, entry);
    return entry;
  }

  /**
   * Gets a topic.
   * 
   * @param name topic name
   * @returns Topic
   */
  public getTopic(name: string): Topic {
    return this.instance.getTopic(this.pathWithSep + name);
  }

  /**
   * Gets a boolean topic.
   * 
   * @param name topic name
   * @returns BooleanTopic
   */
  public getBooleanTopic(name: string): BooleanTopic {
    return new BooleanTopic(this.getTopic(name));
  }

  /**
   * Gets a double topic.
   * 
   * @param name topic name
   * @returns DoubleTopic
   */
  public getDoubleTopic(name: string): DoubleTopic {
    return new DoubleTopic(this.getTopic(name));
  }

  /**
   * Gets an integer topic.
   * 
   * @param name topic name
   * @returns IntegerTopic
   */
  public getIntegerTopic(name: string): IntegerTopic {
    return new IntegerTopic(this.getTopic(name));
  }

  /**
   * Gets a float topic.
   * 
   * @param name topic name
   * @returns FloatTopic
   */
  public getFloatTopic(name: string): FloatTopic {
    return new FloatTopic(this.getTopic(name));
  }

  /**
   * Gets a string topic.
   * 
   * @param name topic name
   * @returns StringTopic
   */
  public getStringTopic(name: string): StringTopic {
    return new StringTopic(this.getTopic(name));
  }

  /**
   * Gets a raw topic.
   * 
   * @param name topic name
   * @returns RawTopic
   */
  public getRawTopic(name: string): RawTopic {
    return new RawTopic(this.getTopic(name));
  }

  /**
   * Gets a boolean array topic.
   * 
   * @param name topic name
   * @returns BooleanArrayTopic
   */
  public getBooleanArrayTopic(name: string): BooleanArrayTopic {
    return new BooleanArrayTopic(this.getTopic(name));
  }

  /**
   * Gets a double array topic.
   * 
   * @param name topic name
   * @returns DoubleArrayTopic
   */
  public getDoubleArrayTopic(name: string): DoubleArrayTopic {
    return new DoubleArrayTopic(this.getTopic(name));
  }

  /**
   * Gets an integer array topic.
   * 
   * @param name topic name
   * @returns IntegerArrayTopic
   */
  public getIntegerArrayTopic(name: string): IntegerArrayTopic {
    return new IntegerArrayTopic(this.getTopic(name));
  }

  /**
   * Gets a float array topic.
   * 
   * @param name topic name
   * @returns FloatArrayTopic
   */
  public getFloatArrayTopic(name: string): FloatArrayTopic {
    return new FloatArrayTopic(this.getTopic(name));
  }

  /**
   * Gets a string array topic.
   * 
   * @param name topic name
   * @returns StringArrayTopic
   */
  public getStringArrayTopic(name: string): StringArrayTopic {
    return new StringArrayTopic(this.getTopic(name));
  }

  /**
   * Gets the "base name" of a key. For example, "/foo/bar" becomes "bar".
   * 
   * @param key key
   * @returns base name
   */
  public static basenameKey(key: string): string {
    const lastSep = key.lastIndexOf(NetworkTable.PATH_SEPARATOR);
    if (lastSep === -1) {
      return key;
    }
    return key.substring(lastSep + 1);
  }

  /**
   * Normalizes an NT key to start with a single path separator.
   * 
   * @param key key
   * @returns normalized key
   */
  public static normalizeKey(key: string): string {
    if (key.startsWith(NetworkTable.PATH_SEPARATOR)) {
      return key;
    }
    return NetworkTable.PATH_SEPARATOR + key;
  }

  /**
   * Gets a list of the names of all the super tables of a given key.
   * 
   * @param key the key
   * @returns List of super tables
   */
  public static getHierarchy(key: string): string[] {
    const normalizedKey = NetworkTable.normalizeKey(key);
    const hierarchy: string[] = [NetworkTable.PATH_SEPARATOR];
    
    let currentPath = '';
    const parts = normalizedKey.split(NetworkTable.PATH_SEPARATOR).filter(part => part !== '');
    
    for (let i = 0; i < parts.length; i++) {
      currentPath += NetworkTable.PATH_SEPARATOR + parts[i];
      hierarchy.push(currentPath);
    }
    
    return hierarchy;
  }

  /**
   * Returns a string representation of this table.
   * 
   * @returns String representation
   */
  public toString(): string {
    return `NetworkTable: ${this.path}`;
  }
}
