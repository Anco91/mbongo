/**
 * App Shell — the bounded mobile frame (design D1): the document never
 * scrolls; only the main area does, between a fixed header and the tab bar.
 * Safe areas keep both edges clear of notches and the home indicator (D3).
 *
 * @module Components/Patterns/AppShell
 */

import { AppHeader } from '@/components/patterns/app-header';
import { TabNav } from '@/components/patterns/tab-nav';
import { JSX, type ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div className="flex h-dvh justify-center overflow-hidden bg-slate-100">
      <div className="flex h-full w-full max-w-[390px] flex-col overflow-hidden bg-white">
        <AppHeader />
        <main className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 pb-8">
          {children}
        </main>
        <TabNav />
      </div>
    </div>
  );
}
