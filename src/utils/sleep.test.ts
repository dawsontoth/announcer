import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { sleep } from './sleep.ts';

describe('sleep', () => {
  // Use fake timers to avoid actual waiting in tests
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('resolves after default timeout (1000ms)', async () => {
    const promise = sleep();

    // Fast-forward time
    jest.advanceTimersByTime(999);
    // Promise should not be resolved yet
    expect(jest.getTimerCount()).toBe(1);

    // Advance to 1000ms
    jest.advanceTimersByTime(1);
    // Allow any pending promises to resolve
    await promise;

    // Timer should be cleared
    expect(jest.getTimerCount()).toBe(0);
  });

  test('resolves after custom timeout', async () => {
    const customMs = 500;
    const promise = sleep(customMs);

    // Fast-forward time
    jest.advanceTimersByTime(499);
    // Promise should not be resolved yet
    expect(jest.getTimerCount()).toBe(1);

    // Advance to 500ms
    jest.advanceTimersByTime(1);
    // Allow any pending promises to resolve
    await promise;

    // Timer should be cleared
    expect(jest.getTimerCount()).toBe(0);
  });

  test('resolves after very short timeout', async () => {
    const customMs = 1;
    const promise = sleep(customMs);

    // Fast-forward time
    jest.advanceTimersByTime(1);
    // Allow any pending promises to resolve
    await promise;

    // Timer should be cleared
    expect(jest.getTimerCount()).toBe(0);
  });
});
