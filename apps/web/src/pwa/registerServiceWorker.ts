import { Workbox } from 'workbox-window';

export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    // Base-aware SW URL; swallow failures (no sw.js is shipped yet, so this is
    // inert rather than erroring on the deployed site).
    const workbox = new Workbox(`${import.meta.env.BASE_URL}sw.js`);
    void workbox.register().catch(() => undefined);
  }
}
