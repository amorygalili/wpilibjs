import { Sendable } from './Sendable';

/**
 * The SendableRegistry class is the public interface for registering sendable objects
 */
export class SendableRegistry {
  private static readonly components = new Map<object, Sendable>();
  private static readonly names = new Map<object, string>();
  private static readonly subsystems = new Map<object, object>();
  private static readonly liveWindowEnabled = new Map<object, boolean>();
  private static readonly liveWindowNames = new Map<string, number>();
  
  /**
   * Add a Sendable object to the registry
   * 
   * @param sendable The sendable object to add
   * @param name The name of the sendable object
   */
  static add(sendable: Sendable, name: string): void {
    SendableRegistry.components.set(sendable, sendable);
    SendableRegistry.names.set(sendable, name);
  }
  
  /**
   * Add a Sendable object to the registry
   * 
   * @param sendable The sendable object to add
   * @param subsystem The subsystem name
   * @param name The name of the sendable object
   */
  static add(sendable: Sendable, subsystem: string, name: string): void {
    SendableRegistry.components.set(sendable, sendable);
    SendableRegistry.names.set(sendable, `${subsystem}/${name}`);
    SendableRegistry.subsystems.set(sendable, subsystem);
  }
  
  /**
   * Add a child Sendable object to the registry
   * 
   * @param parent The parent sendable object
   * @param child The child sendable object
   * @param name The name of the child
   */
  static addChild(parent: Sendable, child: Sendable, name: string): void {
    SendableRegistry.components.set(child, child);
    SendableRegistry.names.set(child, name);
    SendableRegistry.subsystems.set(child, parent);
  }
  
  /**
   * Remove a Sendable object from the registry
   * 
   * @param sendable The sendable object to remove
   */
  static remove(sendable: Sendable): void {
    SendableRegistry.components.delete(sendable);
    SendableRegistry.names.delete(sendable);
    SendableRegistry.subsystems.delete(sendable);
    SendableRegistry.liveWindowEnabled.delete(sendable);
  }
  
  /**
   * Enable LiveWindow for a Sendable object
   * 
   * @param sendable The sendable object to enable
   */
  static enableLiveWindow(sendable: Sendable): void {
    SendableRegistry.liveWindowEnabled.set(sendable, true);
  }
  
  /**
   * Disable LiveWindow for a Sendable object
   * 
   * @param sendable The sendable object to disable
   */
  static disableLiveWindow(sendable: Sendable): void {
    SendableRegistry.liveWindowEnabled.set(sendable, false);
  }
  
  /**
   * Check if LiveWindow is enabled for a Sendable object
   * 
   * @param sendable The sendable object to check
   * @returns True if LiveWindow is enabled
   */
  static isLiveWindowEnabled(sendable: Sendable): boolean {
    return SendableRegistry.liveWindowEnabled.get(sendable) ?? false;
  }
  
  /**
   * Get the name of a Sendable object
   * 
   * @param sendable The sendable object
   * @returns The name
   */
  static getName(sendable: Sendable): string {
    return SendableRegistry.names.get(sendable) ?? '';
  }
  
  /**
   * Set the name of a Sendable object
   * 
   * @param sendable The sendable object
   * @param name The name
   */
  static setName(sendable: Sendable, name: string): void {
    SendableRegistry.names.set(sendable, name);
  }
  
  /**
   * Set the name of a Sendable object
   * 
   * @param sendable The sendable object
   * @param subsystem The subsystem name
   * @param name The name
   */
  static setName(sendable: Sendable, subsystem: string, name: string): void {
    SendableRegistry.names.set(sendable, `${subsystem}/${name}`);
    SendableRegistry.subsystems.set(sendable, subsystem);
  }
  
  /**
   * Get the subsystem of a Sendable object
   * 
   * @param sendable The sendable object
   * @returns The subsystem
   */
  static getSubsystem(sendable: Sendable): string {
    const subsystem = SendableRegistry.subsystems.get(sendable);
    if (typeof subsystem === 'string') {
      return subsystem;
    } else if (subsystem) {
      return SendableRegistry.getName(subsystem as unknown as Sendable);
    } else {
      return '';
    }
  }
  
  /**
   * Set the subsystem of a Sendable object
   * 
   * @param sendable The sendable object
   * @param subsystem The subsystem
   */
  static setSubsystem(sendable: Sendable, subsystem: string): void {
    SendableRegistry.subsystems.set(sendable, subsystem);
  }
  
  /**
   * Get a unique name for a Sendable object in LiveWindow
   * 
   * @param sendable The sendable object
   * @param type The type of the sendable
   * @returns The unique name
   */
  static getLiveWindowName(sendable: Sendable, type: string): string {
    const name = SendableRegistry.getName(sendable);
    if (name.length > 0) {
      return name;
    }
    
    const subsystem = SendableRegistry.getSubsystem(sendable);
    const baseName = subsystem.length > 0 ? `${subsystem}/${type}` : type;
    
    let count = SendableRegistry.liveWindowNames.get(baseName) ?? 0;
    count++;
    SendableRegistry.liveWindowNames.set(baseName, count);
    
    return `${baseName} ${count}`;
  }
  
  /**
   * Get all registered Sendable objects
   * 
   * @returns An array of all registered Sendable objects
   */
  static getAll(): Sendable[] {
    return Array.from(SendableRegistry.components.values());
  }
}
