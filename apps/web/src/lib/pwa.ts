/**
 * PWA metadata — single source for the document head (design D2/D3).
 * Re-exported by the root layout so tests can assert it without pulling CSS.
 *
 * @module Lib/Pwa
 */

import type { Metadata, Viewport } from 'next';

export const APP_NAME = 'Mbongo';
export const THEME_COLOR = '#059669';

export const APP_METADATA: Metadata = {
  title: 'Mbongo — Gestion financière',
  description: 'Gérez vos charges, comptes et transferts.',
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  // Next emits `mobile-web-app-capable`; iOS still reads the apple-prefixed
  // legacy flag, so both are declared (design D3).
  other: {
    'apple-mobile-web-app-capable': 'yes',
  },
};

export const APP_VIEWPORT: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: THEME_COLOR,
};
