/**
 * Tab Navigation — bottom navigation with 4 tabs, per the maquette.
 * Hidden while a create/edit/detail sub-view covers the screen
 * (`routeChrome`, design D4).
 *
 * @module Components/Patterns/TabNav
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconArrowsTransaction,
  IconBankStatement,
  IconCalendar,
  IconChartPie,
} from '@/components/ui/icons';
import { routeChrome } from '@/lib/routes';
import { JSX } from 'react';

const tabs = [
  { href: '/', label: 'Tableau de bord', icon: IconChartPie },
  { href: '/charges', label: 'Charges', icon: IconCalendar },
  { href: '/transfers', label: 'Transferts', icon: IconArrowsTransaction },
  { href: '/accounts', label: 'Comptes', icon: IconBankStatement },
] as const;

export function TabNav(): JSX.Element | null {
  const pathname = usePathname();
  if (routeChrome(pathname).isSubView) return null;

  const isActive = (href: string): boolean =>
    href === '/'
      ? pathname === '/'
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="flex shrink-0 border-t border-slate-100 bg-white px-2 pt-1.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-[10px] font-medium transition-colors ${
              isActive(tab.href) ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <Icon className="h-5 w-5" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
