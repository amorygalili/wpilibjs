/**
 * Digital Input simulation implementation
 */

import { HAL_Bool, HAL_MakeBoolean, HAL_MakeDouble, HAL_MakeInt, HAL_NotifyCallback } from '../HALTypes';
import { SimDataValue } from '../utils/SimDataValue';

/**
 * Digital Input simulation device
 */
export class DigitalInputSim {
  private readonly channel: number;
  private readonly initialized: SimDataValue<HAL_Bool>;
  private readonly value: SimDataValue<HAL_Bool>;
  private readonly pulseLength: SimDataValue<number>;
  private readonly isInput: SimDataValue<HAL_Bool>;
  private readonly filterIndex: SimDataValue<number>;

  /**
   * Create a new Digital Input simulation device
   * @param channel DIO channel
   */
  constructor(channel: number) {
    this.channel = channel;
    this.initialized = new SimDataValue<HAL_Bool>('Initialized', false, HAL_MakeBoolean);
    this.value = new SimDataValue<HAL_Bool>('Value', true, HAL_MakeBoolean);
    this.pulseLength = new SimDataValue<number>('PulseLength', 0.0, HAL_MakeDouble);
    this.isInput = new SimDataValue<HAL_Bool>('IsInput', true, HAL_MakeBoolean);
    this.filterIndex = new SimDataValue<number>('FilterIndex', -1, HAL_MakeInt);
  }

  /**
   * Get the channel number
   * @returns Channel number
   */
  getChannel(): number {
    return this.channel;
  }

  /**
   * Get whether the digital input is initialized
   * @returns Initialization state
   */
  getInitialized(): boolean {
    return this.initialized.get();
  }

  /**
   * Set whether the digital input is initialized
   * @param initialized New initialization state
   */
  setInitialized(initialized: boolean): void {
    this.initialized.set(initialized);
  }

  /**
   * Get the current value
   * @returns Current value
   */
  getValue(): boolean {
    return this.value.get();
  }

  /**
   * Set the current value
   * @param value New value
   */
  setValue(value: boolean): void {
    this.value.set(value);
  }

  /**
   * Get the pulse length
   * @returns Pulse length in seconds
   */
  getPulseLength(): number {
    return this.pulseLength.get();
  }

  /**
   * Set the pulse length
   * @param pulseLength New pulse length in seconds
   */
  setPulseLength(pulseLength: number): void {
    this.pulseLength.set(pulseLength);
  }

  /**
   * Get whether this is configured as an input
   * @returns True if configured as input
   */
  getIsInput(): boolean {
    return this.isInput.get();
  }

  /**
   * Set whether this is configured as an input
   * @param isInput True to configure as input
   */
  setIsInput(isInput: boolean): void {
    this.isInput.set(isInput);
  }

  /**
   * Get the filter index
   * @returns Filter index
   */
  getFilterIndex(): number {
    return this.filterIndex.get();
  }

  /**
   * Set the filter index
   * @param filterIndex New filter index
   */
  setFilterIndex(filterIndex: number): void {
    this.filterIndex.set(filterIndex);
  }

  /**
   * Register a callback for value changes
   * @param callback Callback function
   * @param param Parameter to pass to callback
   * @param initialNotify Whether to call the callback immediately with the current value
   * @returns UID for the callback
   */
  registerValueCallback(callback: HAL_NotifyCallback, param: any, initialNotify: boolean): number {
    return this.value.registerCallback(callback, param, initialNotify);
  }

  /**
   * Cancel a value callback
   * @param uid UID of the callback to cancel
   */
  cancelValueCallback(uid: number): void {
    this.value.cancelCallback(uid);
  }

  /**
   * Reset all values to defaults
   */
  resetData(): void {
    this.initialized.reset(false);
    this.value.reset(true);
    this.pulseLength.reset(0.0);
    this.isInput.reset(true);
    this.filterIndex.reset(-1);
  }
}
