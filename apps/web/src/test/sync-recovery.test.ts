import { describe, expect, it } from 'vitest';
import { retryDelayMs } from '../sync/outbox';

describe('sync recovery', () => {
  it('backs off retries with a maximum delay', () => {
    expect(retryDelayMs(0)).toBe(1000);
    expect(retryDelayMs(3)).toBe(8000);
    expect(retryDelayMs(10)).toBe(30000);
  });
});
