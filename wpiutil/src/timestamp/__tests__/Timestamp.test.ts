import { Timestamp } from '../Timestamp';
import { sleep } from '../../__tests__/helpers/TestUtils';

describe('Timestamp', () => {
  test('getMicroseconds returns a bigint', () => {
    const time = Timestamp.getMicroseconds();
    expect(typeof time).toBe('bigint');
  });

  test('getMilliseconds returns a number', () => {
    const time = Timestamp.getMilliseconds();
    expect(typeof time).toBe('number');
  });

  test('getSeconds returns a number', () => {
    const time = Timestamp.getSeconds();
    expect(typeof time).toBe('number');
  });

  test('getMicroseconds increases over time', async () => {
    const time1 = Timestamp.getMicroseconds();
    await sleep(10); // Sleep for 10ms
    const time2 = Timestamp.getMicroseconds();
    expect(time2).toBeGreaterThan(time1);
  });

  test('getMilliseconds increases over time', async () => {
    const time1 = Timestamp.getMilliseconds();
    await sleep(10); // Sleep for 10ms
    const time2 = Timestamp.getMilliseconds();
    expect(time2).toBeGreaterThan(time1);
  });

  test('getSeconds increases over time', async () => {
    const time1 = Timestamp.getSeconds();
    await sleep(1000); // Sleep for 1s
    const time2 = Timestamp.getSeconds();
    expect(time2).toBeGreaterThan(time1);
  });

  test('delayMicroseconds waits for the specified time', async () => {
    const start = Timestamp.getMilliseconds();
    await Timestamp.delayMicroseconds(10000); // 10ms
    const end = Timestamp.getMilliseconds();
    const elapsed = end - start;
    expect(elapsed).toBeGreaterThanOrEqual(9); // Allow for some timing inaccuracy
  });

  test('delayMilliseconds waits for the specified time', async () => {
    const start = Timestamp.getMilliseconds();
    await Timestamp.delayMilliseconds(10); // 10ms
    const end = Timestamp.getMilliseconds();
    const elapsed = end - start;
    expect(elapsed).toBeGreaterThanOrEqual(9); // Allow for some timing inaccuracy
  });

  test('delaySeconds waits for the specified time', async () => {
    const start = Timestamp.getMilliseconds();
    await Timestamp.delaySeconds(0.01); // 10ms
    const end = Timestamp.getMilliseconds();
    const elapsed = (end - start) / 1000; // Convert to seconds
    expect(elapsed).toBeGreaterThanOrEqual(0.009); // Allow for some timing inaccuracy
  });

  test('time conversions are consistent', () => {
    const microTime = Timestamp.getMicroseconds();
    const milliTime = Timestamp.getMilliseconds();
    const secTime = Timestamp.getSeconds();

    // Convert microseconds to milliseconds and seconds
    const milliFromMicro = Number(microTime) / 1000;
    const secFromMicro = Number(microTime) / 1_000_000;

    // Check that the conversions are close
    // Use Math.floor to avoid precision issues
    expect(Math.floor(milliFromMicro)).toBeCloseTo(Math.floor(milliTime), 0); // Within 1ms
    expect(Math.floor(secFromMicro)).toBeCloseTo(Math.floor(secTime), 0); // Within 1s
  });
});
