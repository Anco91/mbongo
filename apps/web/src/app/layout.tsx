/**
 * Root Layout
 *
 * Main layout component for the Next.js application.
 * Wraps all pages with common providers and styling.
 *
 * @module App/Layout
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/query-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mbongo - Financial Management',
  description: 'Manage your financial charges and payments with Mbongo',
};

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
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
