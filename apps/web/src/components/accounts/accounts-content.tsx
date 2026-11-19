/**
 * Accounts Content Component
 *
 * Client presentation (maquette `AccountsScreen`): tappable account cards,
 * computed balances (shared computeBalance — R9), savings progress and card
 * encours. Composition only — card, view model and state have their own
 * files (design D5). Tap opens the edit page (one page, one responsibility).
 *
 * @module Components/Accounts/AccountsContent
 */

'use client';

import { JSX } from 'react';
import Link from 'next/link';
import { ShowMoreList } from '@/components/patterns';
import { MemberFilterChips } from '@/components/patterns/member-filter-chips';
import { LoadingState, ErrorPanel } from '@/components/patterns/async-state';
import { Button } from '@/components/ui/button';
import { IconPlus } from '@/components/ui/icons';
import { AccountCard } from '@/components/accounts/account-card';
import { useAccountsView } from '@/components/accounts/use-accounts-view';

export function AccountsContent(): JSX.Element {
  const view = useAccountsView();

  if (view.isLoading) {
    return <LoadingState label="Chargement des comptes…" />;
  }

  if (view.error) {
    return (
      <ErrorPanel
        title="Erreur lors du chargement des comptes"
        message={view.error.message}
        onRetry={view.refetch}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Comptes</h2>
        <p className="text-xs text-slate-500">
          Consolidation en euros, devises natives conservées. Touchez un compte
          pour le modifier ou le clôturer.
        </p>
      </div>

      <MemberFilterChips
        members={view.members}
        value={view.selectedMember}
        onChange={view.setSelectedMember}
      />

      <ShowMoreList
        items={view.cards}
        renderItem={(card) => <AccountCard key={card.account.id} view={card} />}
      />

      {view.cards.length === 0 && (
        <div className="rounded-lg border border-slate-200 p-8 text-center">
          <h3 className="mb-2 text-base font-semibold text-slate-800">
            Aucun compte
          </h3>
          <p className="mb-4 text-sm text-slate-600">
            Créez un premier compte pour suivre vos soldes.
          </p>
        </div>
      )}

      <Link href="/accounts/new" className="block">
        <Button variant="outline" size="lg" className="w-full">
          <IconPlus className="h-4 w-4" /> Nouveau compte
        </Button>
      </Link>

      <Link
        href="/household"
        className="block text-center text-xs font-medium text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline"
      >
        Vue foyer — gérer les membres
      </Link>
    </div>
  );
}
