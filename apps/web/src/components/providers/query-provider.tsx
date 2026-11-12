/**
 * Query Provider
 *
 * React Query provider wrapper for the application.
 * Sets up the QueryClient and QueryClientProvider.
 *
 * @module Components/Providers/QueryProvider
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { JSX, useState } from 'react';

/**
 * QueryProvider Component
 *
 * Wraps the application with React Query's QueryClientProvider.
 * Each user gets their own QueryClient instance.
 * In development, includes the React Query Devtools.
 *
 * @param props - Provider props with children
 * @returns JSX Element
 *
 * @example
 * ```tsx
 * // In app/layout.tsx:
 * import { QueryProvider } from '@/components/providers/query-provider';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <QueryProvider>{children}</QueryProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  // Create a QueryClient instance for each user
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000, // 1 minute
            retry: 3,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} position="bottom" />
    </QueryClientProvider>
  );
}
