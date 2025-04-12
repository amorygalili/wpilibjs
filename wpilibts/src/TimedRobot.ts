import { IterativeRobotBase } from './IterativeRobotBase';

/**
 * TimedRobot implements the IterativeRobotBase robot program framework.
 *
 * The TimedRobot class is intended to be subclassed by a user creating a robot program.
 *
 * periodic() functions from the base class are called on an interval by a timer.
 */
export class TimedRobot extends IterativeRobotBase {
  /** Default loop period. */
  public static readonly kDefaultPeriod = 0.02;

  private m_startTime: number = 0;
  private m_loopStartTime: number = 0;
  private m_callbacks: PriorityQueue<Callback> = new PriorityQueue<Callback>();
  private m_timerHandle: NodeJS.Timeout | null = null;

  /**
   * Constructor for TimedRobot.
   */
  constructor();
  /**
   * Constructor for TimedRobot.
   *
   * @param period Period in seconds.
   */
  constructor(period?: number) {
    super(period ?? TimedRobot.kDefaultPeriod);

    this.m_startTime = Date.now() / 1000;
    this.addPeriodic(this.loopFunc.bind(this), this.getPeriod());
  }

  /**
   * Provide an alternate "main loop" via startCompetition().
   */
  public startCompetition(): void {
    this.robotInit();

    if (this.isSimulation()) {
      this.simulationInit();
    }

    // Tell the DS that the robot is ready to be enabled
    console.log("********** Robot program startup complete **********");
    // TODO: Implement DriverStationJNI.observeUserProgramStarting();

    // Loop forever, calling the appropriate mode-dependent function
    this.startTimer();
  }

  /**
   * Ends the main loop in startCompetition().
   */
  public endCompetition(): void {
    this.stopTimer();
  }

  /**
   * Return the system clock time in microseconds for the start of the current periodic loop.
   * This is in the same time base as Date.now(), but is stable through a loop. It is updated
   * at the beginning of every periodic callback (including the normal periodic loop).
   *
   * @return Robot running time in microseconds, as of the start of the current periodic function.
   */
  public getLoopStartTime(): number {
    return this.m_loopStartTime;
  }

  /**
   * Add a callback to run at a specific period.
   *
   * This is scheduled on TimedRobot's timer, so TimedRobot and the callback run
   * synchronously. Interactions between them are thread-safe.
   *
   * @param callback The callback to run.
   * @param periodSeconds The period at which to run the callback in seconds.
   */
  public addPeriodic(callback: () => void, periodSeconds: number): void;
  /**
   * Add a callback to run at a specific period with a starting time offset.
   *
   * This is scheduled on TimedRobot's timer, so TimedRobot and the callback run
   * synchronously. Interactions between them are thread-safe.
   *
   * @param callback The callback to run.
   * @param periodSeconds The period at which to run the callback in seconds.
   * @param offsetSeconds The offset from the common starting time in seconds. This is useful for
   * scheduling a callback in a different timeslot relative to TimedRobot.
   */
  public addPeriodic(callback: () => void, periodSeconds: number, offsetSeconds?: number): void {
    this.m_callbacks.add(
      new Callback(
        callback,
        this.m_startTime,
        periodSeconds * 1000,
        (offsetSeconds ?? 0) * 1000
      )
    );
  }

  /**
   * Clean up resources used by the robot.
   */
  public override close(): void {
    this.stopTimer();
    super.close();
  }

  private startTimer(): void {
    if (this.m_timerHandle === null) {
      // Use a small interval (10ms) to check for callbacks that need to run
      this.m_timerHandle = setInterval(() => {
        const currentTime = Date.now() / 1000;

        // Process all callbacks that are ready to run
        while (this.m_callbacks.size() > 0 && this.m_callbacks.peek().expirationTime <= currentTime) {
          const callback = this.m_callbacks.poll();
          if (callback) {
            this.m_loopStartTime = Date.now() / 1000;
            callback.func();

            // Increment the expiration time by the period
            callback.expirationTime += callback.period / 1000;
            this.m_callbacks.add(callback);
          }
        }
      }, 10);
    }
  }

  private stopTimer(): void {
    if (this.m_timerHandle !== null) {
      clearInterval(this.m_timerHandle);
      this.m_timerHandle = null;
    }
  }
}

/**
 * A callback container for TimedRobot.
 */
class Callback {
  public func: () => void;
  public period: number;
  public expirationTime: number;

  /**
   * Construct a callback container.
   *
   * @param func The callback to run.
   * @param startTime The common starting point for all callback scheduling in seconds.
   * @param periodMs The period at which to run the callback in milliseconds.
   * @param offsetMs The offset from the common starting time in milliseconds.
   */
  constructor(func: () => void, startTime: number, periodMs: number, offsetMs: number) {
    this.func = func;
    this.period = periodMs;
    this.expirationTime = startTime + offsetMs / 1000 + periodMs / 1000;
  }
}

/**
 * A simple priority queue implementation.
 */
class PriorityQueue<T extends { expirationTime: number }> {
  private elements: T[] = [];

  /**
   * Add an element to the queue.
   *
   * @param element The element to add.
   */
  public add(element: T): void {
    this.elements.push(element);
    this.elements.sort((a, b) => a.expirationTime - b.expirationTime);
  }

  /**
   * Remove and return the element with the earliest expiration time.
   *
   * @returns The element with the earliest expiration time, or undefined if the queue is empty.
   */
  public poll(): T | undefined {
    return this.elements.shift();
  }

  /**
   * Return the element with the earliest expiration time without removing it.
   *
   * @returns The element with the earliest expiration time, or undefined if the queue is empty.
   */
  public peek(): T {
    return this.elements[0];
  }

  /**
   * Return the number of elements in the queue.
   *
   * @returns The number of elements in the queue.
   */
  public size(): number {
    return this.elements.length;
  }
}
