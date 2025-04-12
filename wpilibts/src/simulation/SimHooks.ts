/**
 * Simulation hooks for the HAL.
 */

import { EventEmitter } from 'events';

/**
 * Runtime type for the HAL.
 */
export enum RuntimeType {
  /**
   * Running in simulation.
   */
  Simulation = 0,
  /**
   * Running in real-time.
   */
  RealTime = 1
}

/**
 * Simulation hooks for the HAL.
 */
export class SimHooks extends EventEmitter {
  private static instance: SimHooks;

  private _programStarted: boolean = false;
  private _timingPaused: boolean = false;
  private _simulationTime: bigint = 0n;
  private _lastTimeUpdate: bigint = 0n;
  private _runtimeType: RuntimeType = RuntimeType.Simulation;

  /**
   * Get the singleton instance of the SimHooks.
   */
  public static getInstance(): SimHooks {
    if (!SimHooks.instance) {
      SimHooks.instance = new SimHooks();
    }
    return SimHooks.instance;
  }

  private constructor() {
    super();
    this._lastTimeUpdate = BigInt(Date.now() * 1000); // Convert to microseconds
  }

  /**
   * Set the HAL runtime type.
   * 
   * @param type The runtime type to set.
   */
  public setRuntimeType(type: RuntimeType): void {
    this._runtimeType = type;
    this.emit('runtimeTypeChanged', type);
  }

  /**
   * Get the HAL runtime type.
   * 
   * @returns The current runtime type.
   */
  public getRuntimeType(): RuntimeType {
    return this._runtimeType;
  }

  /**
   * Wait for the program to start.
   */
  public waitForProgramStart(): void {
    if (this._programStarted) {
      return;
    }

    // In a real implementation, this would block until the program starts
    // For now, we'll just emit an event that can be listened to
    this.emit('waitingForProgramStart');
  }

  /**
   * Set that the program has started.
   */
  public setProgramStarted(): void {
    this._programStarted = true;
    this.emit('programStarted');
  }

  /**
   * Get whether the program has started.
   * 
   * @returns True if the program has started.
   */
  public getProgramStarted(): boolean {
    return this._programStarted;
  }

  /**
   * Restart the simulation timing.
   */
  public restartTiming(): void {
    this._simulationTime = 0n;
    this._lastTimeUpdate = BigInt(Date.now() * 1000); // Convert to microseconds
    this.emit('timingRestarted');
  }

  /**
   * Pause the simulation timing.
   */
  public pauseTiming(): void {
    if (this._timingPaused) {
      return;
    }

    this._timingPaused = true;
    this.emit('timingPaused');
  }

  /**
   * Resume the simulation timing.
   */
  public resumeTiming(): void {
    if (!this._timingPaused) {
      return;
    }

    this._timingPaused = false;
    this._lastTimeUpdate = BigInt(Date.now() * 1000); // Convert to microseconds
    this.emit('timingResumed');
  }

  /**
   * Check if the simulation timing is paused.
   * 
   * @returns True if the simulation timing is paused.
   */
  public isTimingPaused(): boolean {
    return this._timingPaused;
  }

  /**
   * Step the simulation timing by a specified amount.
   * 
   * @param delta The amount to step in microseconds.
   */
  public stepTiming(delta: number | bigint): void {
    if (!this._timingPaused) {
      this.pauseTiming();
    }
    
    // Convert delta to bigint if it's a number
    const deltaBigInt = typeof delta === 'number' ? BigInt(delta) : delta;
    
    // Add the delta to the simulation time
    this._simulationTime += deltaBigInt;
    this.emit('timingStepped', deltaBigInt);
  }

  /**
   * Get the current FPGA timestamp in seconds.
   * 
   * @returns The current FPGA timestamp in seconds.
   */
  public getFPGATimestamp(): number {
    return Number(this.getFPGATime()) / 1.0e6;
  }

  /**
   * Get the current FPGA time in microseconds.
   * 
   * @returns The current FPGA time in microseconds.
   */
  public getFPGATime(): bigint {
    if (this._timingPaused) {
      return this._simulationTime;
    }
    
    const currentTime = BigInt(Date.now() * 1000); // Convert to microseconds
    const delta = currentTime - this._lastTimeUpdate;
    this._lastTimeUpdate = currentTime;
    this._simulationTime += delta;
    
    return this._simulationTime;
  }
}

// Export singleton instance
export const simHooks = SimHooks.getInstance();
