---
id: 18-unmatched-income-screen
status: done
branch: feat/18-unmatched-income-screen
tier: medium
locked_at:
locked_tests: []
---

# 18 — Écran des revenus à lier

Master: `specs/SPEC_MASTER.md` · Rules: WF-3, WF-7, ROLE-1..4, TEST-1..5, FE-1..9

## Summary

Un salaire arrivé sur le compte sans passer par « Confirmer » n'est ni dans le reste à vivre ni relié à sa source. Cette tranche ajoute l'écran `/incomes/unmatched` : il liste ces entrées d'argent, propose pour chacune la ou les sources de revenu possibles avec l'écart prévu/reçu, et un bouton « Lier » qui appelle l'API de la spec 17. Après le lien, la ligne disparaît et le tableau de bord se met à jour. Aucun point d'entrée dans les menus (hors périmètre).

## Goal

`/incomes/unmatched` shows every positive transaction without source (`findUnmatchedIncome`, spec 14),
its ranked proposals, and « Lier » per proposal (`POST /api/incomes/{id}/link`, spec 17). No schema
change, no new API, no new shared function.

## Acceptance criteria

1. Given unmatched positives, when `/incomes/unmatched` opens, then one row per `UnmatchedIncome`
   shows date, amount (`formatAmount`, account currency), account chip, and its proposals in the order
   returned by the domain function.
2. Given a proposal, then it shows the source name, planned amount, and the gap
   (`settlement.gap`, signed, 0 shown as « Montant conforme »), plus a « Lier » button.
3. Given a click on « Lier », then `useLinkIncome` calls `incomesRepository.link(incomeId,
   { transactionId, month: budgetMonth })`; the button is disabled while pending.
4. Given the link succeeds, then queries `transactionQueries.all()`, `incomeQueries.all()` and
   `['dashboard']` are invalidated and the row leaves the list.
5. Given the link fails (409/422), then the row stays and shows the server message inline
   (`InlineError`); other rows keep working.
6. Given a transaction with no proposal, then its row shows « Aucune source de revenu possible ».
7. Given no unmatched positive, then `EmptyState`: « Aucun revenu à lier ».
8. Given the route fails to load, then `RouteError` « Impossible de charger les revenus à lier ».
9. Header title of `/incomes/unmatched` = « Revenus à lier » (`routeChrome`).

No automated test (TEST-2: UI and glue; the rules are pinned by specs 14 and 17). Checked by `tsc`
and review. Criteria 1-9 verified by the Advisor on a seeded dev DB at review.

## Frame

Standards to read first (CTX-5): `.agents-fw/standards/frontend.md` > Page → View → Guard → Content,
`frontend.md` > Hooks.

### Create

| Path | Role | Exports (signatures) |
|---|---|---|
| `apps/web/src/app/incomes/unmatched/page.tsx` | route, routing only | `default function UnmatchedIncomePage(): JSX.Element` → `<UnmatchedIncomeView />` |
| `apps/web/src/app/incomes/unmatched/error.tsx` | error boundary | `default function UnmatchedIncomeError({ error, reset })` → `RouteError` title « Impossible de charger les revenus à lier » (exemplar `app/alerts/error.tsx`) |
| `apps/web/src/app/incomes/unmatched/loading.tsx` | skeleton | `default function UnmatchedIncomeLoading()` with `SkeletonCard`/`SkeletonList` (exemplar `app/alerts/loading.tsx`) |
| `apps/web/src/components/incomes/unmatched-income-view.tsx` | composition | `export function UnmatchedIncomeView(): JSX.Element` → `<Guard><Content /></Guard>` |
| `apps/web/src/components/incomes/unmatched-income-guard.tsx` | server prefetch | `export async function UnmatchedIncomeGuard({ children }): Promise<JSX.Element>`: prefetches `['transactions', UNMATCHED_QUERY]` via `transactionService.findMany(UNMATCHED_QUERY)` and `['incomes', {}]` via `incomeService.findMany({})`, `HydrationBoundary` |
| `apps/web/src/components/incomes/unmatched-income-content.tsx` | client list | `'use client'; export function UnmatchedIncomeContent(): JSX.Element`: `useUnmatchedIncome()` → `ItemList`/rows, `EmptyState` |
| `apps/web/src/components/incomes/unmatched-income-row.tsx` | one transaction + proposals | `export function UnmatchedIncomeRow({ item, incomes }: { item: UnmatchedIncome; incomes: readonly Income[] }): JSX.Element`; owns `useLinkIncome()`, the « Lier » buttons, inline error |

`UNMATCHED_QUERY` is `{ limit: 500 }` (`TransactionQuery`), exported from `apps/web/src/lib/month-queries.ts`
(Modify) so guard and hook share one constant. Spec limit: the API caps `limit` at 500; beyond it older
unmatched entries are not listed (accepted, logged in `design`-level Decisions below).

### Modify

| Path | Change |
|---|---|
| `apps/web/src/hooks/use-incomes.ts` | Add `useUnmatchedIncome(): { items: UnmatchedIncome[]; incomes: Income[]; isLoading: boolean; error: Error \| null }`: `useQuery(transactionQueries.list(UNMATCHED_QUERY))` + `useQuery(incomeQueries.list({}))`, `useMemo(() => findUnmatchedIncome(transactions, incomes), …)`. Add `useLinkIncome()`: `useMutation` over `incomesRepository.link`, `onSuccess` invalidates `transactionQueries.all()`, `incomeQueries.all()`, `['dashboard']` (same trio as `useConfirmIncome`) |
| `apps/web/src/lib/month-queries.ts` | Add `export const UNMATCHED_QUERY: TransactionQuery = { limit: 500 }` |
| `apps/web/src/lib/routes.ts` | Add `'/incomes/unmatched': 'Revenus à lier'` to `MAIN_ROUTES` |
| `specs/current/income-management/spec.md` | Advisor adds « Revenus à lier » requirement (SPEC-2/3) |
| `docs/LEXIQUE.md` | Add rows: « Lier » (button, Revenus à lier), « Revenus à lier » (screen title), « Aucun revenu à lier » (empty state), « Montant conforme » (gap 0). Old term for all: — |

### Read (allow-list)

- `ARCHITECTURE.md`, `docs/LEXIQUE.md`
- `packages/shared/src/domain/income-matching.ts` (types), `domain/settlement.ts` (`Settlement` shape only)
- `apps/web/src/hooks/use-incomes.ts`, `queries/incomes.ts`, `queries/transactions.ts`
- `apps/web/src/repositories/incomes.repository.ts` (`link` signature)
- `apps/web/src/lib/month-queries.ts`, `lib/routes.ts`, `lib/format.ts`
- `apps/web/src/components/alerts/` (4 files: view/guard/content exemplars), `app/alerts/` (page, error, loading)
- `apps/web/src/components/patterns/async-state.tsx`, `inline-error.tsx`, `item-list.tsx`; `components/ui/account-chip.tsx`, `button.tsx`
- `apps/web/src/server/incomes/income.service.ts`, `server/transactions/transaction.service.ts` (`findMany` signatures)

### Reuse (from the registry)

- `findUnmatchedIncome`, `UnmatchedIncome`, `IncomeMatchProposal` (`domain/income-matching.ts`) — all matching logic.
- `incomesRepository.link` (spec 17); `incomeQueries`, `transactionQueries` — keys and fetchers.
- `useConfirmIncome` invalidation trio — copy the three keys, same cache effects.
- `AsyncState` (`EmptyState`, `ErrorPanel`), `InlineError`, `ItemList`, `AccountChip`, `Button`, `RouteError`, `Skeleton*`.
- `formatAmount`, `formatDate` (`lib/format.ts`); `AlertsView/Guard/Content` — structure exemplar.

### Libraries

TanStack Query (`useMutation`, `useQuery`, `HydrationBoundary`); date-fns not needed. None new.

### Forbidden

- Any file not listed. A new shared function, schema, API route or migration.
- Re-implementing matching, gap or due-month rules in the UI: render `UnmatchedIncome` as returned.
- Hardcoding query keys in the hook or row: use the factories. (The guard follows the existing hardcoded-key
  prefetch style; its keys must equal the factories' keys.)
- `useEffect`, local `useState` for server data, `console.log`. A new form or dialog (no confirmation step).
- Menu / tab / dashboard entry link, unlink, choosing a month other than the proposal's (all out of scope).
- Optimistic update: invalidate only.

## Tests

### Locked

None (TEST-2). Domain rules are locked by `income-matching.test.ts` (14) and `income-link.test.ts` (17).

### Proposed by the Executor

| Path | What it covers | Status |
|---|---|---|

### Test change requests

| Test | Reason | Proposal | Decision |
|---|---|---|---|

## Decisions (AUTO-1, logged)

- No locked test: the slice is glue over two tested functions.
- `limit: 500` single page (API max). Older unmatched entries are not shown; pagination only if a real need appears.
- Entry point (link from budget or dashboard) deferred: a screen reachable by URL first, one link in a follow-up.
- Gap sign comes from `computeSettlement` unchanged; the UI formats, never recomputes.

## Out of scope

- Menu or dashboard entry to the screen.
- Unlinking, picking another month or source than the proposals, creating a source from a transaction.
- Pagination beyond 500 transactions; Reviewer-visible visual polish beyond the existing primitives.

## Handoffs


- `docs/handoffs/20261124-2121-18-unmatched-income-screen.md`
