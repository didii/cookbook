import { useEffect } from 'react';

/** Registers `/sw.js`, which browsers need before they offer to install the app. Renders nothing; the app works without it. */
export function ServiceWorker() {
  useEffect(() => {
    navigator.serviceWorker?.register('/sw.js', { scope: '/' }).catch(() => {});
  }, []);
  return null;
}
