import { Workbox } from 'workbox-window';

export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    const workbox = new Workbox('/sw.js');
    void workbox.register();
  }
}
