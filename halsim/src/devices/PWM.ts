/**
 * PWM simulation implementation
 */

import { HAL_Bool, HAL_MakeBoolean, HAL_MakeDouble, HAL_MakeInt, HAL_NotifyCallback } from '../HALTypes';
import { SimDataValue } from '../utils/SimDataValue';

/**
 * PWM simulation device
 */
export class PWMSim {
  private readonly channel: number;
  private readonly initialized: SimDataValue<HAL_Bool>;
  private readonly pulseMicrosecond: SimDataValue<number>;
  private readonly speed: SimDataValue<number>;
  private readonly position: SimDataValue<number>;
  private readonly periodScale: SimDataValue<number>;
  private readonly zeroLatch: SimDataValue<HAL_Bool>;

  /**
   * Create a new PWM simulation device
   * @param channel PWM channel
   */
  constructor(channel: number) {
    this.channel = channel;
    this.initialized = new SimDataValue<HAL_Bool>('Initialized', false, HAL_MakeBoolean);
    this.pulseMicrosecond = new SimDataValue<number>('PulseMicrosecond', 0, HAL_MakeInt);
    this.speed = new SimDataValue<number>('Speed', 0, HAL_MakeDouble);
    this.position = new SimDataValue<number>('Position', 0, HAL_MakeDouble);
    this.periodScale = new SimDataValue<number>('PeriodScale', 0, HAL_MakeInt);
    this.zeroLatch = new SimDataValue<HAL_Bool>('ZeroLatch', false, HAL_MakeBoolean);
  }

  /**
   * Get the channel number
   * @returns Channel number
   */
  getChannel(): number {
    return this.channel;
  }

  /**
   * Get whether the PWM is initialized
   * @returns Initialization state
   */
  getInitialized(): boolean {
    return this.initialized.get();
  }

  /**
   * Set whether the PWM is initialized
   * @param initialized New initialization state
   */
  setInitialized(initialized: boolean): void {
    this.initialized.set(initialized);
  }

  /**
   * Get the pulse width in microseconds
   * @returns Pulse width in microseconds
   */
  getPulseMicrosecond(): number {
    return this.pulseMicrosecond.get();
  }

  /**
   * Set the pulse width in microseconds
   * @param pulseMicrosecond New pulse width in microseconds
   */
  setPulseMicrosecond(pulseMicrosecond: number): void {
    this.pulseMicrosecond.set(pulseMicrosecond);
  }

  /**
   * Get the speed value (-1.0 to 1.0)
   * @returns Speed value
   */
  getSpeed(): number {
    return this.speed.get();
  }

  /**
   * Set the speed value (-1.0 to 1.0)
   * @param speed New speed value
   */
  setSpeed(speed: number): void {
    this.speed.set(speed);
  }

  /**
   * Get the position value (0.0 to 1.0)
   * @returns Position value
   */
  getPosition(): number {
    return this.position.get();
  }

  /**
   * Set the position value (0.0 to 1.0)
   * @param position New position value
   */
  setPosition(position: number): void {
    this.position.set(position);
  }

  /**
   * Get the period scale
   * @returns Period scale
   */
  getPeriodScale(): number {
    return this.periodScale.get();
  }

  /**
   * Set the period scale
   * @param periodScale New period scale
   */
  setPeriodScale(periodScale: number): void {
    this.periodScale.set(periodScale);
  }

  /**
   * Get the zero latch state
   * @returns Zero latch state
   */
  getZeroLatch(): boolean {
    return this.zeroLatch.get();
  }

  /**
   * Set the zero latch state
   * @param zeroLatch New zero latch state
   */
  setZeroLatch(zeroLatch: boolean): void {
    this.zeroLatch.set(zeroLatch);
  }

  /**
   * Register a callback for speed changes
   * @param callback Callback function
   * @param param Parameter to pass to callback
   * @param initialNotify Whether to call the callback immediately with the current value
   * @returns UID for the callback
   */
  registerSpeedCallback(callback: HAL_NotifyCallback, param: any, initialNotify: boolean): number {
    return this.speed.registerCallback(callback, param, initialNotify);
  }

  /**
   * Cancel a speed callback
   * @param uid UID of the callback to cancel
   */
  cancelSpeedCallback(uid: number): void {
    this.speed.cancelCallback(uid);
  }

  /**
   * Register a callback for position changes
   * @param callback Callback function
   * @param param Parameter to pass to callback
   * @param initialNotify Whether to call the callback immediately with the current value
   * @returns UID for the callback
   */
  registerPositionCallback(callback: HAL_NotifyCallback, param: any, initialNotify: boolean): number {
    return this.position.registerCallback(callback, param, initialNotify);
  }

  /**
   * Cancel a position callback
   * @param uid UID of the callback to cancel
   */
  cancelPositionCallback(uid: number): void {
    this.position.cancelCallback(uid);
  }

  /**
   * Reset all values to defaults
   */
  resetData(): void {
    this.initialized.reset(false);
    this.pulseMicrosecond.reset(0);
    this.speed.reset(0);
    this.position.reset(0);
    this.periodScale.reset(0);
    this.zeroLatch.reset(false);
  }
}
