/**
 * Stores a callback registration and provides a way to cancel it
 */
export class CallbackStore {
  /**
   * Constructor
   * 
   * @param index The device index
   * @param uid The callback UID
   * @param cancelCallback The function to call to cancel the callback
   */
  constructor(
    private index: number,
    private uid: number,
    private cancelCallback: (index: number, uid: number) => void
  ) {}
  
  /**
   * Cancel the callback
   */
  cancel(): void {
    this.cancelCallback(this.index, this.uid);
  }
  
  /**
   * Get the device index
   * 
   * @returns The device index
   */
  getIndex(): number {
    return this.index;
  }
  
  /**
   * Get the callback UID
   * 
   * @returns The callback UID
   */
  getUid(): number {
    return this.uid;
  }
}
