/**
 * PWM simulation class.
 */
import { SimDeviceBase } from './SimDeviceBase';

/**
 * PWM simulation class.
 */
export class PWMSim extends SimDeviceBase {
  private _speed: number = 0;
  private _position: number = 0;
  private _rawValue: number = 0;
  private _periodScale: number = 0;
  private _zeroLatch: boolean = false;

  /**
   * Constructor.
   * 
   * @param channel The PWM channel.
   */
  constructor(channel: number) {
    super(channel);
  }

  /**
   * Get the speed of the PWM.
   * 
   * @returns The speed of the PWM.
   */
  public getSpeed(): number {
    return this._speed;
  }

  /**
   * Set the speed of the PWM.
   * 
   * @param speed The speed to set.
   */
  public setSpeed(speed: number): void {
    if (this._speed !== speed) {
      this._speed = speed;
      this.emit('speedChanged', speed);
    }
  }

  /**
   * Get the position of the PWM.
   * 
   * @returns The position of the PWM.
   */
  public getPosition(): number {
    return this._position;
  }

  /**
   * Set the position of the PWM.
   * 
   * @param position The position to set.
   */
  public setPosition(position: number): void {
    if (this._position !== position) {
      this._position = position;
      this.emit('positionChanged', position);
    }
  }

  /**
   * Get the raw value of the PWM.
   * 
   * @returns The raw value of the PWM.
   */
  public getRawValue(): number {
    return this._rawValue;
  }

  /**
   * Set the raw value of the PWM.
   * 
   * @param rawValue The raw value to set.
   */
  public setRawValue(rawValue: number): void {
    if (this._rawValue !== rawValue) {
      this._rawValue = rawValue;
      this.emit('rawValueChanged', rawValue);
    }
  }

  /**
   * Get the period scale of the PWM.
   * 
   * @returns The period scale of the PWM.
   */
  public getPeriodScale(): number {
    return this._periodScale;
  }

  /**
   * Set the period scale of the PWM.
   * 
   * @param periodScale The period scale to set.
   */
  public setPeriodScale(periodScale: number): void {
    if (this._periodScale !== periodScale) {
      this._periodScale = periodScale;
      this.emit('periodScaleChanged', periodScale);
    }
  }

  /**
   * Get the zero latch of the PWM.
   * 
   * @returns The zero latch of the PWM.
   */
  public getZeroLatch(): boolean {
    return this._zeroLatch;
  }

  /**
   * Set the zero latch of the PWM.
   * 
   * @param zeroLatch The zero latch to set.
   */
  public setZeroLatch(zeroLatch: boolean): void {
    if (this._zeroLatch !== zeroLatch) {
      this._zeroLatch = zeroLatch;
      this.emit('zeroLatchChanged', zeroLatch);
    }
  }

  /**
   * Reset the PWM to its default state.
   */
  public reset(): void {
    this._initialized = false;
    this._speed = 0;
    this._position = 0;
    this._rawValue = 0;
    this._periodScale = 0;
    this._zeroLatch = false;
    this.emit('reset');
  }
}
