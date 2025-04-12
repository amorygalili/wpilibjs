/**
 * Encoder simulation class.
 */
import { SimDeviceBase } from './SimDeviceBase';

/**
 * Encoder simulation class.
 */
export class EncoderSim extends SimDeviceBase {
  private _count: number = 0;
  private _period: number = 0;
  private _reset: boolean = false;
  private _maxPeriod: number = 0;
  private _direction: boolean = false;
  private _reverseDirection: boolean = false;
  private _samplesToAverage: number = 0;
  private _distancePerPulse: number = 0;

  /**
   * Constructor.
   * 
   * @param index The encoder index.
   */
  constructor(index: number) {
    super(index);
  }

  /**
   * Get the count of the encoder.
   * 
   * @returns The count of the encoder.
   */
  public getCount(): number {
    return this._count;
  }

  /**
   * Set the count of the encoder.
   * 
   * @param count The count to set.
   */
  public setCount(count: number): void {
    if (this._count !== count) {
      this._count = count;
      this.emit('countChanged', count);
    }
  }

  /**
   * Get the period of the encoder.
   * 
   * @returns The period of the encoder.
   */
  public getPeriod(): number {
    return this._period;
  }

  /**
   * Set the period of the encoder.
   * 
   * @param period The period to set.
   */
  public setPeriod(period: number): void {
    if (this._period !== period) {
      this._period = period;
      this.emit('periodChanged', period);
    }
  }

  /**
   * Get the reset state of the encoder.
   * 
   * @returns The reset state of the encoder.
   */
  public getReset(): boolean {
    return this._reset;
  }

  /**
   * Set the reset state of the encoder.
   * 
   * @param reset The reset state to set.
   */
  public setReset(reset: boolean): void {
    if (this._reset !== reset) {
      this._reset = reset;
      this.emit('resetChanged', reset);
    }
  }

  /**
   * Get the max period of the encoder.
   * 
   * @returns The max period of the encoder.
   */
  public getMaxPeriod(): number {
    return this._maxPeriod;
  }

  /**
   * Set the max period of the encoder.
   * 
   * @param maxPeriod The max period to set.
   */
  public setMaxPeriod(maxPeriod: number): void {
    if (this._maxPeriod !== maxPeriod) {
      this._maxPeriod = maxPeriod;
      this.emit('maxPeriodChanged', maxPeriod);
    }
  }

  /**
   * Get the direction of the encoder.
   * 
   * @returns The direction of the encoder.
   */
  public getDirection(): boolean {
    return this._direction;
  }

  /**
   * Set the direction of the encoder.
   * 
   * @param direction The direction to set.
   */
  public setDirection(direction: boolean): void {
    if (this._direction !== direction) {
      this._direction = direction;
      this.emit('directionChanged', direction);
    }
  }

  /**
   * Get the reverse direction of the encoder.
   * 
   * @returns The reverse direction of the encoder.
   */
  public getReverseDirection(): boolean {
    return this._reverseDirection;
  }

  /**
   * Set the reverse direction of the encoder.
   * 
   * @param reverseDirection The reverse direction to set.
   */
  public setReverseDirection(reverseDirection: boolean): void {
    if (this._reverseDirection !== reverseDirection) {
      this._reverseDirection = reverseDirection;
      this.emit('reverseDirectionChanged', reverseDirection);
    }
  }

  /**
   * Get the samples to average of the encoder.
   * 
   * @returns The samples to average of the encoder.
   */
  public getSamplesToAverage(): number {
    return this._samplesToAverage;
  }

  /**
   * Set the samples to average of the encoder.
   * 
   * @param samplesToAverage The samples to average to set.
   */
  public setSamplesToAverage(samplesToAverage: number): void {
    if (this._samplesToAverage !== samplesToAverage) {
      this._samplesToAverage = samplesToAverage;
      this.emit('samplesToAverageChanged', samplesToAverage);
    }
  }

  /**
   * Get the distance per pulse of the encoder.
   * 
   * @returns The distance per pulse of the encoder.
   */
  public getDistancePerPulse(): number {
    return this._distancePerPulse;
  }

  /**
   * Set the distance per pulse of the encoder.
   * 
   * @param distancePerPulse The distance per pulse to set.
   */
  public setDistancePerPulse(distancePerPulse: number): void {
    if (this._distancePerPulse !== distancePerPulse) {
      this._distancePerPulse = distancePerPulse;
      this.emit('distancePerPulseChanged', distancePerPulse);
    }
  }

  /**
   * Reset the encoder to its default state.
   */
  public reset(): void {
    this._initialized = false;
    this._count = 0;
    this._period = 0;
    this._reset = false;
    this._maxPeriod = 0;
    this._direction = false;
    this._reverseDirection = false;
    this._samplesToAverage = 0;
    this._distancePerPulse = 0;
    this.emit('reset');
  }
}
