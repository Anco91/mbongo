# Design Document

## Overview

Ce document décrit l'architecture et le design de l'implémentation M1 de Mbongo — le socle financier qui rend saisissable le flux « salaire CHF → UBS → Telexoo → BoursoBank → joint ». La stack est Next.js App Router (BFF), Prisma + SQLite, Zod, TanStack Query et date-fns.

Le M1 ajoute cinq ressources (Member, Account remanié, Transaction, Transfer, BalanceSnapshot) en conservant le module `Charge`/`Payment` existant compilable et sans perte de données.

---

## Architecture

### Vue d'ensemble

```
┌──────────────────────────────────────────────────────────────────────┐
│  Browser (PWA mobile-first)                                          │
│                                                                       │
│  RSC Pages (Comptes / Transactions / Transferts)                     │
│    └─ Guard (HydrationBoundary + Suspense)                           │
│         └─ View  ← useXxx() hooks                                    │
│              └─ repositories/  ──HTTP──► /api/*                      │
└──────────────────────────────────────────────────────────────────────┘
        │ RSC reads directly (no HTTP)
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Next.js Server                                                       │
│                                                                       │
│  app/api/**/route.ts  ←  pure wiring, delegates to controller        │
│  server/<module>/                                                     │
│    ├─ <module>.service.ts      CRUD + atomic operations              │
│    └─ <module>.controller.ts   Zod validation + delegation           │
│  server/common/                                                       │
│    ├─ http.ts          parseBody / parseQuery / toErrorResponse       │
│    └─ filter-to-where.ts       Filter → Prisma where                 │
│  server/db.ts          PrismaClient singleton                         │
└──────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│  packages/shared/src/                                                 │
│    schemas/      Zod schemas — source de vérité unique               │
│    domain/       fonctions pures (balance, conversion)               │
│    contracts/    interfaces HTTP typées par ressource                 │
└──────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│  SQLite / Prisma                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Règles structurelles

| Couche | Responsabilité | Interdit |
|--------|---------------|----------|
| `route.ts` | Wiring pur — délégation au controller | Logique, validation |
| Controller | Validation Zod + délégation au service | Accès Prisma direct |
| Service | CRUD + opérations atomiques | Calculs de présentation |
| Guard (RSC) | Prefetch serveur via service | Appels fetch vers `/api` |
| Hook (`useXxx`) | Cache TanStack Query | fetch direct, Zod |
| Repository frontend | Appels HTTP typés vers `/api` | Logique métier |
| `packages/shared/domain` | Calculs purs | Imports React/Next/Prisma |

---

## Data Models

### Migration non-destructive de `Account`

Le modèle `Account` existant est étendu : `balance` est renommé en `openingBalance`, `isActive` devient `status` (string `ACTIVE`/`CLOSED`). Les colonnes existantes et la relation `charges` sont conservées.

```prisma
// ─── Foyer ───────────────────────────────────────────────────────────────────
model Member {
  id        String    @id @default(uuid())
  firstName String
  role      String    // "PRIMARY" | "PARTNER"
  accounts  Account[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  @@map("members")
}

// ─── Comptes ─────────────────────────────────────────────────────────────────
model Account {
  id                String            @id @default(uuid())
  name              String
  bank              String?
  currency          String            // "CHF" | "EUR"
  accountType       String            // "CURRENT"|"CREDIT_CARD"|"JOINT"|"SAVINGS"
  memberId          String?
  member            Member?           @relation(fields: [memberId], references: [id])
  overdraftLimit    Float             @default(0)
  deferredCard      Boolean           @default(false)
  billingDay        Int?
  openingBalance    Float             @default(0)   // renommé depuis balance
  status            String            @default("ACTIVE") // "ACTIVE" | "CLOSED"
  closedAt          DateTime?
  transactions      Transaction[]
  snapshots         BalanceSnapshot[]
  charges           Charge[]          // relation existante conservée
  outgoingTransfers Transfer[]        @relation("TransferSourceAccount")
  incomingTransfers Transfer[]        @relation("TransferTargetAccount")
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  @@index([memberId])
  @@index([status])
  @@map("accounts")
}

// ─── Transactions ─────────────────────────────────────────────────────────────
model Transaction {
  id           String    @id @default(uuid())
  accountId    String
  account      Account   @relation(fields: [accountId], references: [id])
  date         DateTime
  amount       Float     // SIGNÉ : négatif = débit, positif = crédit, non-zéro
  category     String?
  note         String?
  transferId   String?
  transfer     Transfer? @relation(fields: [transferId], references: [id])
  transferRole String?   // "SOURCE" | "TARGET"
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  @@index([accountId, date])
  @@map("transactions")
}

// ─── Transferts 2 phases ──────────────────────────────────────────────────────
model Transfer {
  id              String        @id @default(uuid())
  sourceAccountId String
  sourceAccount   Account       @relation("TransferSourceAccount", fields: [sourceAccountId], references: [id])
  targetAccountId String
  targetAccount   Account       @relation("TransferTargetAccount", fields: [targetAccountId], references: [id])
  amountSent      Float
  rateEstimated   Float
  rateDate        DateTime
  amountReceived  Float?
  rateEffective   Float?
  fees            Float?
  memo            String?
  status          String        @default("ESTIMATED") // "ESTIMATED" | "COMPLETED"
  sentAt          DateTime
  receivedAt      DateTime?
  transactions    Transaction[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  @@index([status])
  @@index([sourceAccountId])
  @@index([targetAccountId])
  @@map("transfers")
}

// ─── Snapshots de solde ───────────────────────────────────────────────────────
model BalanceSnapshot {
  id        String   @id @default(uuid())
  accountId String
  account   Account  @relation(fields: [accountId], references: [id])
  date      DateTime
  balance   Float
  note      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([accountId, date])
  @@map("balance_snapshots")
}
```

---

## Components and Interfaces

### 1. `packages/shared` — Source de vérité unique

#### Schémas Zod (`schemas/`)

Chaque fichier suit le pattern de `charge.ts` : schéma principal, schémas dérivés avec `omit`/`partial`, types `z.infer`.

```typescript
// schemas/account.ts
export const accountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  bank: z.string().nullable(),
  currency: z.enum(['CHF', 'EUR']),
  accountType: z.enum(['CURRENT', 'CREDIT_CARD', 'JOINT', 'SAVINGS']),
  memberId: z.string().uuid().nullable(),
  overdraftLimit: z.number().default(0),
  deferredCard: z.boolean().default(false),
  billingDay: z.number().int().min(1).max(31).nullable(),
  openingBalance: z.number().default(0),
  status: z.enum(['ACTIVE', 'CLOSED']),
  closedAt: isoDate.nullable(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

export const createAccountSchema = accountSchema.omit({
  id: true, createdAt: true, updatedAt: true,
});
export const updateAccountSchema = createAccountSchema.partial();
export const accountQuerySchema = z.object({
  name: filterSchema.optional(),
  currency: filterSchema.optional(),
  accountType: filterSchema.optional(),
  memberId: filterSchema.optional(),
  status: filterSchema.optional(),
  limit: z.coerce.number().int().positive().max(500).default(100).optional(),
  cursor: z.string().optional(),
  orderBy: z.enum(['createdAt', 'name']).optional(),
  orderDirection: z.enum(['asc', 'desc']).default('desc').optional(),
});

// schemas/transaction.ts
export const transactionSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  date: isoDate,
  amount: z.number().refine((v) => v !== 0, 'Amount must be non-zero'),
  category: z.string().nullable(),
  note: z.string().nullable(),
  transferId: z.string().uuid().nullable(),
  transferRole: z.enum(['SOURCE', 'TARGET']).nullable(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

// schemas/transfer.ts — createTransferSchema valide sourceAccountId !== targetAccountId
export const createTransferSchema = transferSchema
  .omit({ id: true, amountReceived: true, rateEffective: true,
          fees: true, status: true, receivedAt: true, createdAt: true, updatedAt: true })
  .superRefine((data, ctx) => {
    if (data.sourceAccountId === data.targetAccountId) {
      ctx.addIssue({
        code: 'custom',
        path: ['targetAccountId'],
        message: 'Source and target accounts must be different',
      });
    }
  });

export const updateTransferSchema = z.object({
  amountReceived: z.number().positive(),
  receivedAt: isoDate,
});
```

#### Domaine pur (`domain/`)

```typescript
// domain/balance.ts
export function computeBalance(
  account: { openingBalance: number },
  transactions: Array<{ amount: number }>
): number {
  return transactions.reduce((sum, tx) => sum + tx.amount, account.openingBalance);
}

export function computeSnapshotGap(
  snapshot: { balance: number },
  calculatedBalance: number
): number {
  return snapshot.balance - calculatedBalance;
}

export function isOverdraft(
  account: { overdraftLimit: number },
  balance: number
): boolean {
  return balance < -account.overdraftLimit;
}

// domain/conversion.ts
export function counterValue(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100;
}

export function effectiveRate(amountReceived: number, amountSent: number): number {
  return Math.round((amountReceived / amountSent) * 100000) / 100000;
}

export function transferFees(amountEstimated: number, amountReceived: number): number {
  return Math.round((amountEstimated - amountReceived) * 100) / 100;
}
```

#### Contrats HTTP (`contracts/`)

```typescript
// contracts/accounts.http.ts
export interface AccountHttp {
  findMany(query?: AccountQuery): Promise<Account[]>;
  findOne(id: string): Promise<Account>;
  create(input: CreateAccountInput): Promise<Account>;
  update(id: string, input: UpdateAccountInput): Promise<Account>;
  close(id: string): Promise<Account>;
  remove(id: string): Promise<void>;
}

// contracts/transfers.http.ts
export interface TransferHttp {
  findMany(query?: TransferQuery): Promise<Transfer[]>;
  findOne(id: string): Promise<Transfer>;
  create(input: CreateTransferInput): Promise<Transfer>;
  completeTransfer(id: string, input: UpdateTransferInput): Promise<Transfer>;
}
```

---

### 2. Services backend (`apps/web/src/server/`)

Chaque service suit le pattern singleton `globalThis` de `charge.service.ts`.

#### `AccountService`

```typescript
// server/accounts/account.service.ts
export class AccountService {
  async findMany(query: AccountQuery): Promise<Account[]> { /* ... */ }
  async findOne(id: string): Promise<Account> { /* ... */ }
  async create(input: CreateAccountInput): Promise<Account> { /* ... */ }
  async update(id: string, input: UpdateAccountInput): Promise<Account> { /* ... */ }

  async close(id: string): Promise<Account> {
    const existing = await prisma.account.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Account', id);
    return prisma.account.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date() },
    });
  }

  async remove(id: string): Promise<void> {
    const existing = await prisma.account.findUnique({
      where: { id },
      include: { transactions: { take: 1 }, snapshots: { take: 1 },
                 outgoingTransfers: { take: 1 }, charges: { take: 1 } },
    });
    if (!existing) throw new NotFoundError('Account', id);
    const hasData =
      existing.transactions.length > 0 ||
      existing.snapshots.length > 0 ||
      existing.outgoingTransfers.length > 0 ||
      existing.charges.length > 0;
    if (hasData) {
      throw new HttpError(409, 'Account has existing data — close it instead');
    }
    await prisma.account.delete({ where: { id } });
  }
}
```

#### `TransactionService`

```typescript
// server/transactions/transaction.service.ts
async remove(id: string): Promise<void> {
  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Transaction', id);
  if (existing.transferId !== null) {
    throw new HttpError(409, 'Transaction is linked to a transfer and cannot be deleted');
  }
  await prisma.transaction.delete({ where: { id } });
}
```

#### `TransferService` — opérations atomiques

```typescript
// server/transfers/transfer.service.ts
async create(input: CreateTransferInput): Promise<Transfer> {
  // Valider les comptes
  const [src, tgt] = await Promise.all([
    prisma.account.findUnique({ where: { id: input.sourceAccountId } }),
    prisma.account.findUnique({ where: { id: input.targetAccountId } }),
  ]);
  if (!src) throw new NotFoundError('Account', input.sourceAccountId);
  if (!tgt) throw new NotFoundError('Account', input.targetAccountId);
  if (src.currency !== 'CHF' || tgt.currency !== 'EUR') {
    throw new HttpError(422, 'Transfer requires a CHF source account and an EUR target account');
  }

  // $transaction atomique : Transfer + débit source
  return prisma.$transaction(async (tx) => {
    const transfer = await tx.transfer.create({ data: { ...input, status: 'ESTIMATED' } });
    await tx.transaction.create({
      data: {
        accountId: input.sourceAccountId,
        date: parseISO(input.sentAt),
        amount: -input.amountSent,
        transferId: transfer.id,
        transferRole: 'SOURCE',
      },
    });
    return transfer;
  });
}

async update(id: string, input: UpdateTransferInput): Promise<Transfer> {
  const existing = await prisma.transfer.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Transfer', id);
  if (existing.status === 'COMPLETED') {
    throw new HttpError(409, 'Transfer is already completed');
  }

  // Calculs via SharedDomain
  const estimated = counterValue(existing.amountSent, existing.rateEstimated);
  const rateEff = effectiveRate(input.amountReceived, existing.amountSent);
  const fees = transferFees(estimated, input.amountReceived);

  // $transaction atomique : mise à jour Transfer + crédit cible
  return prisma.$transaction(async (tx) => {
    const updated = await tx.transfer.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        amountReceived: input.amountReceived,
        receivedAt: parseISO(input.receivedAt),
        rateEffective: rateEff,
        fees,
      },
    });
    await tx.transaction.create({
      data: {
        accountId: existing.targetAccountId,
        date: parseISO(input.receivedAt),
        amount: input.amountReceived,
        transferId: id,
        transferRole: 'TARGET',
      },
    });
    return updated;
  });
}
```

#### `SnapshotService`

```typescript
// server/snapshots/snapshot.service.ts
// create : persiste le snapshot uniquement, aucune transaction d'ajustement
async create(input: CreateSnapshotInput): Promise<BalanceSnapshot> {
  return prisma.balanceSnapshot.create({ data: { ...input, date: parseISO(input.date) } });
}
```

---

### 3. Controllers et routes API

Chaque controller suit le pattern de `charges.controller.ts` : `try/catch`, `parseBody`/`parseQuery`, délégation au service, `toErrorResponse`.

#### `AccountsController` — méthode `close` supplémentaire

```typescript
// server/accounts/accounts.controller.ts
async close(id: string): Promise<NextResponse> {
  try {
    const account = await this.accounts.close(id);
    return toSuccessResponse(account);
  } catch (error) {
    return toErrorResponse(error);
  }
}
```

#### Routes API (wiring pur)

```typescript
// app/api/accounts/route.ts
export const GET = (req: Request) => accountsController.find(req);
export const POST = (req: Request) => accountsController.create(req);

// app/api/accounts/[id]/route.ts
type Ctx = { params: Promise<{ id: string }> };
export const GET    = async (_req: Request, { params }: Ctx) =>
  accountsController.findOne((await params).id);
export const PATCH  = async (req: Request, { params }: Ctx) =>
  accountsController.update(req, (await params).id);
export const DELETE = async (_req: Request, { params }: Ctx) =>
  accountsController.remove((await params).id);

// app/api/accounts/[id]/close/route.ts
export const PATCH = async (_req: Request, { params }: Ctx) =>
  accountsController.close((await params).id);

// app/api/transfers/[id]/route.ts — PATCH = phase 2
export const PATCH = async (req: Request, { params }: Ctx) =>
  transfersController.update(req, (await params).id);
```

Toutes les routes API M1 créées :

| Méthode | Route | Controller.method |
|---------|-------|------------------|
| GET | `/api/members` | `membersController.find` |
| GET, POST | `/api/accounts` | `find`, `create` |
| GET, PATCH, DELETE | `/api/accounts/[id]` | `findOne`, `update`, `remove` |
| PATCH | `/api/accounts/[id]/close` | `close` |
| GET, POST | `/api/transactions` | `find`, `create` |
| GET, PATCH, DELETE | `/api/transactions/[id]` | `findOne`, `update`, `remove` |
| GET, POST | `/api/transfers` | `find`, `create` |
| GET, PATCH | `/api/transfers/[id]` | `findOne`, `update` (phase 2) |
| GET, POST | `/api/snapshots` | `find`, `create` |
| GET | `/api/snapshots/[id]` | `findOne` |

---

### 4. Repositories frontend (`apps/web/src/lib/repositories/`)

Chaque repository implémente le contrat HTTP partagé via `fetch`. Pas de logique métier, pas de Zod, pas de calculs.

```typescript
// lib/repositories/accounts.repository.ts
const BASE = '/api/accounts';

export const accountsRepository = {
  async findMany(query?: AccountQuery): Promise<Account[]> {
    const params = query ? `?${new URLSearchParams(/* query → params */)}` : '';
    const res = await fetch(`${BASE}${params}`);
    if (!res.ok) throw await res.json();
    const { data } = await res.json();
    return data as Account[];
  },
  async findOne(id: string): Promise<Account> { /* ... */ },
  async create(input: CreateAccountInput): Promise<Account> {
    const res = await fetch(BASE, { method: 'POST', body: JSON.stringify(input),
                                    headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) throw await res.json();
    const { data } = await res.json();
    return data as Account;
  },
  async update(id: string, input: UpdateAccountInput): Promise<Account> { /* ... */ },
  async closeAccount(id: string): Promise<Account> {
    const res = await fetch(`${BASE}/${id}/close`, { method: 'PATCH' });
    if (!res.ok) throw await res.json();
    const { data } = await res.json();
    return data as Account;
  },
  async remove(id: string): Promise<void> { /* ... */ },
};

// lib/repositories/transfers.repository.ts
export const transfersRepository = {
  // ... findMany, findOne, create
  async completeTransfer(id: string, input: UpdateTransferInput): Promise<Transfer> {
    const res = await fetch(`/api/transfers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw await res.json();
    const { data } = await res.json();
    return data as Transfer;
  },
};
```

---

### 5. Pages RSC et guards

Chaque onglet M1 suit le pattern de `charges-guard.tsx` : Guard (RSC async, prefetch via service) → View (client, hooks TanStack Query).

```
apps/web/src/app/(dashboard)/
├── comptes/
│   ├── page.tsx          → <ComptesGuard />
│   └── error.tsx
├── transactions/
│   ├── page.tsx          → <TransactionsGuard />
│   └── error.tsx
└── transferts/
    ├── page.tsx          → <TransfertsGuard />
    └── error.tsx

apps/web/src/components/
├── accounts/
│   ├── accounts-guard.tsx   (RSC : prefetch via accountService.findMany)
│   ├── accounts-view.tsx    (client : rendu liste + soldes calculés)
│   └── hooks/use-accounts.ts
├── transactions/
│   ├── transactions-guard.tsx
│   ├── transactions-view.tsx
│   └── hooks/use-transactions.ts
└── transfers/
    ├── transfers-guard.tsx
    ├── transfers-view.tsx
    └── hooks/use-transfers.ts
```

#### Guard pattern

```typescript
// components/accounts/accounts-guard.tsx
export async function ComptesGuard(): Promise<JSX.Element> {
  const qc = new QueryClient();
  await qc.prefetchQuery({
    queryKey: ['accounts'],
    queryFn: () => accountService.findMany({}),
  });
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <ComptesView />
    </HydrationBoundary>
  );
}
```

#### Affichage du solde calculé (ComptesView)

```typescript
// components/accounts/accounts-view.tsx  (extrait)
'use client';
import { computeBalance } from '@mbongo/shared';

// Pour chaque compte, les transactions sont chargées par useTransactions(accountId)
// Le solde s'affiche via :
const balance = computeBalance(account, transactions);
const overdraft = isOverdraft(account, balance);
```

#### Affichage des transferts (TransfertsView)

```typescript
'use client';
import { counterValue } from '@mbongo/shared';

// Phase 1 : contre-valeur estimée
const estimated = counterValue(transfer.amountSent, transfer.rateEstimated);
// Affichage : `${eur(estimated)} · taux au ${format(parseISO(transfer.rateDate), 'dd/MM/yyyy')}`

// Phase 2 : taux effectif et frais persistés, directement affichés
// transfer.rateEffective, transfer.fees
```

---

### 6. Hooks TanStack Query (`apps/web/src/hooks/`)

Hooks placés dans `src/hooks/` (portée app-wide, pas colocalisés avec un seul composant car plusieurs vues les consomment).

```typescript
// hooks/use-accounts.ts
export function useAccounts(query?: AccountQuery) {
  return useQuery({ queryKey: ['accounts', query], queryFn: () => accountsRepository.findMany(query) });
}
export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: accountsRepository.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
}
export function useCloseAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: accountsRepository.closeAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
}

// hooks/use-transfers.ts
export function useCompleteTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTransferInput }) =>
      transfersRepository.completeTransfer(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transfers'] }),
  });
}
```

Hooks complets à implémenter : `useAccounts`, `useCreateAccount`, `useUpdateAccount`, `useCloseAccount`, `useCreateTransaction`, `useUpdateTransaction`, `useDeleteTransaction`, `useTransactions`, `useTransfers`, `useCreateTransfer`, `useCompleteTransfer`, `useSnapshots`, `useCreateSnapshot`, `useMembers`.

---

### 7. Patterns UI (maquette `mock_POC.tsx.todo`)

Les composants suivants de la maquette sont repris dans les pages M1 :

| Composant | Utilisation M1 |
|-----------|----------------|
| `StatusBadge` | Badges ACTIVE/CLOSED sur comptes, ESTIMATED/COMPLETED sur transferts |
| `DetailSheet` | Bottom-sheet de détail pour chaque ligne de compte, transaction, transfert |
| `DetailRow` | Affichage label/valeur dans les sheets (solde, taux, frais…) |
| `SegmentedToggle` | Sélecteur EUR/CHF dans les formulaires de compte |
| `DeleteButton` | Confirmation inline deux étapes pour suppression/clôture |
| `AccountFormPage` | Formulaire création/édition de compte |
| `TransfertScreen` | Cartes phase 1/phase 2, bouton « Saisir le crédit » |

Ces composants sont extraits de la maquette, adaptés en composants shadcn/Radix purs (les imports `nucleo-sharp` sont remplacés par les icônes existants dans le projet).

---

## Error Handling

```
Service lance           → Controller intercepte   → toErrorResponse mappe
─────────────────────────────────────────────────────────────────────────
NotFoundError (404)     → 404 + { error.details }
HttpError(409, msg)     → 409 + { error.details }  (compte non vierge, tx liée, transfert COMPLETED)
HttpError(422, msg)     → 422 + { error.details }  (mauvaises devises)
ZodError (validation)   → 400 + { errors, issues }
Error générique         → 500 (message interne masqué)
```

Les repositories frontend propagent les erreurs JSON reçues. Les hooks TanStack Query les exposent via `error` dans le résultat de `useQuery`/`useMutation`.

---

### 9. Seed (`apps/web/prisma/seed.ts`)

Le seed crée :
- 2 membres : `Anco` (PRIMARY) et `Épouse` (PARTNER)
- 3 comptes : UBS Courant (CHF, PRIMARY), BNP Perso (EUR, PRIMARY), BNP Joint (EUR, null = couple)
- Transactions : salaire +4400 CHF sur UBS, dépenses courantes, etc.
- 1 Transfer ESTIMATED (Telexoo, 1500 CHF → EUR)
- 1 BalanceSnapshot sur UBS Courant

---

## Flux de données détaillé

### RSC → Service (pas de HTTP)

```
ComptesPage (RSC)
  └─ ComptesGuard (RSC async)
       └─ accountService.findMany({})   ← direct, pas de fetch
            └─ prisma.account.findMany()
       └─ HydrationBoundary
            └─ ComptesView (client)
                 ├─ useAccounts()   → cache TanStack hydraté depuis le serveur
                 └─ useTransactions(accountId)  → cache initial vide, lazy fetch via repo
```

### Mutation client

```
Bouton "Créer compte"
  └─ useCreateAccount().mutate(input)
       └─ accountsRepository.create(input)
            └─ POST /api/accounts
                 └─ accountsController.create(req)
                      └─ parseBody(req, createAccountSchema)  ← Zod 400 si invalide
                      └─ accountService.create(input)
                           └─ prisma.account.create(...)
                           └─ return Account
                 └─ NextResponse 201 { data: Account }
  └─ onSuccess: invalidateQueries(['accounts'])
```

### Transfert phase 2

```
Bouton "Saisir le crédit"
  └─ useCompleteTransfer().mutate({ id, input })
       └─ transfersRepository.completeTransfer(id, { amountReceived, receivedAt })
            └─ PATCH /api/transfers/:id
                 └─ transfersController.update(req, id)
                      └─ parseBody(req, updateTransferSchema)
                      └─ transferService.update(id, input)
                           └─ vérif status !== COMPLETED
                           └─ effectiveRate(), transferFees(), counterValue()
                           └─ prisma.$transaction([update Transfer, create Transaction])
                           └─ return Transfer COMPLETED
  └─ invalidateQueries(['transfers', 'accounts'])
```

---

## Testing Strategy

### Approche duale

| Couche | Type de test | Outil | Exemples |
|--------|-------------|-------|---------|
| `packages/shared/domain` | Unit (property-based) | Jest | UT-001 à UT-007 |
| Services (TransferService, AccountService) | Intégration SQLite | Jest + Prisma test DB | IT-001 à IT-005 |
| Endpoints `/api/*` | Smoke (happy path) | Jest + fetch mock / supertest | AT-001 à AT-004 |
| Composants RSC/UI | Exemple | Testing Library | Solde affiché, badge correct |

### Tests unitaires — domaine pur

Les fonctions `computeBalance`, `computeSnapshotGap`, `isOverdraft`, `counterValue`, `effectiveRate`, `transferFees` sont testées exhaustivement avec des propriétés universelles (PBT) et les cas du SPEC.md (UT-001 à UT-007). Les generators produisent des nombres aléatoires couvrant positifs, négatifs, grands et petits.

### Tests d'intégration — services

Une base SQLite temporaire en mémoire (via `DATABASE_URL=file::memory:`) est initialisée avant chaque suite. IT-001 et IT-002 vérifient l'atomicité des `$transaction` Prisma : après un échec simulé, aucun enregistrement partiel ne doit persister. IT-004 vérifie les deux branches de `AccountService.remove` (204 et 409).

### Tests smoke — endpoints

AT-001 à AT-003 couvrent le flux end-to-end : créer un compte → saisir un salaire → créer un transfert phase 1 → compléter en phase 2. AT-004 envoie un payload Zod invalide et vérifie le 400 avec les détails d'erreur.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: computeBalance est une somme signée

*For any* compte avec un `openingBalance` quelconque et une liste quelconque de transactions avec des montants signés, `computeBalance(account, transactions)` doit être égal à `account.openingBalance + sum(transactions.map(t => t.amount))`.

**Validates: Requirements 2.1, 2.2**

### Property 2: computeSnapshotGap est un écart algébrique

*For any* snapshot avec un `balance` quelconque et un solde calculé quelconque, `computeSnapshotGap(snapshot, calculated)` doit être égal à `snapshot.balance - calculated`.

**Validates: Requirements 2.3**

### Property 3: isOverdraft est une comparaison de borne

*For any* compte avec un `overdraftLimit` non-négatif et un `balance` quelconque, `isOverdraft(account, balance)` est `true` si et seulement si `balance < -account.overdraftLimit`.

**Validates: Requirements 2.4**

### Property 4: counterValue arrondit à 2 décimales

*For any* paire `(amount, rate)` de nombres positifs, `counterValue(amount, rate)` doit être égal à `Math.round(amount * rate * 100) / 100` — l'arrondi bancaire à 2 décimales préserve toujours la précision requise par l'affichage EUR/CHF.

**Validates: Requirements 2.5**

### Property 5: effectiveRate arrondit à 5 décimales

*For any* paire `(amountReceived, amountSent)` de nombres strictement positifs, `effectiveRate(amountReceived, amountSent)` doit être égal à `Math.round((amountReceived / amountSent) * 100000) / 100000`.

**Validates: Requirements 2.6**

### Property 6: transferFees est l'écart arrondi à 2 décimales

*For any* paire `(amountEstimated, amountReceived)`, `transferFees(amountEstimated, amountReceived)` doit être égal à `Math.round((amountEstimated - amountReceived) * 100) / 100`.

**Validates: Requirements 2.7**

### Property 7: Validation de devise — CHF et EUR uniquement

*For any* chaîne de caractères qui n'est pas `"CHF"` ou `"EUR"`, le schéma `accountSchema` doit rejeter la valeur du champ `currency` avec une erreur Zod.

**Validates: Requirements 1.2**

### Property 8: Transaction à montant zéro est invalide

*For any* payload de transaction où `amount === 0`, `transactionSchema` doit rejeter avec une erreur Zod.

**Validates: Requirements 1.3**

### Property 9: createTransferSchema rejette les comptes identiques

*For any* payload de création de transfert où `sourceAccountId === targetAccountId`, `createTransferSchema.safeParse()` doit retourner `success: false`.

**Validates: Requirements 1.11, 5.10**

### Property 10: AccountService.remove bloque tout compte avec données liées

*For any* compte ayant au moins une transaction, un snapshot, un transfert sortant ou une charge liée, `accountService.remove(id)` doit toujours lancer une `HttpError` avec statut 409.

**Validates: Requirements 5.3**

### Property 11: TransactionService.remove bloque toute transaction liée à un transfert

*For any* transaction dont `transferId` est non-null, `transactionService.remove(id)` doit toujours lancer une `HttpError` avec statut 409.

**Validates: Requirements 5.6**

### Property 12: TransferService.create exige CHF source et EUR cible

*For any* paire de comptes où la source n'est pas `CHF` ou la cible n'est pas `EUR`, `transferService.create(input)` doit lancer une `HttpError` avec statut 422.

**Validates: Requirements 5.9**

### Property 13: TransferService.update bloque tout transfert déjà COMPLETED

*For any* transfert dont le `status` est `"COMPLETED"`, appeler `transferService.update(id, input)` doit lancer une `HttpError` avec statut 409.

**Validates: Requirements 5.11**

### Property 14: SnapshotService.create ne crée jamais de transaction d'ajustement

*For any* payload valide de création de snapshot, après `snapshotService.create(input)`, le nombre de transactions sur le compte concerné doit être identique à avant l'appel.

**Validates: Requirements 5.13**

### Property 15: Tout payload invalide retourne HTTP 400

*For any* payload qui échoue la validation Zod d'un endpoint, le controller doit toujours retourner HTTP 400 avec un corps JSON contenant les erreurs de validation.

**Validates: Requirements 6.6**
