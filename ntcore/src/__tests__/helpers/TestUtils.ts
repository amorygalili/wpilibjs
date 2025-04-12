/**
 * Wait for a specified number of milliseconds
 *
 * @param ms The number of milliseconds to wait
 * @returns A promise that resolves after the specified time
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('TestUtils', () => {
  test('sleep waits for the specified time', async () => {
    const start = Date.now();
    await sleep(10);
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(9); // Allow for small timing variations
  });
});

/**
 * Run a function and measure how long it takes
 *
 * @param fn The function to run
 * @returns The time it took to run the function in milliseconds
 */
export async function measureExecutionTime<T>(fn: () => T | Promise<T>): Promise<{ result: T; time: number }> {
  const start = Date.now();
  const result = await Promise.resolve(fn());
  const end = Date.now();
  return { result, time: end - start };
}

/**
 * Create a mock function that resolves after a specified time
 *
 * @param result The result to return
 * @param delay The delay in milliseconds
 * @returns A function that returns a promise that resolves after the specified time
 */
export function createDelayedMock<T>(result: T, delay: number): jest.Mock<Promise<T>> {
  return jest.fn().mockImplementation(async () => {
    await sleep(delay);
    return result;
  });
}

/**
 * Create a mock function that throws an error
 *
 * @param error The error to throw
 * @returns A function that throws the specified error
 */
export function createErrorMock(error: Error): jest.Mock {
  return jest.fn().mockImplementation(() => {
    throw error;
  });
}

/**
 * Expect a function to throw an error
 *
 * @param fn The function to call
 * @param errorType The expected error type
 * @param errorMessage The expected error message (optional)
 */
export async function expectToThrow(
  fn: () => any | Promise<any>,
  errorType: any = Error,
  errorMessage?: string
): Promise<void> {
  try {
    await Promise.resolve(fn());
    fail('Expected function to throw an error');
  } catch (error: any) {
    expect(error).toBeInstanceOf(errorType);
    if (errorMessage) {
      expect(error.message).toContain(errorMessage);
    }
  }
}

/**
 * Create a mock event emitter
 *
 * @returns A mock event emitter
 */
export function createMockEventEmitter(): { on: jest.Mock; once: jest.Mock; removeListener: jest.Mock; emit: jest.Mock } {
  return {
    on: jest.fn(),
    once: jest.fn(),
    removeListener: jest.fn(),
    emit: jest.fn()
  };
}
