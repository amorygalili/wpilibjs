/**
 * Encoder simulation implementation
 */

import { HAL_Bool, HAL_MakeBoolean, HAL_MakeDouble, HAL_MakeInt, HAL_NotifyCallback } from '../HALTypes';
import { SimDataValue } from '../utils/SimDataValue';

/**
 * Encoder simulation device
 */
export class EncoderSim {
  private readonly index: number;
  private readonly initialized: SimDataValue<HAL_Bool>;
  private readonly count: SimDataValue<number>;
  private readonly period: SimDataValue<number>;
  private readonly reset: SimDataValue<HAL_Bool>;
  private readonly maxPeriod: SimDataValue<number>;
  private readonly direction: SimDataValue<HAL_Bool>;
  private readonly reverseDirection: SimDataValue<HAL_Bool>;
  private readonly samplesToAverage: SimDataValue<number>;
  private digitalChannelA: number;
  private digitalChannelB: number;

  /**
   * Create a new Encoder simulation device
   * @param index Encoder index
   * @param channelA Digital channel A
   * @param channelB Digital channel B
   */
  constructor(index: number, channelA: number = 0, channelB: number = 1) {
    this.index = index;
    this.digitalChannelA = channelA;
    this.digitalChannelB = channelB;
    this.initialized = new SimDataValue<HAL_Bool>('Initialized', false, HAL_MakeBoolean);
    this.count = new SimDataValue<number>('Count', 0, HAL_MakeInt);
    this.period = new SimDataValue<number>('Period', Number.MAX_VALUE, HAL_MakeDouble);
    this.reset = new SimDataValue<HAL_Bool>('Reset', false, HAL_MakeBoolean);
    this.maxPeriod = new SimDataValue<number>('MaxPeriod', 0, HAL_MakeDouble);
    this.direction = new SimDataValue<HAL_Bool>('Direction', false, HAL_MakeBoolean);
    this.reverseDirection = new SimDataValue<HAL_Bool>('ReverseDirection', false, HAL_MakeBoolean);
    this.samplesToAverage = new SimDataValue<number>('SamplesToAverage', 0, HAL_MakeInt);
  }

  /**
   * Get the encoder index
   * @returns Encoder index
   */
  getIndex(): number {
    return this.index;
  }

  /**
   * Get the digital channel A
   * @returns Digital channel A
   */
  getDigitalChannelA(): number {
    return this.digitalChannelA;
  }

  /**
   * Set the digital channel A
   * @param channelA New digital channel A
   */
  setDigitalChannelA(channelA: number): void {
    this.digitalChannelA = channelA;
  }

  /**
   * Get the digital channel B
   * @returns Digital channel B
   */
  getDigitalChannelB(): number {
    return this.digitalChannelB;
  }

  /**
   * Set the digital channel B
   * @param channelB New digital channel B
   */
  setDigitalChannelB(channelB: number): void {
    this.digitalChannelB = channelB;
  }

  /**
   * Get whether the encoder is initialized
   * @returns Initialization state
   */
  getInitialized(): boolean {
    return this.initialized.get();
  }

  /**
   * Set whether the encoder is initialized
   * @param initialized New initialization state
   */
  setInitialized(initialized: boolean): void {
    this.initialized.set(initialized);
  }

  /**
   * Get the count
   * @returns Count
   */
  getCount(): number {
    return this.count.get();
  }

  /**
   * Set the count
   * @param count New count
   */
  setCount(count: number): void {
    this.count.set(count);
  }

  /**
   * Get the period
   * @returns Period
   */
  getPeriod(): number {
    return this.period.get();
  }

  /**
   * Set the period
   * @param period New period
   */
  setPeriod(period: number): void {
    this.period.set(period);
  }

  /**
   * Get the reset state
   * @returns Reset state
   */
  getReset(): boolean {
    return this.reset.get();
  }

  /**
   * Set the reset state
   * @param reset New reset state
   */
  setReset(reset: boolean): void {
    this.reset.set(reset);
  }

  /**
   * Get the max period
   * @returns Max period
   */
  getMaxPeriod(): number {
    return this.maxPeriod.get();
  }

  /**
   * Set the max period
   * @param maxPeriod New max period
   */
  setMaxPeriod(maxPeriod: number): void {
    this.maxPeriod.set(maxPeriod);
  }

  /**
   * Get the direction
   * @returns Direction
   */
  getDirection(): boolean {
    return this.direction.get();
  }

  /**
   * Set the direction
   * @param direction New direction
   */
  setDirection(direction: boolean): void {
    this.direction.set(direction);
  }

  /**
   * Get the reverse direction state
   * @returns Reverse direction state
   */
  getReverseDirection(): boolean {
    return this.reverseDirection.get();
  }

  /**
   * Set the reverse direction state
   * @param reverseDirection New reverse direction state
   */
  setReverseDirection(reverseDirection: boolean): void {
    this.reverseDirection.set(reverseDirection);
  }

  /**
   * Get the samples to average
   * @returns Samples to average
   */
  getSamplesToAverage(): number {
    return this.samplesToAverage.get();
  }

  /**
   * Set the samples to average
   * @param samplesToAverage New samples to average
   */
  setSamplesToAverage(samplesToAverage: number): void {
    this.samplesToAverage.set(samplesToAverage);
  }

  /**
   * Register a callback for count changes
   * @param callback Callback function
   * @param param Parameter to pass to callback
   * @param initialNotify Whether to call the callback immediately with the current value
   * @returns UID for the callback
   */
  registerCountCallback(callback: HAL_NotifyCallback, param: any, initialNotify: boolean): number {
    return this.count.registerCallback(callback, param, initialNotify);
  }

  /**
   * Cancel a count callback
   * @param uid UID of the callback to cancel
   */
  cancelCountCallback(uid: number): void {
    this.count.cancelCallback(uid);
  }

  /**
   * Register a callback for period changes
   * @param callback Callback function
   * @param param Parameter to pass to callback
   * @param initialNotify Whether to call the callback immediately with the current value
   * @returns UID for the callback
   */
  registerPeriodCallback(callback: HAL_NotifyCallback, param: any, initialNotify: boolean): number {
    return this.period.registerCallback(callback, param, initialNotify);
  }

  /**
   * Cancel a period callback
   * @param uid UID of the callback to cancel
   */
  cancelPeriodCallback(uid: number): void {
    this.period.cancelCallback(uid);
  }

  /**
   * Reset all values to defaults
   */
  resetData(): void {
    this.initialized.reset(false);
    this.count.reset(0);
    this.period.reset(Number.MAX_VALUE);
    this.reset.reset(false);
    this.maxPeriod.reset(0);
    this.direction.reset(false);
    this.reverseDirection.reset(false);
    this.samplesToAverage.reset(0);
  }
}
