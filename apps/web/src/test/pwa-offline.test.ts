import { describe, expect, it } from 'vitest';
import { appShellCacheName, precacheUrls, runtimeCachePatterns } from '../pwa/workbox';

describe('pwa offline shell configuration', () => {
  it('defines app shell assets and offline fallback runtime cache', () => {
    expect(appShellCacheName).toContain('treasure-box-app-shell');
    expect(precacheUrls).toContain('/offline.html');
    expect(runtimeCachePatterns.some((pattern) => pattern.test('/'))).toBe(true);
  });
});
