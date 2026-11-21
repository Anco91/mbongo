/**
 * Schedule Content Component
 *
 * Client presentation (maquette list rows): white card, divided rows, one
 * line per upcoming due date. Data merging lives in `useScheduleRows`, the
 * row in `schedule-row` (design D5). A persisted row opens its detail page
 * (one page, one responsibility).
 *
 * @module Components/Schedule/ScheduleContent
 */

'use client';

import Link from 'next/link';
import { JSX } from 'react';
import { LoadingState, ErrorPanel } from '@/components/patterns/async-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { IconPlus } from '@/components/ui/icons';
import { ScheduleRow } from '@/components/schedule/schedule-row';
import { useScheduleRows } from '@/components/schedule/use-schedule-rows';

export function ScheduleContent(): JSX.Element {
  const view = useScheduleRows();

  if (view.isLoading) {
    return <LoadingState label="Chargement des échéances…" />;
  }

  if (view.error) {
    return (
      <ErrorPanel
        title="Impossible de charger les échéances"
        message={view.error.message}
        onRetry={view.refetch}
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        60 prochains jours — échéances et encours carte.
      </p>

      {view.rows.length === 0 ? (
        <div className="rounded-lg border border-slate-200 p-8 text-center">
          <h3 className="mb-2 text-base font-semibold text-slate-800">
            Aucune échéance à venir
          </h3>
          <p className="mb-4 text-sm text-slate-600">
            Créez une charge pour voir ses échéances ici.
          </p>
          <Link href="/charges/new" className="inline-block">
            <Button size="sm">
              <IconPlus className="h-4 w-4" /> Créer une charge
            </Button>
          </Link>
        </div>
      ) : (
        <Card>
          <CardContent className="divide-y divide-slate-100 pt-2">
            {view.rows.map((row) => (
              <ScheduleRow key={row.key} row={row} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
