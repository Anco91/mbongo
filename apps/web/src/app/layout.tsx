/**
 * Root Layout
 *
 * Main layout component for the Next.js application.
 * Wraps all pages with common providers and styling.
 *
 * @module App/Layout
 */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/query-provider';
import { DisplayCurrencyProvider } from '@/components/providers/display-currency-provider';
import { ServiceWorkerRegister } from '@/components/providers/service-worker-register';
import { AppShell } from '@/components/common/app-shell';
import { APP_METADATA, APP_VIEWPORT } from '@/lib/pwa';
import { JSX } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = APP_METADATA;

export const viewport: Viewport = APP_VIEWPORT;

/**
 * Root Layout Component
 *
 * This layout:
 * 1. Sets up the HTML structure
 * 2. Adds global CSS
 * 3. Wraps children with QueryProvider for React Query
 * 4. Can be extended with other providers (auth, theme, etc.)
 *
 * @param props - Layout props with children
 * @returns JSX Element
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <ServiceWorkerRegister />
        <QueryProvider>
          <DisplayCurrencyProvider>
            <AppShell>{children}</AppShell>
          </DisplayCurrencyProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
