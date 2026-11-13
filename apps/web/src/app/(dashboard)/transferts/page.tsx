/**
 * Transfers Page
 *
 * Server Component rendering the TransfersGuard (prefetch + hydration).
 *
 * @module App/Dashboard/Transfers
 */

import { TransfersGuard } from '@/components/transfers/transfers-guard';
import { JSX } from 'react';

export default function TransfersPage(): JSX.Element {
  return <TransfersGuard />;
}
