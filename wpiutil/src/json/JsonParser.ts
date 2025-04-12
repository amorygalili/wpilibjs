/**
 * JSON parsing utilities
 */
export class JsonParser {
  /**
   * Parse a JSON string
   * 
   * @param json The JSON string to parse
   * @returns The parsed JSON object
   */
  static parse(json: string): any {
    try {
      return JSON.parse(json);
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Stringify a JSON object
   * 
   * @param obj The object to stringify
   * @param pretty Whether to pretty-print the JSON
   * @returns The JSON string
   */
  static stringify(obj: any, pretty: boolean = false): string {
    try {
      return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
    } catch (error) {
      throw new Error(`Failed to stringify JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get a value from a JSON object
   * 
   * @param obj The JSON object
   * @param path The path to the value (e.g. "foo.bar.baz")
   * @param defaultValue The default value to return if the path doesn't exist
   * @returns The value at the path, or the default value if the path doesn't exist
   */
  static getValue(obj: any, path: string, defaultValue: any = undefined): any {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return defaultValue;
      }
      
      current = current[part];
    }
    
    return current !== undefined ? current : defaultValue;
  }
  
  /**
   * Set a value in a JSON object
   * 
   * @param obj The JSON object
   * @param path The path to the value (e.g. "foo.bar.baz")
   * @param value The value to set
   * @returns The modified JSON object
   */
  static setValue(obj: any, path: string, value: any): any {
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      
      if (current[part] === undefined || current[part] === null || typeof current[part] !== 'object') {
        current[part] = {};
      }
      
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
    return obj;
  }
  
  /**
   * Check if a JSON object has a value at a path
   * 
   * @param obj The JSON object
   * @param path The path to check (e.g. "foo.bar.baz")
   * @returns True if the path exists
   */
  static hasValue(obj: any, path: string): boolean {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return false;
      }
      
      if (!(part in current)) {
        return false;
      }
      
      current = current[part];
    }
    
    return true;
  }
  
  /**
   * Remove a value from a JSON object
   * 
   * @param obj The JSON object
   * @param path The path to remove (e.g. "foo.bar.baz")
   * @returns The modified JSON object
   */
  static removeValue(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      
      if (current === null || current === undefined || typeof current !== 'object') {
        return obj;
      }
      
      if (!(part in current)) {
        return obj;
      }
      
      current = current[part];
    }
    
    const lastPart = parts[parts.length - 1];
    if (current !== null && current !== undefined && typeof current === 'object' && lastPart in current) {
      delete current[lastPart];
    }
    
    return obj;
  }
}
