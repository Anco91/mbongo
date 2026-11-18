/**
 * Route Error — shared segment error boundary body: the shell stays in
 * place (header and tab bar remain usable) and the segment offers a retry.
 *
 * @module Components/Common/RouteError
 */

'use client';

import { JSX } from 'react';
import { ErrorPanel } from '@/components/common/async-state';

interface RouteErrorProps {
  title: string;
  error: Error;
  reset: () => void;
}

export function RouteError({
  title,
  error,
  reset,
}: RouteErrorProps): JSX.Element {
  return (
    <div className="p-4">
      <ErrorPanel title={title} message={error.message} onRetry={reset} />
    </div>
  );
}
