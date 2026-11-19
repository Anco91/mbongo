/**
 * Section Title — list section heading, per the maquette.
 *
 * @module Components/Patterns/SectionTitle
 */

import { JSX } from 'react';

export function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <h2 className="mb-2 text-sm font-semibold text-slate-900">{children}</h2>
  );
}
