/**
 * App Header — standard header: eyebrow (month or context), title,
 * and the EUR/CHF display selector on main screens; back button and
 * context eyebrow on form/detail sub-views, per the maquette.
 *
 * @module Components/Common/AppHeader
 */

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { IconChevronLeft } from '@/components/common/icons';
import { JSX, useState } from 'react';

const titles: Record<string, string> = {
  '/': 'Tableau de bord',
  '/charges': 'Charges & échéancier',
  '/transfers': 'Transferts',
  '/accounts': 'Comptes',
  '/schedule': 'Échéancier',
};

const subTitles: Record<string, string> = {
  '/charges/new': 'Nouvelle charge',
  '/accounts/new': 'Nouveau compte',
  '/transfers/new': 'Nouveau transfert',
};

function currentMonthLabel(): string {
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

export function AppHeader(): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  // Display-currency selector (maquette). Selection is local for now; the
  // consolidated view always shows EUR with its rate date (cdc § 3.4).
  const [displayCurrency, setDisplayCurrency] = useState<'EUR' | 'CHF'>('EUR');

  const subTitle = subTitles[pathname];
  const isScheduleDetail = /^\/schedule\/[^/]+$/.test(pathname);

  if (subTitle || isScheduleDetail) {
    return (
      <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3">
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
            Création
          </p>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            {subTitle ?? "Détail de l'échéance"}
          </h1>
        </div>
      </div>
    );
  }

  const title =
    titles[pathname] ?? titles[`/${pathname.split('/')[1]}`] ?? 'Mbongo';

  return (
    <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-slate-400">
          {currentMonthLabel()}
        </p>
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
      </div>
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
    </div>
  );
}
