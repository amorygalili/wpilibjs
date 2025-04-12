/**
 * Interface for sendable builders
 */
export interface SendableBuilder {
  /**
   * Set the function that should be called to update the network table for things other than properties
   * 
   * @param callback Function to call, arguments are timestamp, sendable
   */
  setUpdateTable(callback: (timestamp: number, sendable: any) => void): void;
  
  /**
   * Add a property to the sendable
   * 
   * @param key Property name
   * @param getter Getter function (returns current value)
   * @param setter Setter function (sets new value)
   */
  addProperty<T>(key: string, getter: () => T, setter?: (value: T) => void): void;
  
  /**
   * Add a boolean property to the sendable
   * 
   * @param key Property name
   * @param getter Getter function (returns current value)
   * @param setter Setter function (sets new value)
   */
  addBooleanProperty(key: string, getter: () => boolean, setter?: (value: boolean) => void): void;
  
  /**
   * Add a number property to the sendable
   * 
   * @param key Property name
   * @param getter Getter function (returns current value)
   * @param setter Setter function (sets new value)
   */
  addNumberProperty(key: string, getter: () => number, setter?: (value: number) => void): void;
  
  /**
   * Add a string property to the sendable
   * 
   * @param key Property name
   * @param getter Getter function (returns current value)
   * @param setter Setter function (sets new value)
   */
  addStringProperty(key: string, getter: () => string, setter?: (value: string) => void): void;
  
  /**
   * Add a boolean array property to the sendable
   * 
   * @param key Property name
   * @param getter Getter function (returns current value)
   * @param setter Setter function (sets new value)
   */
  addBooleanArrayProperty(key: string, getter: () => boolean[], setter?: (value: boolean[]) => void): void;
  
  /**
   * Add a number array property to the sendable
   * 
   * @param key Property name
   * @param getter Getter function (returns current value)
   * @param setter Setter function (sets new value)
   */
  addNumberArrayProperty(key: string, getter: () => number[], setter?: (value: number[]) => void): void;
  
  /**
   * Add a string array property to the sendable
   * 
   * @param key Property name
   * @param getter Getter function (returns current value)
   * @param setter Setter function (sets new value)
   */
  addStringArrayProperty(key: string, getter: () => string[], setter?: (value: string[]) => void): void;
  
  /**
   * Add a raw property to the sendable
   * 
   * @param key Property name
   * @param getter Getter function (returns current value)
   * @param setter Setter function (sets new value)
   */
  addRawProperty(key: string, getter: () => Buffer, setter?: (value: Buffer) => void): void;
  
  /**
   * Set the network table entry safety
   * 
   * @param enabled Whether to enable safety
   */
  setSafeState(callback: () => void): void;
  
  /**
   * Set the network table entry to be persistent
   * 
   * @param persistent True to set persistent
   */
  setSmartDashboardType(type: string): void;
  
  /**
   * Get the table for this sendable
   * 
   * @returns The table for this sendable
   */
  getTable(): any;
  
  /**
   * Update the network table values by calling the getters for all properties
   */
  update(): void;
  
  /**
   * Start LiveWindow mode by listening for value changes on all properties
   */
  startListeners(): void;
  
  /**
   * Stop LiveWindow mode by removing all property listeners
   */
  stopListeners(): void;
}
