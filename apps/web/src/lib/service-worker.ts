/**
 * Service worker registration — production only (design D2). Guarded so
 * the dev server never installs a cache that hides fresh code.
 *
 * @module Lib/ServiceWorker
 */

/** Register the shell service worker when the runtime supports it. */
export function registerServiceWorker(): void {
  if (process.env.NODE_ENV !== 'production') return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
    console.warn('Service worker registration failed', error);
  });
}
