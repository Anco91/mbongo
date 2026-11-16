/**
 * Tab Navigation — bottom navigation with 4 tabs, per the maquette.
 * Hidden while a form sub-view (…/new) or a detail sub-view is open.
 *
 * @module Components/Common/TabNav
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconArrowsTransaction,
  IconBankStatement,
  IconCalendar,
  IconChartPie,
} from '@/components/common/icons';
import { JSX } from 'react';

const tabs = [
  { href: '/', label: 'Tableau de bord', icon: IconChartPie },
  { href: '/charges', label: 'Charges', icon: IconCalendar },
  { href: '/transfers', label: 'Transferts', icon: IconArrowsTransaction },
  { href: '/accounts', label: 'Comptes', icon: IconBankStatement },
] as const;

/** True when a form or detail sub-view covers the screen (nav hidden). */
function isSubView(pathname: string): boolean {
  return pathname.endsWith('/new') || /^\/schedule\/[^/]+$/.test(pathname);
}

export function TabNav(): JSX.Element | null {
  const pathname = usePathname();
  if (isSubView(pathname)) return null;

  const isActive = (href: string): boolean =>
    href === '/'
      ? pathname === '/'
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="flex border-t border-slate-100 bg-white px-2 pb-3 pt-1.5">
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
