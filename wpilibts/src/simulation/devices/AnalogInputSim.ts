/**
 * Analog Input simulation class.
 */
import { SimDeviceBase } from './SimDeviceBase';

/**
 * Analog Input simulation class.
 */
export class AnalogInputSim extends SimDeviceBase {
  private _voltage: number = 0;
  private _accumulatorValue: bigint = 0n;
  private _accumulatorCount: bigint = 0n;
  private _accumulatorCenter: number = 0;
  private _accumulatorDeadband: number = 0;
  private _accumulatorInitialized: boolean = false;

  /**
   * Constructor.
   * 
   * @param channel The analog input channel.
   */
  constructor(channel: number) {
    super(channel);
  }

  /**
   * Get the voltage of the analog input.
   * 
   * @returns The voltage of the analog input.
   */
  public getVoltage(): number {
    return this._voltage;
  }

  /**
   * Set the voltage of the analog input.
   * 
   * @param voltage The voltage to set.
   */
  public setVoltage(voltage: number): void {
    if (this._voltage !== voltage) {
      this._voltage = voltage;
      this.emit('voltageChanged', voltage);

      // Update accumulator if initialized
      if (this._accumulatorInitialized) {
        const value = Math.round(voltage - this._accumulatorCenter);
        if (Math.abs(value) > this._accumulatorDeadband) {
          this._accumulatorValue += BigInt(value);
          this._accumulatorCount += 1n;
        }
      }
    }
  }

  /**
   * Get the accumulator value.
   * 
   * @returns The accumulator value.
   */
  public getAccumulatorValue(): bigint {
    return this._accumulatorValue;
  }

  /**
   * Set the accumulator value.
   * 
   * @param value The accumulator value to set.
   */
  public setAccumulatorValue(value: bigint): void {
    if (this._accumulatorValue !== value) {
      this._accumulatorValue = value;
      this.emit('accumulatorValueChanged', value);
    }
  }

  /**
   * Get the accumulator count.
   * 
   * @returns The accumulator count.
   */
  public getAccumulatorCount(): bigint {
    return this._accumulatorCount;
  }

  /**
   * Set the accumulator count.
   * 
   * @param count The accumulator count to set.
   */
  public setAccumulatorCount(count: bigint): void {
    if (this._accumulatorCount !== count) {
      this._accumulatorCount = count;
      this.emit('accumulatorCountChanged', count);
    }
  }

  /**
   * Get the accumulator center value.
   * 
   * @returns The accumulator center value.
   */
  public getAccumulatorCenter(): number {
    return this._accumulatorCenter;
  }

  /**
   * Set the accumulator center value.
   * 
   * @param center The accumulator center value to set.
   */
  public setAccumulatorCenter(center: number): void {
    if (this._accumulatorCenter !== center) {
      this._accumulatorCenter = center;
      this.emit('accumulatorCenterChanged', center);
    }
  }

  /**
   * Get the accumulator deadband.
   * 
   * @returns The accumulator deadband.
   */
  public getAccumulatorDeadband(): number {
    return this._accumulatorDeadband;
  }

  /**
   * Set the accumulator deadband.
   * 
   * @param deadband The accumulator deadband to set.
   */
  public setAccumulatorDeadband(deadband: number): void {
    if (this._accumulatorDeadband !== deadband) {
      this._accumulatorDeadband = deadband;
      this.emit('accumulatorDeadbandChanged', deadband);
    }
  }

  /**
   * Check if the accumulator is initialized.
   * 
   * @returns True if the accumulator is initialized.
   */
  public isAccumulatorInitialized(): boolean {
    return this._accumulatorInitialized;
  }

  /**
   * Set whether the accumulator is initialized.
   * 
   * @param initialized Whether the accumulator is initialized.
   */
  public setAccumulatorInitialized(initialized: boolean): void {
    if (this._accumulatorInitialized !== initialized) {
      this._accumulatorInitialized = initialized;
      this.emit('accumulatorInitializedChanged', initialized);
    }
  }

  /**
   * Reset the accumulator.
   */
  public resetAccumulator(): void {
    this._accumulatorValue = 0n;
    this._accumulatorCount = 0n;
    this.emit('accumulatorReset');
  }

  /**
   * Reset the analog input to its default state.
   */
  public reset(): void {
    this._initialized = false;
    this._voltage = 0;
    this._accumulatorValue = 0n;
    this._accumulatorCount = 0n;
    this._accumulatorCenter = 0;
    this._accumulatorDeadband = 0;
    this._accumulatorInitialized = false;
    this.emit('reset');
  }
}
