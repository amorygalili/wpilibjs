/**
 * A class that's a wrapper around a watchdog timer.
 *
 * When the timer expires, a function is called to handle the timeout.
 */
export class Watchdog {
  private m_timeout: number;
  private m_callback: () => void;
  private m_startTime: number = 0;
  private m_epochs: Map<string, number> = new Map<string, number>();
  private m_expirationTime: number = 0;
  private m_isExpired: boolean = false;
  private m_enabled: boolean = false;

  /**
   * Watchdog constructor.
   *
   * @param timeout The watchdog's timeout in seconds.
   * @param callback This function is called when the timeout expires.
   */
  constructor(timeout: number, callback: () => void) {
    this.m_timeout = timeout;
    this.m_callback = callback;
  }

  /**
   * Returns the time in seconds since the watchdog was last fed.
   */
  public getTime(): number {
    return (Date.now() / 1000) - this.m_startTime;
  }

  /**
   * Sets the watchdog's timeout.
   *
   * @param timeout The watchdog's timeout in seconds.
   */
  public setTimeout(timeout: number): void {
    this.m_timeout = timeout;
  }

  /**
   * Returns the watchdog's timeout in seconds.
   */
  public getTimeout(): number {
    return this.m_timeout;
  }



  /**
   * Returns true if the watchdog timer has expired.
   */
  public isExpired(): boolean {
    return this.m_isExpired;
  }

  /**
   * Adds time since last epoch to the list printed by printEpochs().
   *
   * Epochs are a way to partition the time elapsed so that when overruns occur, one can determine
   * which parts of an operation consumed the most time.
   *
   * @param epochName The name to associate with the epoch.
   */
  public addEpoch(epochName: string): void {
    const currentTime = Date.now() / 1000;
    this.m_epochs.set(epochName, currentTime - this.m_startTime);
    this.m_startTime = currentTime;
  }

  /**
   * Prints list of epochs added so far and their times.
   */
  public printEpochs(): void {
    console.log("Epochs:");
    this.m_epochs.forEach((time, name) => {
      console.log(`\t${name}: ${time} s`);
    });
  }

  /**
   * Resets the watchdog timer.
   *
   * This also enables the timer if it was previously disabled.
   */
  public reset(): void {
    this.enable();
    this.m_startTime = Date.now() / 1000;
    this.m_epochs.clear();
  }

  /**
   * Enables the watchdog timer.
   */
  public enable(): void {
    this.m_startTime = Date.now() / 1000;
    this.m_expirationTime = this.m_startTime + this.m_timeout;
    this.m_isExpired = false;
    this.m_enabled = true;
  }

  /**
   * Disables the watchdog timer.
   */
  public disable(): void {
    if (this.m_enabled) {
      this.m_enabled = false;
      const now = Date.now() / 1000;
      if (!this.m_isExpired && now > this.m_expirationTime) {
        this.m_isExpired = true;
        this.m_callback();
      }
    }
  }
}
