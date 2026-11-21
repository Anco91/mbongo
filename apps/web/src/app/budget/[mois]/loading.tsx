/**
 * Budget Page Loading State
 *
 * Skeleton shown while the budget preparation page loads.
 *
 * @module App/Budget/Loading
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SkeletonLine } from '@/components/ui/skeleton';
import { JSX } from 'react';

export default function BudgetLoading(): JSX.Element {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <SkeletonLine className="h-8 w-64 mb-2" />
        <SkeletonLine className="h-4 w-48" />
      </div>

      <div className="flex gap-2 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonLine key={i} className="flex-1 h-2 rounded-full" />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <SkeletonLine className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <SkeletonLine className="w-full" />
            <SkeletonLine className="h-16 w-full" />
            <SkeletonLine className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
