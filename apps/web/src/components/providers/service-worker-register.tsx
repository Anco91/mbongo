/**
 * Service Worker Register — client-only mount point for the shell worker.
 *
 * @module Components/Providers/ServiceWorkerRegister
 */

'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/service-worker';

export function ServiceWorkerRegister(): null {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
