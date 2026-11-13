/**
 * Barrel export for the typed front repositories.
 *
 * Each repository consumes its /api routes and validates responses with
 * the shared zod schemas (single source of truth, R7).
 *
 * @module Lib/Repositories
 */
export { accountsRepository } from './accounts.repository';
export { chargesRepository } from './charges.repository';
export { membersRepository } from './members.repository';
export { paymentsRepository } from './payments.repository';
export { snapshotsRepository } from './snapshots.repository';
export { transactionsRepository } from './transactions.repository';
export { transfersRepository } from './transfers.repository';
