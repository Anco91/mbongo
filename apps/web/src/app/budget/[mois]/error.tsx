/**
 * Budget Page Error State
 *
 * Error boundary for the budget preparation page.
 *
 * @module App/Budget/Error
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { JSX } from 'react';

interface BudgetErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BudgetError({
  error,
  reset,
}: BudgetErrorProps): JSX.Element {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-900">
            Impossible de charger le budget
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-red-700">
            {error.message || 'Une erreur est survenue lors du chargement.'}
          </p>
          <Button variant="outline" onClick={reset}>
            Réessayer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
