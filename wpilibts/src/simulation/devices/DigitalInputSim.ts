/**
 * Digital Input simulation class.
 */
import { SimDeviceBase } from './SimDeviceBase';

/**
 * Digital Input simulation class.
 */
export class DigitalInputSim extends SimDeviceBase {
  private _value: boolean = false;

  /**
   * Constructor.
   * 
   * @param channel The DIO channel.
   */
  constructor(channel: number) {
    super(channel);
  }

  /**
   * Get the value of the digital input.
   * 
   * @returns The value of the digital input.
   */
  public getValue(): boolean {
    return this._value;
  }

  /**
   * Set the value of the digital input.
   * 
   * @param value The value to set.
   */
  public setValue(value: boolean): void {
    if (this._value !== value) {
      this._value = value;
      this.emit('valueChanged', value);
    }
  }

  /**
   * Reset the digital input to its default state.
   */
  public reset(): void {
    this._initialized = false;
    this._value = false;
    this.emit('reset');
  }
}
