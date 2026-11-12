# Requirements Document

## Introduction

Ce document définit les exigences du M1 (socle) de l'application Mbongo — une application budgétaire mobile-first PWA pour un couple vivant entre la France et la Suisse, gérant deux devises (CHF et EUR). Le M1 implémente les fonctionnalités fondamentales : gestion des comptes bancaires (F1), transactions manuelles (F2), transferts inter-comptes 2 phases CHF→EUR (F5), snapshots de solde manuels (F7 partiel) et lecture des membres du foyer. La stack est Next.js BFF + Prisma + SQLite + Zod + TanStack Query + date-fns.

## Glossary

- **System**: L'application Mbongo dans son ensemble.
- **API**: Les routes HTTP exposées sous `/api` par l'application Next.js.
- **Service**: Classe backend (NestJS-like) responsable du CRUD et des opérations transactionnelles sur un domaine.
- **Controller**: Classe backend responsable de la validation Zod à l'entrée et de la délégation au Service.
- **Repository**: Module frontend mince qui implémente les appels HTTP vers `/api`, sans logique métier.
- **RSC**: React Server Component — composant serveur qui lit directement via les Services, sans passer par `/api`.
- **Member**: Membre du foyer (Anco ou partenaire). Géré en lecture seule en M1.
- **Account**: Compte bancaire ou financier d'un membre ou du couple (courant, carte, joint, épargne).
- **Transaction**: Mouvement financier signé sur un compte. Montant positif = crédit, montant négatif = débit.
- **Transfer**: Transfert inter-comptes 2 phases. Phase 1 : estimation CHF→EUR avec taux de référence. Phase 2 : saisie du montant réellement reçu.
- **BalanceSnapshot**: Capture manuelle du solde réel d'un compte à une date donnée, servant à ancrer et corriger le solde calculé.
- **ComputedBalance**: Solde calculé côté UI = `openingBalance + Σ(transaction.amount)`.
- **SnapshotGap**: Écart entre solde réel déclaré et solde calculé = `snapshot.balance − ComputedBalance`.
- **OpeningBalance**: Solde initial du compte au moment de sa création, point de départ du calcul.
- **SharedDomain**: Fonctions pures dans `packages/shared/src/domain/`, sans dépendance React ni Prisma.
- **ZodSchema**: Schéma Zod dans `packages/shared/src/schemas/`, source de vérité unique pour les types.
- **PrismaTransaction**: Opération atomique Prisma (`$transaction`) regroupant plusieurs écritures DB.

## Requirements

### Requirement 1: Schémas Zod et types partagés

**User Story:** As a developer, I want a single source of truth for all data types and validation rules in `packages/shared`, so that the frontend, backend, and API all use consistent schemas without duplication.

#### Acceptance Criteria

1. THE System SHALL define a `memberSchema` Zod object in `packages/shared/src/schemas/member.ts` with fields `id` (UUID), `firstName` (string min 1), `role` (enum `PRIMARY` | `PARTNER`), `createdAt` (ISO 8601 date), `updatedAt` (ISO 8601 date).

2. THE System SHALL define an `accountSchema` Zod object in `packages/shared/src/schemas/account.ts` with fields `id`, `name`, `bank`, `currency` (enum `CHF` | `EUR`), `accountType` (enum `CURRENT` | `CREDIT_CARD` | `JOINT` | `SAVINGS`), `memberId` (nullable UUID), `overdraftLimit` (number, default 0), `deferredCard` (boolean, default false), `billingDay` (nullable integer 1–31), `openingBalance` (number, default 0), `status` (enum `ACTIVE` | `CLOSED`), `closedAt` (nullable ISO date), `createdAt`, `updatedAt`.

3. THE System SHALL define a `transactionSchema` Zod object in `packages/shared/src/schemas/transaction.ts` with fields `id`, `accountId` (UUID), `date` (ISO 8601 date), `amount` (signed number, non-zero), `category` (nullable string), `note` (nullable string), `transferId` (nullable UUID), `transferRole` (nullable enum `SOURCE` | `TARGET`), `createdAt`, `updatedAt`.

4. THE System SHALL define a `transferSchema` Zod object in `packages/shared/src/schemas/transfer.ts` with fields `id`, `sourceAccountId` (UUID), `targetAccountId` (UUID), `amountSent` (positive number), `rateEstimated` (positive number), `rateDate` (ISO 8601 date), `amountReceived` (nullable positive number), `rateEffective` (nullable positive number), `fees` (nullable number), `memo` (nullable string), `status` (enum `ESTIMATED` | `COMPLETED`), `sentAt` (ISO 8601 date), `receivedAt` (nullable ISO date), `createdAt`, `updatedAt`.

5. THE System SHALL define a `balanceSnapshotSchema` Zod object in `packages/shared/src/schemas/snapshot.ts` with fields `id`, `accountId` (UUID), `date` (ISO 8601 date), `balance` (number), `note` (nullable string), `createdAt`, `updatedAt`.

6. THE System SHALL derive `createAccountSchema`, `updateAccountSchema`, and `accountQuerySchema` from `accountSchema` using `zod.omit`, `zod.partial`, and field-specific query operators, following the same pattern as the existing `chargeSchema`.

7. THE System SHALL derive `createTransactionSchema`, `updateTransactionSchema`, and `transactionQuerySchema` from `transactionSchema`.

8. THE System SHALL define `createTransferSchema` (phase 1 fields only: `sourceAccountId`, `targetAccountId`, `amountSent`, `rateEstimated`, `rateDate`, `sentAt`, `memo`) and `updateTransferSchema` (phase 2 fields: `amountReceived`, `receivedAt`) as distinct Zod schemas derived from `transferSchema`.

9. THE System SHALL define `createSnapshotSchema` and `snapshotQuerySchema` derived from `balanceSnapshotSchema`.

10. THE System SHALL export TypeScript types (`Member`, `Account`, `Transaction`, `Transfer`, `BalanceSnapshot` and their input variants) inferred from the Zod schemas using `z.infer`, never using TypeScript `Partial<T>` directly.

11. WHERE a schema requires a cross-field constraint, THE System SHALL use `superRefine` on the Zod schema to enforce it (e.g., `createTransferSchema` must validate that `sourceAccountId !== targetAccountId`).

---

### Requirement 2: Domaine pur (calculs partagés)

**User Story:** As a developer, I want pure computation functions in `packages/shared/src/domain/`, so that balance and conversion calculations are testable in isolation and reusable in both the UI and tests without any server-side dependency.

#### Acceptance Criteria

1. THE SharedDomain SHALL expose a `computeBalance(account: { openingBalance: number }, transactions: Array<{ amount: number }>): number` function in `balance.ts` that returns `account.openingBalance + Σ(transaction.amount)`.

2. WHEN the transactions array is empty, THE SharedDomain SHALL return `account.openingBalance` unchanged from `computeBalance`.

3. THE SharedDomain SHALL expose a `computeSnapshotGap(snapshot: { balance: number }, calculatedBalance: number): number` function in `balance.ts` that returns `snapshot.balance − calculatedBalance`.

4. THE SharedDomain SHALL expose an `isOverdraft(account: { overdraftLimit: number }, balance: number): boolean` function in `balance.ts` that returns `true` when `balance < −account.overdraftLimit`.

5. THE SharedDomain SHALL expose a `counterValue(amount: number, rate: number): number` function in `conversion.ts` that returns `amount × rate`, rounded to 2 decimal places.

6. THE SharedDomain SHALL expose an `effectiveRate(amountReceived: number, amountSent: number): number` function in `conversion.ts` that returns `amountReceived / amountSent`, rounded to 5 decimal places.

7. THE SharedDomain SHALL expose a `transferFees(amountEstimated: number, amountReceived: number): number` function in `conversion.ts` that returns `amountEstimated − amountReceived`, rounded to 2 decimal places.

8. THE SharedDomain SHALL contain zero imports from React, Next.js, Prisma, or any other framework — only `date-fns` and other `packages/shared` modules are permitted.

---

### Requirement 3: Contrats HTTP partagés

**User Story:** As a developer, I want typed HTTP contracts in `packages/shared/src/contracts/`, so that the frontend repositories and backend controllers share a single definition of all API operations and their input/output types.

#### Acceptance Criteria

1. THE System SHALL define a contract for each resource (members, accounts, transactions, transfers, snapshots) in `packages/shared/src/contracts/`, exporting operation types (`FindMany`, `FindOne`, `Create`, `Update`, `Remove`) derived from the corresponding ZodSchemas.

2. THE System SHALL define a `TransferPhase2Update` contract type for the PATCH `/api/transfers/:id` operation, typed separately from the generic `UpdateTransfer` to reflect that only phase-2 fields (`amountReceived`, `receivedAt`) are accepted.

3. THE System SHALL export all contracts from `packages/shared/src/contracts/index.ts` for unified import by consumers.

---

### Requirement 4: Modèle Prisma et migration

**User Story:** As a developer, I want a complete Prisma schema that adds Member, Transaction, Transfer, and BalanceSnapshot models and migrates the existing Account model, so that all M1 data can be persisted without losing existing charge and payment data.

#### Acceptance Criteria

1. THE System SHALL add `Member`, `Transaction`, `Transfer`, and `BalanceSnapshot` models to `apps/web/prisma/schema.prisma` as specified in `docs/specs/m1-poc/SPEC.md`.

2. THE System SHALL migrate the existing `Account` model non-destructively: renaming `balance` to `openingBalance`, replacing `isActive` with a `status` string field (`ACTIVE` | `CLOSED`), adding `bank`, `accountType`, `memberId`, `overdraftLimit`, `deferredCard`, `billingDay`, `closedAt`, and linking to `Member`, `Transaction`, `Transfer`, `BalanceSnapshot` relations while preserving the existing `charges` relation.

3. THE System SHALL index `Transaction(accountId, date)`, `Transfer(status)`, `Transfer(sourceAccountId)`, `Transfer(targetAccountId)`, and `BalanceSnapshot(accountId, date)` in the Prisma schema.

4. WHEN the Prisma migration runs, THE System SHALL preserve all existing `Charge` and `Payment` rows and their `accountId` foreign keys.

5. THE System SHALL provide a seed script (`apps/web/prisma/seed.ts`) that creates at least two Members, three Accounts (one CHF, one EUR, one joint), sample Transactions, one Transfer in ESTIMATED status, and one BalanceSnapshot, matching the household data described in `docs/specs/m1-poc/SPEC.md § cdc §2.1`.

---

### Requirement 5: Services backend

**User Story:** As a developer, I want NestJS-like service classes for each domain resource, so that all CRUD operations and transactional business logic are encapsulated and testable independently from the HTTP transport layer.

#### Acceptance Criteria

1. THE System SHALL implement `MemberService` in `apps/web/src/server/members/member.service.ts` with a `findMany(): Promise<Member[]>` method returning all members (read-only in M1, no create/update/delete).

2. THE System SHALL implement `AccountService` in `apps/web/src/server/accounts/account.service.ts` with `findMany(query)`, `findOne(id)`, `create(input)`, `update(id, input)`, and `remove(id)` methods following the conventions in `CONVENTIONS.md`.

3. WHEN `AccountService.remove` is called and the account has at least one associated Transaction, Transfer, BalanceSnapshot, or Charge, THE System SHALL throw an `HttpError` with status 409 and message `"Account has existing data — close it instead"`.

4. THE System SHALL implement `AccountService.close(id)` as a dedicated method that sets `status = "CLOSED"` and `closedAt = new Date()` using a Prisma `update`.

5. THE System SHALL implement `TransactionService` with `findMany(query)`, `findOne(id)`, `create(input)`, `update(id, input)`, and `remove(id)` methods.

6. WHEN `TransactionService.remove` is called and the transaction has a non-null `transferId`, THE System SHALL throw an `HttpError` with status 409 and message `"Transaction is linked to a transfer and cannot be deleted"`.

7. THE System SHALL implement `TransferService` with `findMany(query)`, `findOne(id)`, `create(input)`, and `update(id, input)` methods.

8. WHEN `TransferService.create` is called, THE System SHALL execute a PrismaTransaction that atomically creates the Transfer record and one debit Transaction on the source account (`amount = −amountSent`, `transferRole = "SOURCE"`).

9. WHEN `TransferService.create` is called and the source account currency is not `CHF` or the target account currency is not `EUR`, THE System SHALL throw an `HttpError` with status 422 and message `"Transfer requires a CHF source account and an EUR target account"`.

10. WHEN `TransferService.create` is called and `sourceAccountId === targetAccountId`, THE System SHALL throw an `HttpError` with status 422 and message `"Source and target accounts must be different"`.

11. WHEN `TransferService.update` is called for phase 2 and the transfer `status` is already `COMPLETED`, THE System SHALL throw an `HttpError` with status 409 and message `"Transfer is already completed"`.

12. WHEN `TransferService.update` is called for phase 2 with a valid `amountReceived`, THE System SHALL execute a PrismaTransaction that atomically: computes `rateEffective` and `fees` using the SharedDomain functions, updates the Transfer record (`status = "COMPLETED"`, `rateEffective`, `fees`, `receivedAt`), and creates one credit Transaction on the target account (`amount = +amountReceived`, `transferRole = "TARGET"`).

13. THE System SHALL implement `SnapshotService` with `findMany(query)`, `findOne(id)`, and `create(input)` methods. The `create` method persists only the snapshot record; no adjustment transaction is created automatically.

14. THE System SHALL export each service as a singleton following the `globalThis` pattern used in the existing codebase.

---

### Requirement 6: Controllers et routes API

**User Story:** As a developer, I want controller classes and minimal route files for all M1 resources, so that the HTTP transport layer validates inputs with Zod, delegates to the appropriate service, and maps errors to standard HTTP responses.

#### Acceptance Criteria

1. THE System SHALL implement `MembersController` in `apps/web/src/server/members/members.controller.ts` with a `find(request)` method that returns all members as JSON 200.

2. THE System SHALL implement `AccountsController` with `find`, `create`, `findOne`, `update`, `close`, and `remove` methods.

3. THE System SHALL implement `TransactionsController` with `find`, `create`, `findOne`, `update`, and `remove` methods.

4. THE System SHALL implement `TransfersController` with `find`, `create`, `findOne`, and `update` methods, where `update` handles the phase-2 completion payload.

5. THE System SHALL implement `SnapshotsController` with `find`, `create`, and `findOne` methods.

6. WHEN a controller receives an invalid request body or query parameters, THE System SHALL return HTTP 400 with a JSON body containing Zod flattened errors.

7. WHEN a service throws an `HttpError`, THE System SHALL return the corresponding HTTP status code and error details via `toErrorResponse`.

8. THE System SHALL create route files at the following paths, containing only wiring (export of controller method delegates, no logic):
   - `apps/web/src/app/api/members/route.ts` — GET
   - `apps/web/src/app/api/accounts/route.ts` — GET, POST
   - `apps/web/src/app/api/accounts/[id]/route.ts` — GET, PATCH, DELETE
   - `apps/web/src/app/api/transactions/route.ts` — GET, POST
   - `apps/web/src/app/api/transactions/[id]/route.ts` — GET, PATCH, DELETE
   - `apps/web/src/app/api/transfers/route.ts` — GET, POST
   - `apps/web/src/app/api/transfers/[id]/route.ts` — GET, PATCH
   - `apps/web/src/app/api/snapshots/route.ts` — GET, POST
   - `apps/web/src/app/api/snapshots/[id]/route.ts` — GET

9. THE System SHALL add a `close` action route at `apps/web/src/app/api/accounts/[id]/close/route.ts` — PATCH.

---

### Requirement 7: Repositories frontend

**User Story:** As a frontend developer, I want thin HTTP repository modules in `apps/web/src/lib/repositories/`, so that all browser-side API calls go through a single typed layer with no business logic.

#### Acceptance Criteria

1. THE System SHALL implement one repository file per resource: `accounts.repository.ts`, `transactions.repository.ts`, `transfers.repository.ts`, `snapshots.repository.ts`, `members.repository.ts` in `apps/web/src/lib/repositories/`.

2. THE System SHALL implement the `findMany`, `findOne`, `create`, `update`, and `remove` operations in each repository where they apply, using `fetch` with typed inputs and outputs derived from the HTTP contracts.

3. THE System SHALL implement a `completeTransfer(id, input)` method in `transfers.repository.ts` that sends a PATCH to `/api/transfers/:id` with the phase-2 payload.

4. THE System SHALL implement a `closeAccount(id)` method in `accounts.repository.ts` that sends a PATCH to `/api/accounts/:id/close`.

5. THE Repository SHALL contain no business logic, no balance calculations, and no Zod schema references — only fetch calls and type coercions from the shared contracts.

---

### Requirement 8: Pages RSC et navigation

**User Story:** As a user, I want three main screens accessible from the bottom navigation bar (Comptes, Transactions, Transferts), so that I can manage all M1 financial data from a mobile-first interface.

#### Acceptance Criteria

1. THE System SHALL create a page at `apps/web/src/app/(dashboard)/comptes/page.tsx` as an RSC that reads accounts via `AccountService.findMany` and renders the accounts list with computed balance per account.

2. THE System SHALL create a page at `apps/web/src/app/(dashboard)/transactions/page.tsx` as an RSC that reads transactions via `TransactionService.findMany` and renders the transactions list.

3. THE System SHALL create a page at `apps/web/src/app/(dashboard)/transferts/page.tsx` as an RSC that reads transfers via `TransferService.findMany` and renders the transfers list with ESTIMATED/COMPLETED badges.

4. WHEN an RSC page reads data, THE System SHALL call the Service directly — it SHALL NOT issue a fetch request to its own `/api` routes.

5. THE System SHALL wrap each RSC page in a guard component (e.g., `accounts-guard.tsx`) using `<Suspense>` with a loading skeleton and an `error.tsx` sibling for error boundaries.

6. THE System SHALL display the ComputedBalance per account on the accounts page, calculated in the UI using `computeBalance` from SharedDomain applied to the account's transactions.

7. THE System SHALL display the estimated counter-value in EUR on phase-1 transfer cards, calculated using `counterValue(amountSent, rateEstimated)` from SharedDomain, with the rate date shown as "taux au JJ/MM/AAAA".

8. WHERE a transfer is in COMPLETED status, THE System SHALL display the effective rate and fees on the transfer card, calculated from the persisted `rateEffective` and `fees` fields.

---

### Requirement 9: Hooks TanStack Query et mutations

**User Story:** As a frontend developer, I want TanStack Query hooks that wrap the frontend repositories, so that all client-side data fetching and mutation is cached, invalidated correctly, and never uses direct fetch calls inside components.

#### Acceptance Criteria

1. THE System SHALL implement `useAccounts()`, `useTransactions(accountId?: string)`, `useTransfers()`, `useSnapshots(accountId: string)`, and `useMembers()` hooks in `apps/web/src/hooks/` using TanStack Query `useQuery`.

2. THE System SHALL implement mutation hooks (`useCreateAccount`, `useUpdateAccount`, `useCloseAccount`, `useCreateTransaction`, `useUpdateTransaction`, `useDeleteTransaction`, `useCreateTransfer`, `useCompleteTransfer`, `useCreateSnapshot`) using TanStack Query `useMutation`.

3. WHEN a mutation succeeds, THE System SHALL invalidate the relevant query cache keys to trigger a refetch of the affected resource list.

4. THE Hook SHALL call Repository methods only — it SHALL NOT contain fetch calls, Zod parsing, or business logic.

---

### Requirement 10: Tests

**User Story:** As a developer, I want a suite of unit tests for the shared domain, integration tests for the services, and smoke tests for the API endpoints, so that the M1 implementation is verifiable and regressions are caught automatically.

#### Acceptance Criteria

1. THE System SHALL provide unit tests for all SharedDomain functions covering the cases defined in `docs/specs/m1-poc/SPEC.md` (UT-001 through UT-007), including: `computeBalance` with and without transactions, `computeSnapshotGap`, `effectiveRate`, `transferFees`, `counterValue`, and Zod currency validation rejecting `"USD"`.

2. THE System SHALL provide integration tests (IT-001 through IT-005) that exercise `TransferService.create` (phase 1) and `TransferService.update` (phase 2) against a real SQLite test database, verifying that the correct transactions are created and status transitions are enforced.

3. THE System SHALL provide integration tests for `AccountService.remove` verifying the 409 response when the account has linked data, and 204 when the account is empty.

4. THE System SHALL provide smoke API tests (AT-001 through AT-004) covering the happy-path scenarios defined in `docs/specs/m1-poc/SPEC.md`.

5. WHEN a Zod schema receives an invalid payload, THE System SHALL return HTTP 400 with validation error details — this MUST be verified by at least one API smoke test (AT-004).
