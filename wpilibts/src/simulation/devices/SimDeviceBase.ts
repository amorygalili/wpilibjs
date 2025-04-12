/**
 * Base class for HAL device simulation.
 */
import { EventEmitter } from 'events';

/**
 * Base class for HAL device simulation.
 */
export abstract class SimDeviceBase extends EventEmitter {
  protected _initialized: boolean = false;
  protected _index: number;

  /**
   * Constructor.
   * 
   * @param index The device index.
   */
  constructor(index: number) {
    super();
    this._index = index;
  }

  /**
   * Get the device index.
   * 
   * @returns The device index.
   */
  public getIndex(): number {
    return this._index;
  }

  /**
   * Check if the device is initialized.
   * 
   * @returns True if the device is initialized.
   */
  public isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * Set whether the device is initialized.
   * 
   * @param initialized Whether the device is initialized.
   */
  public setInitialized(initialized: boolean): void {
    if (this._initialized !== initialized) {
      this._initialized = initialized;
      this.emit('initialized', initialized);
    }
  }

  /**
   * Reset the device to its default state.
   */
  public abstract reset(): void;
}
