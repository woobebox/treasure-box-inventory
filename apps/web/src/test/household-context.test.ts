import { describe, expect, it } from 'vitest';
import { getOrCreateDeviceId } from '../services/householdContextValue';

function makeStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value); }
  };
}

describe('household context deviceId', () => {
  it('generates and persists a deviceId on first use', () => {
    const storage = makeStorage();
    const first = getOrCreateDeviceId(storage);
    expect(first).toBeTruthy();
    // second call returns the same persisted id
    const second = getOrCreateDeviceId(storage);
    expect(second).toBe(first);
  });

  it('uses a separate id per storage (each browser is its own device)', () => {
    const a = getOrCreateDeviceId(makeStorage());
    const b = getOrCreateDeviceId(makeStorage());
    expect(a).not.toBe(b);
  });
});
