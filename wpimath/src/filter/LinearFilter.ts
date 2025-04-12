import { MathSharedStore } from '../MathSharedStore';
import { MathUsageId } from '../MathUsageId';
import { CircularBuffer } from '../util/CircularBuffer';

/**
 * This class implements a linear, digital filter. All types of FIR and IIR filters are supported.
 * Static factory methods are provided to create commonly used types of filters.
 *
 * Filters are of the form:
 * y[n] = (b0 x[n] + b1 x[n-1] + ... + bP x[n-P]) - (a0 y[n-1] + a2 y[n-2] + ... + aQ y[n-Q])
 *
 * Where:
 * - y[n] is the output at time "n"
 * - x[n] is the input at time "n"
 * - y[n-1] is the output from the LAST time step ("n-1")
 * - x[n-1] is the input from the LAST time step ("n-1")
 * - b0...bP are the "feedforward" (FIR) gains
 * - a0...aQ are the "feedback" (IIR) gains
 * 
 * IMPORTANT! Note the "-" sign in front of the feedback term! This is a common
 * convention in signal processing.
 *
 * What can linear filters do? Basically, they can filter, or diminish, the
 * effects of undesirable input frequencies. High frequencies, or rapid changes,
 * can be indicative of sensor noise or be otherwise undesirable. A "low pass"
 * filter smooths out the signal, reducing the impact of these high frequency
 * components. Likewise, a "high pass" filter gets rid of slow-moving signal
 * components, letting you detect large changes more easily.
 *
 * Example FRC applications of filters:
 * - Getting rid of noise from an analog sensor input (note: the roboRIO's FPGA
 *   can do this faster in hardware)
 * - Smoothing out joystick input to prevent the wheels from slipping or the
 *   robot from tipping
 * - Smoothing motor commands so that unnecessary strain isn't put on
 *   electrical or mechanical components
 * - If you use clever gains, you can make a PID controller out of this class!
 *
 * Note 1: calculate() should be called by the user on a known, regular period.
 * You can use a Notifier for this or do it "inline" with code in a
 * periodic function.
 *
 * Note 2: For ALL filters, gains are necessarily a function of frequency. If
 * you make a filter that works well for you at, say, 100Hz, you will most
 * definitely need to adjust the gains if you then want to run it at 200Hz!
 * Combining this with Note 1 - the impetus is on YOU as a developer to make
 * sure calculate() gets called at the desired, constant frequency!
 */
export class LinearFilter {
  private static instances = 0;

  private m_inputs: CircularBuffer<number>;
  private m_outputs: CircularBuffer<number>;
  private m_inputGains: number[];
  private m_outputGains: number[];
  private m_lastOutput = 0.0;

  /**
   * Create a linear FIR or IIR filter.
   *
   * @param ffGains The "feedforward" or FIR gains.
   * @param fbGains The "feedback" or IIR gains.
   */
  constructor(ffGains: number[], fbGains: number[]) {
    this.m_inputs = new CircularBuffer<number>(ffGains.length);
    this.m_outputs = new CircularBuffer<number>(fbGains.length);
    this.m_inputGains = [...ffGains];
    this.m_outputGains = [...fbGains];

    // Initialize the circular buffers
    for (let i = 0; i < ffGains.length; i++) {
      this.m_inputs.addFirst(0.0);
    }
    for (let i = 0; i < fbGains.length; i++) {
      this.m_outputs.addFirst(0.0);
    }

    LinearFilter.instances++;
    MathSharedStore.reportUsage(MathUsageId.kFilter_Linear, LinearFilter.instances);
  }

  /**
   * Creates a one-pole IIR low-pass filter of the form:
   * y[n] = (1-gain) x[n] + gain y[n-1]
   * where gain = e^(-dt / T), T is the time constant in seconds.
   *
   * Note: T = 1 / (2πf) where f is the cutoff frequency in Hz, the frequency
   * above which the input starts to attenuate.
   *
   * This filter is stable for time constants greater than zero.
   *
   * @param timeConstant The discrete-time time constant in seconds.
   * @param period The period in seconds between samples taken by the user.
   * @return Linear filter.
   */
  public static singlePoleIIR(timeConstant: number, period: number): LinearFilter {
    const gain = Math.exp(-period / timeConstant);
    const ffGains = [1.0 - gain];
    const fbGains = [-gain];

    return new LinearFilter(ffGains, fbGains);
  }

  /**
   * Creates a first-order high-pass filter of the form:
   * y[n] = gain x[n] + (-gain) x[n-1] + gain y[n-1]
   * where gain = e^(-dt / T), T is the time constant in seconds.
   *
   * Note: T = 1 / (2πf) where f is the cutoff frequency in Hz, the frequency
   * below which the input starts to attenuate.
   *
   * This filter is stable for time constants greater than zero.
   *
   * @param timeConstant The discrete-time time constant in seconds.
   * @param period The period in seconds between samples taken by the user.
   * @return Linear filter.
   */
  public static highPass(timeConstant: number, period: number): LinearFilter {
    const gain = Math.exp(-period / timeConstant);
    const ffGains = [gain, -gain];
    const fbGains = [-gain];

    return new LinearFilter(ffGains, fbGains);
  }

  /**
   * Creates a K-tap FIR moving average filter of the form:
   * y[n] = 1/k (x[k] + x[k-1] + ... + x[0])
   *
   * This filter is always stable.
   *
   * @param taps The number of samples to average over. Higher = smoother but slower.
   * @return Linear filter.
   * @throws Error if number of taps is less than 1.
   */
  public static movingAverage(taps: number): LinearFilter {
    if (taps <= 0) {
      throw new Error("Number of taps was not at least 1");
    }

    const ffGains = new Array<number>(taps).fill(1.0 / taps);
    const fbGains: number[] = [];

    return new LinearFilter(ffGains, fbGains);
  }

  /**
   * Reset the filter state.
   */
  public reset(): void {
    for (let i = 0; i < this.m_inputs.size(); i++) {
      this.m_inputs.set(i, 0.0);
    }
    for (let i = 0; i < this.m_outputs.size(); i++) {
      this.m_outputs.set(i, 0.0);
    }
  }

  /**
   * Reset the filter state with the specified values.
   *
   * @param inputBuffer Values to initialize input buffer.
   * @param outputBuffer Values to initialize output buffer.
   * @throws Error if size of inputBuffer or outputBuffer does not match the size of ffGains and fbGains provided in the constructor.
   */
  public resetWithBuffers(inputBuffer: number[], outputBuffer: number[]): void {
    // Clear buffers
    this.reset();

    if (inputBuffer.length !== this.m_inputGains.length ||
        outputBuffer.length !== this.m_outputGains.length) {
      throw new Error("Incorrect length of inputBuffer or outputBuffer");
    }

    for (let i = 0; i < inputBuffer.length; i++) {
      this.m_inputs.set(i, inputBuffer[i]);
    }
    for (let i = 0; i < outputBuffer.length; i++) {
      this.m_outputs.set(i, outputBuffer[i]);
    }
  }

  /**
   * Calculates the next value of the filter.
   *
   * @param input Current input value.
   * @return The filtered value at this step.
   */
  public calculate(input: number): number {
    let retVal = 0.0;

    // Rotate the inputs
    if (this.m_inputGains.length > 0) {
      this.m_inputs.addFirst(input);
    }

    // Calculate the new value
    for (let i = 0; i < this.m_inputGains.length; i++) {
      retVal += this.m_inputs.get(i) * this.m_inputGains[i];
    }
    for (let i = 0; i < this.m_outputGains.length; i++) {
      retVal -= this.m_outputs.get(i) * this.m_outputGains[i];
    }

    // Rotate the outputs
    if (this.m_outputGains.length > 0) {
      this.m_outputs.addFirst(retVal);
    }

    this.m_lastOutput = retVal;
    return retVal;
  }

  /**
   * Returns the last value calculated by the LinearFilter.
   *
   * @return The last value.
   */
  public lastValue(): number {
    return this.m_lastOutput;
  }
}
