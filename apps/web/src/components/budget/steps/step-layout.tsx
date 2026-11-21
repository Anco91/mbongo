/**
 * Step Layout — Common layout for wizard steps.
 *
 * Provides consistent spacing and description styling.
 * The title is rendered by the parent CardTitle, not here.
 *
 * @module Components/Budget/Steps/StepLayout
 */

import { JSX, ReactNode } from 'react';

interface StepLayoutProps {
  description: string;
  children: ReactNode;
}

/**
 * Standard layout for budget wizard steps.
 *
 * - Description paragraph
 * - Consistent spacing (space-y-4)
 */
export function StepLayout({
  description,
  children,
}: StepLayoutProps): JSX.Element {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">{description}</p>
      {children}
    </div>
  );
}
