/**
 * Transfers Page
 *
 * Server Component rendering the TransfersGuard (prefetch + hydration).
 *
 * @module App/Dashboard/Transfers
 */

import { TransfersView } from '@/components/transfers/transfers-view';
import { JSX } from 'react';

export default function TransfersPage(): JSX.Element {
  return <TransfersView />;
}
