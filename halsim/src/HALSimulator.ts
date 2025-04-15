/**
 * Main HAL simulator class
 */

import { HAL_RuntimeType } from './HALTypes';
import { AnalogInputSim, DigitalInputSim, EncoderSim, PWMSim } from './devices';

/**
 * HAL Simulator class
 */
export class HALSimulator {
  private runtimeType: HAL_RuntimeType = HAL_RuntimeType.Simulation;
  private programStarted: boolean = false;
  private timingPaused: boolean = false;
  
  // Device storage
  private digitalInputs: Map<number, DigitalInputSim> = new Map();
  private pwms: Map<number, PWMSim> = new Map();
  private analogInputs: Map<number, AnalogInputSim> = new Map();
  private encoders: Map<number, EncoderSim> = new Map();

  /**
   * Create a new HAL simulator
   */
  constructor() {
    console.log('HAL Simulator initialized');
  }

  /**
   * Initialize the HAL
   */
  initialize(): void {
    console.log('HAL initialized');
  }

  /**
   * Set the runtime type
   * @param type Runtime type
   */
  setRuntimeType(type: HAL_RuntimeType): void {
    this.runtimeType = type;
  }

  /**
   * Get the runtime type
   * @returns Runtime type
   */
  getRuntimeType(): HAL_RuntimeType {
    return this.runtimeType;
  }

  /**
   * Wait for the program to start
   */
  waitForProgramStart(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.programStarted) {
        resolve();
        return;
      }

      const checkInterval = setInterval(() => {
        if (this.programStarted) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Set that the program has started
   */
  setProgramStarted(): void {
    this.programStarted = true;
  }

  /**
   * Get whether the program has started
   * @returns True if the program has started
   */
  getProgramStarted(): boolean {
    return this.programStarted;
  }

  /**
   * Restart timing
   */
  restartTiming(): void {
    // Implementation would depend on how timing is handled
    console.log('Timing restarted');
  }

  /**
   * Pause timing
   */
  pauseTiming(): void {
    this.timingPaused = true;
    console.log('Timing paused');
  }

  /**
   * Resume timing
   */
  resumeTiming(): void {
    this.timingPaused = false;
    console.log('Timing resumed');
  }

  /**
   * Check if timing is paused
   * @returns True if timing is paused
   */
  isTimingPaused(): boolean {
    return this.timingPaused;
  }

  /**
   * Step timing by a specified amount
   * @param delta Time to step in microseconds
   */
  stepTiming(delta: number): void {
    // Implementation would depend on how timing is handled
    console.log(`Timing stepped by ${delta} microseconds`);
  }

  /**
   * Reset all handles
   */
  resetHandles(): void {
    this.digitalInputs.clear();
    this.pwms.clear();
    this.analogInputs.clear();
    this.encoders.clear();
    console.log('All handles reset');
  }

  // Digital Input methods

  /**
   * Create a digital input
   * @param channel Channel number
   * @returns Digital input simulation object
   */
  createDigitalInput(channel: number): DigitalInputSim {
    let dio = this.digitalInputs.get(channel);
    if (!dio) {
      dio = new DigitalInputSim(channel);
      this.digitalInputs.set(channel, dio);
    }
    dio.setInitialized(true);
    return dio;
  }

  /**
   * Get a digital input
   * @param channel Channel number
   * @returns Digital input simulation object or undefined if not found
   */
  getDigitalInput(channel: number): DigitalInputSim | undefined {
    return this.digitalInputs.get(channel);
  }

  /**
   * Get the number of digital inputs
   * @returns Number of digital inputs
   */
  getDigitalInputCount(): number {
    return this.digitalInputs.size;
  }

  // PWM methods

  /**
   * Create a PWM
   * @param channel Channel number
   * @returns PWM simulation object
   */
  createPWM(channel: number): PWMSim {
    let pwm = this.pwms.get(channel);
    if (!pwm) {
      pwm = new PWMSim(channel);
      this.pwms.set(channel, pwm);
    }
    pwm.setInitialized(true);
    return pwm;
  }

  /**
   * Get a PWM
   * @param channel Channel number
   * @returns PWM simulation object or undefined if not found
   */
  getPWM(channel: number): PWMSim | undefined {
    return this.pwms.get(channel);
  }

  /**
   * Get the number of PWMs
   * @returns Number of PWMs
   */
  getPWMCount(): number {
    return this.pwms.size;
  }

  // Analog Input methods

  /**
   * Create an analog input
   * @param channel Channel number
   * @returns Analog input simulation object
   */
  createAnalogInput(channel: number): AnalogInputSim {
    let ai = this.analogInputs.get(channel);
    if (!ai) {
      ai = new AnalogInputSim(channel);
      this.analogInputs.set(channel, ai);
    }
    ai.setInitialized(true);
    return ai;
  }

  /**
   * Get an analog input
   * @param channel Channel number
   * @returns Analog input simulation object or undefined if not found
   */
  getAnalogInput(channel: number): AnalogInputSim | undefined {
    return this.analogInputs.get(channel);
  }

  /**
   * Get the number of analog inputs
   * @returns Number of analog inputs
   */
  getAnalogInputCount(): number {
    return this.analogInputs.size;
  }

  // Encoder methods

  /**
   * Create an encoder
   * @param index Encoder index
   * @param channelA Digital channel A
   * @param channelB Digital channel B
   * @returns Encoder simulation object
   */
  createEncoder(index: number, channelA: number, channelB: number): EncoderSim {
    let encoder = this.encoders.get(index);
    if (!encoder) {
      encoder = new EncoderSim(index, channelA, channelB);
      this.encoders.set(index, encoder);
    } else {
      encoder.setDigitalChannelA(channelA);
      encoder.setDigitalChannelB(channelB);
    }
    encoder.setInitialized(true);
    return encoder;
  }

  /**
   * Get an encoder
   * @param index Encoder index
   * @returns Encoder simulation object or undefined if not found
   */
  getEncoder(index: number): EncoderSim | undefined {
    return this.encoders.get(index);
  }

  /**
   * Get the number of encoders
   * @returns Number of encoders
   */
  getEncoderCount(): number {
    return this.encoders.size;
  }
}
