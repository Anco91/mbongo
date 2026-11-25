# Architecture — Mbongo

Rules: CTX-1..4, ARCH-*, LIB-3. Read this before any search. Keep it true in the same commit as the code.
Checked by `.agents-fw/scripts/arch-check.sh`.

Mbongo: household budget app (members, accounts CHF/EUR, recurring charges and their payments,
incomes, transfers, monthly budgets, alerts). Mobile-first PWA.

## Stack

- TypeScript 5, Node >= 18, npm workspaces + Turborepo 2 (`apps/*`, `packages/*`).
- Next.js 15 App Router, React 18, full-stack BFF in `apps/web` (backend in `src/server/`, routes in `src/app/api/`).
- Prisma 5 on SQLite (`apps/web/prisma/schema.prisma`, migrations in `apps/web/prisma/migrations/`).
- Zod 3 schemas in `packages/shared` (`@mbongo/shared`): single source of truth for types and validation.
- TanStack Query 5 (server state), React Hook Form + zodResolver (forms), Tailwind 3, Radix Dialog, lucide-react, Recharts 3, date-fns 3.
- Tests: Jest 29 + Testing Library, in `apps/web/__tests__/`. Commands: `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build`.

## Module map

- `packages/shared/src/schemas/` — Zod schemas + inferred types per resource; `filter.ts` = generic query schema — imported by server, repositories, forms.
- `packages/shared/src/domain/` — pure business rules (schedule generation, balance, budget, card billing, conversion, income, payment status, alerts) — called by services and hooks.
- `packages/shared/src/lib/calculation/` — pure chart/aggregate calculations (month, consolidated, donut, sankey) — called by dashboard.
- `packages/shared/src/contracts/` — `<Resource>Http` interfaces: the HTTP contract the client repositories implement.
- `apps/web/src/server/<resource>/` — `<resource>.service.ts` (Prisma CRUD + findMany) and `<resources>.controller.ts` (validate → delegate → respond) — wired by `app/api/`.
- `apps/web/src/server/month-start-balances/` — service + controller of the persisted logical start balance per (month, account); `PUT/GET /api/month-start-balances/{month}` (spec 40).
- `apps/web/src/server/common/` — `http.ts` (parse body/query, error → HTTP mapping), `where-translator.ts` (filter → Prisma where); `server/db.ts` = Prisma client singleton.
- `apps/web/src/app/api/` — route handlers, pure wiring onto controllers.
- `apps/web/src/app/<route>/` — pages (routing only), English URLs; `error.tsx` / `loading.tsx` per route.
- `apps/web/src/repositories/` — typed client for `/api`, one per resource, implements `contracts/*.http.ts`, parses responses with shared schemas.
- `apps/web/src/queries/` — `<resource>Queries` factories (`all()`, `list()`, `detail()` → `queryOptions`): only source of query keys; members, accounts, transactions, charges, payments, incomes, transfers, monthly budgets, month start balances, exchange rate — consumed by hooks.
- `apps/web/src/hooks/` — TanStack Query hooks per resource (only consumers of repositories).
- `apps/web/src/components/{ui,form,patterns,charts}/` — domain-free primitives, form kit, shared patterns, chart renderers.
- `apps/web/src/components/<domain>/` — `<Domain>View` → `<Domain>Guard` → `<Domain>Content` + rows/forms of that domain.
- `apps/web/src/lib/` — client utilities (api fetch, format, routes, month navigation, filters, PWA/service worker).

## Declared folders

- `packages/shared/src/`
- `apps/web/src/server/`
- `apps/web/src/repositories/`
- `apps/web/src/queries/`
- `apps/web/src/hooks/`
- `apps/web/src/lib/`
- `apps/web/src/components/ui/`
- `apps/web/src/components/form/`
- `apps/web/src/components/patterns/`
- `apps/web/src/components/charts/`
- `apps/web/src/components/providers/`

## Reuse registry

| Path | Kind | Purpose |
|---|---|---|
| `packages/shared/src/index.ts` | barrel | Public entry `@mbongo/shared` |
| `packages/shared/src/schemas/` | schemas | Zod schema + type per resource; never redeclare a type |
| `packages/shared/src/schemas/filter.ts` | schema | Generic list query (operators, limit, cursor) |
| `packages/shared/src/domain/` | domain | Pure business functions, tested without DB |
| `packages/shared/src/lib/calculation/` | domain | Pure aggregates for dashboard charts |
| `packages/shared/src/contracts/` | contract | `<Resource>Http` interface per resource |
| `apps/web/src/server/db.ts` | infra | Prisma client singleton |
| `apps/web/src/server/common/http.ts` | infra | `parseBody`, `parseQuery`, `HttpError`, `NotFoundError`, `to*Response` |
| `apps/web/src/server/common/where-translator.ts` | infra | `createWhereTranslator` filter → Prisma where |
| `apps/web/src/server/` | module | One folder per resource: service + controller |
| `apps/web/src/repositories/` | client | Typed `/api` client per resource |
| `apps/web/src/queries/` | client | `memberQueries`, `accountQueries`, `transactionQueries`, `chargeQueries`, `paymentQueries`, `incomeQueries`, `transferQueries`, `monthlyBudgetQueries`, `monthStartBalanceQueries`, `exchangeRateQueries`, `snapshotQueries`: query keys + `queryOptions`; reuse, never hardcode keys |
| `apps/web/src/hooks/` | client | TanStack Query hooks per resource |
| `apps/web/src/lib/` | util | `api.ts` request, `format.ts`, `routes.ts`, month navigation/queries, filters, PWA |
| `apps/web/src/lib/month-navigation.ts` → `monthNameLabel` | util | Month name alone from `YYYY-MM` (date-fns, French), e.g. « novembre ». Used by « Projeté fin <mois> » in `WealthCard` |
| `apps/web/src/components/ui/` | ui | Primitives: Button, Card, Badge, StatusBadge, TypeBadge, AccountChip, Sheet, Skeleton, Progress, icons |
| `apps/web/src/components/form/` | ui | Form kit: Form, TextInput, SelectInput, ToggleInput, AmountInput, FormActions, FormError, FormSuccess |
| `apps/web/src/components/patterns/prefetch-guard.tsx` → `PrefetchGuard`, `PrefetchEntry` | ui | Generic server guard: prefetches `entries` (`queryKey` + `queryFn`) on a new `QueryClient`, hydrates children; domain guards only declare entries |
| `apps/web/src/components/patterns/` | ui | AppShell, AppHeader, TabNav, AsyncState, ItemList, EditableItem, CreatePanel, DetailSheet, DetailRow, DeleteButton, FilterChips, MonthCursor, ShowMoreList, SwipeZone, RouteError… |
| `packages/shared/src/domain/income.ts` → `computeMonthExpectedIncome` | domain | Expected income of a month: due sources, confirmed amount replaces planned; recap « Revenus prévus » |
| `packages/shared/src/domain/settlement.ts` → `computeSettlement` | domain | Settlement of an expected item vs realized amounts: open/partial/settled/discrepancy + gap, optional tolerance; positive magnitudes in the item's currency |
| `packages/shared/src/domain/income-matching.ts` → `findUnmatchedIncome` | domain | Positive transactions with no `incomeId`/`transferId`, each with ranked source proposals (due, same account, not yet confirmed, `computeSettlement` gap); read-only, link comes in spec 17 |
| `packages/shared/src/domain/income-link.ts` → `checkIncomeLink` | domain | First refusal reason (or null) to link an existing transaction to an income source + month: positive, no transfer/source/payment, same account, due, date in month, month free. Replayed by `incomeService.linkTransaction` (`POST /api/incomes/{id}/link`) |
| `packages/shared/src/domain/payment-debit.ts` → `planPaymentDebit` | domain | Debit (`-amount`, charge account, dated by argument/paidAt/dueDate) booked when a payment is ticked paid without a transaction; RangeError on currency mismatch. Used by `paymentService.update` (links it via `transactionId`) |
| `apps/web/src/server/transactions/transaction-query.ts` → `buildTransactionFindArgs` | infra | Pure transaction query → Prisma find args: field map (adds `amount`, `incomeId`; `NULL_FILTER_VALUE` `'null'` → null on `transferId`/`incomeId`), stable order `date desc, id desc`, cursor + skip 1. Used by `transactionService.findMany` |
| `apps/web/src/queries/transactions.ts` → `transactionQueries.unmatchedIncome` (+ `unmatchedIncomeQuery`, `UNMATCHED_PAGE_SIZE` in `lib/month-queries.ts`) | client | `infiniteQueryOptions` factory: unmatched income pages of 50 by cursor; guard prefetches page 1 under the same key |
| `apps/web/src/components/incomes/` → `UnmatchedIncomeView/Guard/Content/Row`, `useUnmatchedIncome` (infinite, « Afficher plus »), `useLinkIncome` | ui | `/incomes/unmatched`: unmatched positives with proposals and « Lier » (spec 18); renders `findUnmatchedIncome` as returned |
| `packages/shared/src/domain/balance.ts` → `computeStatementGap` | domain | Gap of an account's latest bank statement vs balance computed at the statement day (same account, day granularity, cent-rounded); null without statement. Shown on the account card (spec 16) |
| `packages/shared/src/lib/calculation/consolidated.ts` → `listNetWorthTerms` | domain | One term per active account with a non-zero balance (native currency, asset/overdraft, sorted); same balance rule as `computeConsolidatedBalance`. Shown on hover/focus of `WealthCard` |
| `packages/shared/src/lib/calculation/due-charges.ts` → `computeDueCharges`, `computeNetOfDue` | domain | EUR sum of PENDING payments of the current month (provisioned charges excluded, CHF at the rate, null without rate) and net worth minus it. Shown in `WealthCard` |
| `packages/shared/src/lib/calculation/remaining-to-live.ts` → `computeRemainingToLive` | domain | Active non-savings balances (credit cards included) minus due charges, EUR. « Reste à vivre (comptes) » in `WealthCard` |
| `packages/shared/src/domain/balance.ts` → `balanceAsOf` | domain | Balance of an account at the end of a UTC day (`openingBalance` + transactions dated up to it, cent-rounded). Today's balances and `computeStatementGap` use it |
| `packages/shared/src/lib/calculation/projected-balance.ts` → `computeProjectedBalance`, `computeMonthState` | domain | Active-account balances at the end of a month: real if past, else balance today plus future transactions, unconfirmed incomes, PENDING payments (overdue and provisioned included), missing ESTIMATED transfer legs, next card settlement; `totalEur` consolidated. `startOverrides` (saved start balances, spec 43) anchors an account of a current/future month on start + that month's flows only. « Projeté fin <mois> » in `WealthCard` |
| `packages/shared/src/lib/calculation/month-journey.ts` → `expectedMonthPayments`, `suggestMonthStart`, `computeMonthPlan` | domain | Plan of a month prepared at its start: persisted payments plus missing scheduled ones (matched on `dueDate` day; open-ended one-off and ended items absent), budget totals, remaining, logical start balance per ACTIVE account (deferred-card overdraft not carried, overrides win). Pure; wiring in rows 40-42 |
| `packages/shared/src/schemas/month-start-balance.ts` → `monthStartBalanceSchema`, `saveMonthStartBalancesSchema` | schema | Row (month, account, balance) and idempotent save body (≥ 1 account, unique, ≤ 2 decimals, negative allowed). Table `MonthStartBalance`; `openingBalance` untouched by preparation |
| `apps/web/src/components/budget/use-month-start.ts` → `useMonthStart` | ui | `suggested` (`suggestMonthStart` over previous month end via `computeProjectedBalance`) and `saved` start balances of a month; used by `AccountsStep` |
| `apps/web/src/queries/payments.ts` → `paymentQueries.pendingUntil`, `pendingUntilQuery` | client | PENDING payments due up to the end of a month, overdue included; dashboard dues and projection, prefetched by `DashboardGuard` |
| `packages/shared/src/lib/calculation/active-accounts.ts` | domain | `excludeClosedAccounts`: drops closed accounts and what points at them before chart calculations |
| `packages/shared/src/domain/transfer-archive.ts` → `isTransferClosed`, `filterVisibleTransfers` | domain | Closed (`CLOSED`) transfers hidden by default in the transfers list; order kept, input untouched |
| `packages/shared/src/domain/transfer-accounts.ts` → `checkTransferAccounts`, `isSameCurrencyTransfer`, `settleSameCurrencyTransfer` | domain | Transfer between any two distinct open accounts; same currency = rate 1, no fee, credited at once. Replayed by `transferService.create` (422) and `buildTransferFormSchema` |
| `packages/shared/src/domain/transfer-external.ts` → `isExternalTransfer`, `checkExternalTransferSource` | domain | Transfer without target account (`targetAccountId` null + `externalLabel`): SOURCE leg only, `COMPLETED` at once, no rate/fee; only the source can be refused (closed). Replayed by `transferService.create`, legs check, scope/projection/Sankey guards (spec 37) |
| `packages/shared/src/domain/transfer-legs.ts` → `checkTransferLegs` | domain | Issue codes for a transfer's legs against its record (SOURCE = -amountSent, TARGET = +amountReceived, fees explain estimated minus received); empty when consistent. Not wired to any screen (row 15) |
| `apps/web/src/components/patterns/show-closed-toggle.tsx` | ui | `ShowClosedToggle`: checkbox, default label « Afficher les comptes clôturés », optional `label` (dashboard, accounts, transfers) |
| `packages/shared/src/domain/charge-category.ts` → `CHARGE_CATEGORIES`, `listSubcategories`, `checkChargeSubcategory`, `resolveChargeSubcategory` | domain | Single charge category/sub-category taxonomy (bank-app style, additive; Divers last) and rule; replayed by `createChargeSchema` and `ChargeService` (422); category change alone resets sub-category |
| `apps/web/src/components/charges/charge-category-fields.tsx` → `ChargeCategoryFields` | ui | Category + dependent « Sous-catégorie » selects, shared by charge create and edit forms |
| `packages/shared/src/lib/calculation/donut.ts` → `computeDonutExpenses`, `mergeCategorySegments`, `formatPercent`, `SubcategoryExpense` | domain | Donut segments per category (+ optional sub-category breakdown); `mergeCategorySegments` merges planned/realized rows for the legend |
| `packages/shared/src/lib/calculation/member-scope.ts` → `scopeToMember` | domain | Restricts chart inputs to one member: their accounts' data, charges they own (`chargeOwner`: explicit member, else account owner; common charges only in household); optional `accountId` narrows to one account of that member (ignored for household); transfers need both ends; null = household. Used by `useDashboardData` |
| `packages/shared/src/domain/charge-owner.ts` → `chargeOwner`, `ownerChoiceToFields`, `fieldsToOwnerChoice` | domain | Owner member of a charge (`shared` → null, else `memberId`, else debited account's member); maps the « Propriétaire / débiteur » select ↔ `{ memberId, shared }`. Replayed by charge badge, member filter, scope, forms; server re-checks exclusivity (422) |
| `apps/web/src/components/dashboard/member-scope-chips.tsx` → `MemberScopeChips` | ui | « Foyer / <membre> » chips (on `FilterChips`) plus per-account sub-chips (`?compte=`, no `SAVINGS`), fullscreen charts only; page cards stay Foyer |
| `packages/shared/src/domain/schedule.ts` → `isChargeActiveInMonth` | domain | Charge counts in month `YYYY-MM` iff `startDate`..`endDate` month bounds contain it (string compare, no end = open). Used by `monthlyProvision(charges, month?, convert?)`, Sankey and donut provisions, `ProvisionsCard` |
| `apps/web/src/components/charts/` | ui | Sankey, donut, fullscreen chart |
| `apps/web/src/components/providers/` | ui | QueryProvider, DisplayCurrencyProvider, service worker register |

## House style

| Layer | Exemplar | What it shows |
|---|---|---|
| Domain | `packages/shared/src/domain/schedule.ts` | Pure functions over shared types, date-fns only |
| Service | `apps/web/src/server/charges/charge.service.ts` | Prisma CRUD + `findMany(query)` with where translator, row → type mapping |
| Controller | `apps/web/src/server/charges/charges.controller.ts` | Validate with shared schema → delegate → `to*Response` / `toErrorResponse` |
| Client | `apps/web/src/repositories/charges.repository.ts` | Implements `ChargeHttp`, parses with shared schemas |
| UI | `apps/web/src/components/patterns/editable-item.tsx` | Styled primitive, no domain import |

- Files kebab-case with role suffix (`charge.service.ts`, `charges.controller.ts`, `charges.repository.ts`, `use-charges.ts`, `charges-view.tsx`); component export PascalCase; constants UPPER_SNAKE_CASE.
- Service file singular (`charge.service.ts`), controller/repository/hook plural.
- Route files only wire HTTP verbs to the controller; no logic.
- Screens: `page.tsx` → `<Domain>View` → `<Domain>Guard` → `<Domain>Content`. Content is client, receives data, never imports `server/`.
- All styling lives in `ui/`, `form/`, `patterns/`; views and forms compose them. A component importing a domain type stays in its domain folder.
- Formatting helpers in `lib/format.ts`; icons only through `components/ui/icons.tsx`.
- URLs in English only; code in English; docs may be French.
- Errors: server throws `HttpError`/`NotFoundError`, controller maps via `toErrorResponse`.

## Libraries

| Need | Library |
|---|---|
| Framework / BFF | next 15 |
| UI runtime | react 18 |
| ORM | prisma 5 (SQLite) |
| Validation, types | zod 3 |
| Server state | @tanstack/react-query 5 |
| Forms | react-hook-form + @hookform/resolvers |
| Dates | date-fns 3 |
| URL state | nuqs 2 (dashboard member scope `?membre=`) |
| Charts | recharts 3 |
| Dialog / sheet | @radix-ui/react-dialog |
| Icons | lucide-react |
| Styling | tailwindcss 3 |
| Tests | jest 29 + @testing-library/react |
| Monorepo | turbo 2, npm workspaces |

## Decisions

| Date | Decision | Reason |
|---|---|---|
| 2026-11-24 | agents-framework is the single source of truth for rules and process. Former rules (old `AGENTS.md` body, `CONVENTIONS.md`, `skills/`, `.vibe/`, `.kilo/`, `.kiro/`, openspec/tdd/superpowers skills) archived in `.agents-fw/backup/20261124-160106/`. | Adoption of the framework; one rule set. |
| 2026-11-24 | Former specs stay as read-only archive: `openspec/changes/archive/`, `docs/specs/`; `openspec/specs/` moved to `specs/current/` (living behaviour specs, SPEC-1..3). New work uses `specs/` (SPEC_MASTER + sub-specs). | No migration cost; history kept. |
| 2026-11-24 | Local signature: services and controllers are classes with an exported singleton (`chargeService`, `chargesController`). | NestJS-like style already applied to all 9 resources (ARCH-4 framework-like provider). |
| 2026-11-24 | Local signature: client data access = `repositories/<resources>.repository.ts` implementing `contracts/<resources>.http.ts`, consumed by `hooks/use-<resources>.ts`. | Existing, typed end to end by shared contracts. |
| 2026-11-24 | Tests live in `apps/web/__tests__/` (Jest), not next to the code. | Existing layout; ~75 test files. |
| 2026-11-24 | Recap income = expected income (`computeMonthExpectedIncome`): due active sources at confirmed amount, else planned. Supersedes archived D1/D8 (« revenus = transactions positives du mois »). Human decision 2026-11-24: a budget is built on expected income. Sankey income leg follows the same rule (spec 12): expected income, unconfirmed drawn as planned; unmatched positives leave it until spec 14. | Budget prepared on expected income; spec 07. |
| 2026-11-24 | Debt FE-1: `<resource>Queries` factories exist for members, accounts, transactions (spec 01), charges, payments (spec 02), incomes, transfers, monthly budgets, exchange-rate (spec 03); alerts and balances own no key. Guards and pages still hardcode some keys until slice 04. | Gap vs framework MUST. |
| 2026-11-25 | FE-2 closed: `PrefetchGuard` is the single prefetch mechanism; domain guards declare entries only (`BudgetGuard` prefetches nothing). | Generic guard. |
| 2026-11-25 | BE-2: `Filter` + `createWhereTranslator` + per-service field map is the single tested engine; naming differs from `listQuerySchema`/`toPrismaArgs`, accepted. | Gap closed by decision. |
| 2026-11-24 | Accounting model = matching (human decision: option 2). A positive transaction without `incomeId` is never added to remaining-to-live as exceptional income; it is first proposed for matching to an expected item so a salary is never counted twice. Expected items (income source+month, charge payment, transfer leg) link to at most one realized transaction; the one-link rule stays enforced by `Payment.transactionId @unique` and `@@unique([incomeId, budgetMonth])`. Transfer TARGET legs are never unmatched income candidates. Transfers cross currencies with fees, so legs do not sum to zero: each leg is checked against the Transfer record. Statement reconciliation = snapshot vs computed balance. Human decision 2026-11-24: matching model (a); a double-entry ledger is rejected for now (model rewrite and migration, against parsimony). An internal transfer between household accounts is neutral for budget and net worth: only its fees are a cost, and its legs are never income or expense. | Specs 13-16; avoid double count. |
