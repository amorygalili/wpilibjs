import { Watchdog } from '../src/Watchdog';

describe('Watchdog', () => {
  let callback: jest.Mock;
  let watchdog: Watchdog;

  beforeEach(() => {
    jest.useFakeTimers();
    callback = jest.fn();
    watchdog = new Watchdog(1.0, callback);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should not call callback when disabled', () => {
    watchdog.enable();
    watchdog.disable();

    // Advance time by more than the timeout
    jest.advanceTimersByTime(1500);

    expect(callback).not.toHaveBeenCalled();
  });

  test('should call callback when timeout expires', () => {
    watchdog.enable();

    // Advance time by more than the timeout
    jest.advanceTimersByTime(1500);

    watchdog.disable();

    expect(callback).toHaveBeenCalled();
  });

  test('should reset timeout when reset is called', () => {
    watchdog.enable();

    // Advance time by less than the timeout
    jest.advanceTimersByTime(500);

    watchdog.reset();

    // Advance time by less than the timeout again
    jest.advanceTimersByTime(500);

    // At this point, the total time is 1000ms, which is the timeout
    // But since we reset at 500ms, we should not have expired yet
    expect(callback).not.toHaveBeenCalled();

    // Advance time to exceed the timeout after reset
    jest.advanceTimersByTime(600);

    // Now we should have expired
    watchdog.disable();

    expect(callback).toHaveBeenCalled();
  });

  test('should add and print epochs', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    watchdog.reset();
    watchdog.addEpoch('First Epoch');
    watchdog.addEpoch('Second Epoch');

    watchdog.printEpochs();

    expect(consoleSpy).toHaveBeenCalledWith('Epochs:');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('First Epoch'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Second Epoch'));

    consoleSpy.mockRestore();
  });

  test('should get and set timeout', () => {
    expect(watchdog.getTimeout()).toBe(1.0);

    watchdog.setTimeout(2.0);

    expect(watchdog.getTimeout()).toBe(2.0);
  });

  test('should report expired state correctly', () => {
    expect(watchdog.isExpired()).toBe(false);

    watchdog.enable();

    // Advance time by more than the timeout
    jest.advanceTimersByTime(1500);

    watchdog.disable();

    expect(watchdog.isExpired()).toBe(true);
  });
});
