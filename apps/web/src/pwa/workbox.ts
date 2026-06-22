export const appShellCacheName = 'treasure-box-app-shell-v1';
export const runtimeCacheName = 'treasure-box-runtime-v1';
export const precacheUrls = ['/', '/index.html', '/manifest.webmanifest', '/offline.html'];
export const runtimeCachePatterns = [/^\/$/, /^\/locations/, /^\/search/, /^\/items\//];

export async function cacheAppShell(): Promise<void> {
  if (!('caches' in globalThis)) return;
  const cache = await caches.open(appShellCacheName);
  await cache.addAll(precacheUrls);
}
