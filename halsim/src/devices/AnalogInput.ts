/**
 * Analog Input simulation implementation
 */

import { HAL_Bool, HAL_MakeBoolean, HAL_MakeDouble, HAL_MakeInt, HAL_NotifyCallback } from '../HALTypes';
import { SimDataValue } from '../utils/SimDataValue';

/**
 * Analog Input simulation device
 */
export class AnalogInputSim {
  private readonly channel: number;
  private readonly initialized: SimDataValue<HAL_Bool>;
  private readonly voltage: SimDataValue<number>;
  private readonly accumulatorValue: SimDataValue<number>;
  private readonly accumulatorCount: SimDataValue<number>;
  private readonly accumulatorCenter: SimDataValue<number>;
  private readonly accumulatorDeadband: SimDataValue<number>;
  private readonly accumulatorInitialized: SimDataValue<HAL_Bool>;
  private readonly averageBits: SimDataValue<number>;
  private readonly oversampleBits: SimDataValue<number>;

  /**
   * Create a new Analog Input simulation device
   * @param channel Analog Input channel
   */
  constructor(channel: number) {
    this.channel = channel;
    this.initialized = new SimDataValue<HAL_Bool>('Initialized', false, HAL_MakeBoolean);
    this.voltage = new SimDataValue<number>('Voltage', 0.0, HAL_MakeDouble);
    this.accumulatorValue = new SimDataValue<number>('AccumulatorValue', 0, HAL_MakeDouble);
    this.accumulatorCount = new SimDataValue<number>('AccumulatorCount', 0, HAL_MakeInt);
    this.accumulatorCenter = new SimDataValue<number>('AccumulatorCenter', 0, HAL_MakeInt);
    this.accumulatorDeadband = new SimDataValue<number>('AccumulatorDeadband', 0, HAL_MakeInt);
    this.accumulatorInitialized = new SimDataValue<HAL_Bool>('AccumulatorInitialized', false, HAL_MakeBoolean);
    this.averageBits = new SimDataValue<number>('AverageBits', 0, HAL_MakeInt);
    this.oversampleBits = new SimDataValue<number>('OversampleBits', 0, HAL_MakeInt);
  }

  /**
   * Get the channel number
   * @returns Channel number
   */
  getChannel(): number {
    return this.channel;
  }

  /**
   * Get whether the analog input is initialized
   * @returns Initialization state
   */
  getInitialized(): boolean {
    return this.initialized.get();
  }

  /**
   * Set whether the analog input is initialized
   * @param initialized New initialization state
   */
  setInitialized(initialized: boolean): void {
    this.initialized.set(initialized);
  }

  /**
   * Get the voltage
   * @returns Voltage
   */
  getVoltage(): number {
    return this.voltage.get();
  }

  /**
   * Set the voltage
   * @param voltage New voltage
   */
  setVoltage(voltage: number): void {
    this.voltage.set(voltage);
  }

  /**
   * Get the accumulator value
   * @returns Accumulator value
   */
  getAccumulatorValue(): number {
    return this.accumulatorValue.get();
  }

  /**
   * Set the accumulator value
   * @param value New accumulator value
   */
  setAccumulatorValue(value: number): void {
    this.accumulatorValue.set(value);
  }

  /**
   * Get the accumulator count
   * @returns Accumulator count
   */
  getAccumulatorCount(): number {
    return this.accumulatorCount.get();
  }

  /**
   * Set the accumulator count
   * @param count New accumulator count
   */
  setAccumulatorCount(count: number): void {
    this.accumulatorCount.set(count);
  }

  /**
   * Get the accumulator center
   * @returns Accumulator center
   */
  getAccumulatorCenter(): number {
    return this.accumulatorCenter.get();
  }

  /**
   * Set the accumulator center
   * @param center New accumulator center
   */
  setAccumulatorCenter(center: number): void {
    this.accumulatorCenter.set(center);
  }

  /**
   * Get the accumulator deadband
   * @returns Accumulator deadband
   */
  getAccumulatorDeadband(): number {
    return this.accumulatorDeadband.get();
  }

  /**
   * Set the accumulator deadband
   * @param deadband New accumulator deadband
   */
  setAccumulatorDeadband(deadband: number): void {
    this.accumulatorDeadband.set(deadband);
  }

  /**
   * Get whether the accumulator is initialized
   * @returns Accumulator initialization state
   */
  getAccumulatorInitialized(): boolean {
    return this.accumulatorInitialized.get();
  }

  /**
   * Set whether the accumulator is initialized
   * @param initialized New accumulator initialization state
   */
  setAccumulatorInitialized(initialized: boolean): void {
    this.accumulatorInitialized.set(initialized);
  }

  /**
   * Get the average bits
   * @returns Average bits
   */
  getAverageBits(): number {
    return this.averageBits.get();
  }

  /**
   * Set the average bits
   * @param averageBits New average bits
   */
  setAverageBits(averageBits: number): void {
    this.averageBits.set(averageBits);
  }

  /**
   * Get the oversample bits
   * @returns Oversample bits
   */
  getOversampleBits(): number {
    return this.oversampleBits.get();
  }

  /**
   * Set the oversample bits
   * @param oversampleBits New oversample bits
   */
  setOversampleBits(oversampleBits: number): void {
    this.oversampleBits.set(oversampleBits);
  }

  /**
   * Register a callback for voltage changes
   * @param callback Callback function
   * @param param Parameter to pass to callback
   * @param initialNotify Whether to call the callback immediately with the current value
   * @returns UID for the callback
   */
  registerVoltageCallback(callback: HAL_NotifyCallback, param: any, initialNotify: boolean): number {
    return this.voltage.registerCallback(callback, param, initialNotify);
  }

  /**
   * Cancel a voltage callback
   * @param uid UID of the callback to cancel
   */
  cancelVoltageCallback(uid: number): void {
    this.voltage.cancelCallback(uid);
  }

  /**
   * Reset all values to defaults
   */
  resetData(): void {
    this.initialized.reset(false);
    this.voltage.reset(0.0);
    this.accumulatorValue.reset(0);
    this.accumulatorCount.reset(0);
    this.accumulatorCenter.reset(0);
    this.accumulatorDeadband.reset(0);
    this.accumulatorInitialized.reset(false);
    this.averageBits.reset(0);
    this.oversampleBits.reset(0);
  }
}
