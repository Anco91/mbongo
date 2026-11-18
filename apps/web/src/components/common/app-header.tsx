/**
 * App Header — standard header: eyebrow (month or context), title,
 * and the EUR/CHF display selector on main screens; back button and
 * context eyebrow on form/detail sub-views, per the maquette.
 *
 * @module Components/Common/AppHeader
 */

'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { IconChevronLeft, IconBell } from '@/components/common/icons';
import { useDisplayCurrency } from '@/components/providers/display-currency-provider';
import {
  useActiveAlerts,
  useAlertsRead,
  alertFingerprint,
} from '@/hooks/use-alerts';
import { routeChrome } from '@/lib/routes';
import { JSX } from 'react';

function currentMonthLabel(): string {
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

export function AppHeader(): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  // Display-currency selector (maquette). Shared context + localStorage:
  // the choice drives the consolidated display and persists across views.
  const { displayCurrency, setDisplayCurrency } = useDisplayCurrency();
  // Bell badge: active alerts not yet read on this device.
  const alerts = useActiveAlerts();
  const { readIds } = useAlertsRead();
  const unreadCount = alerts.filter(
    (a) => !readIds.has(alertFingerprint(a))
  ).length;

  const chrome = routeChrome(pathname);

  if (chrome.isSubView) {
    return (
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700"
          aria-label="Retour"
        >
          <IconChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-400">
            {chrome.eyebrow}
          </p>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            {chrome.title}
          </h1>
        </div>
      </div>
    );
  }

  const { title } = chrome;

  return (
    <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-5 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-slate-400">
          {currentMonthLabel()}
        </p>
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/alerts"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100"
          aria-label={`Alertes${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
        >
          <IconBell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </Link>
        {/* Sélecteur dashboard-only (revue M4) : il ne sert qu'à l'affichage consolidé. */}
        {pathname === '/' && (
          <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            {(['EUR', 'CHF'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setDisplayCurrency(c)}
                className={
                  displayCurrency === c
                    ? 'rounded-full bg-white px-1.5 py-0.5 shadow-sm'
                    : 'px-1 py-0.5'
                }
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
