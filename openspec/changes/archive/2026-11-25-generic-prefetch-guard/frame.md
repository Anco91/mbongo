---
id: generic-prefetch-guard
status: ready
branch: refactor/generic-guard-list-query
tier: medium
locked_at:
locked_tests: []
---

# Frame — generic-prefetch-guard

OpenSpec change `openspec/changes/generic-prefetch-guard/`. Master rows 04 + 05 merged. No locked test (glue, TEST-2): verification is existing jest + tsc + lint + build.

## Summary

Neuf guards serveur répétaient la même mécanique de prefetch. Un `PrefetchGuard` unique la porte, les guards de domaine ne déclarent plus que leurs entrées. Écart BE-2 tranché (moteur de filtre unique déjà en place). No behaviour change.

## Frame

### Create

| Path | Role | Exports (signatures) |
|---|---|---|
| `apps/web/src/components/patterns/prefetch-guard.tsx` | generic async Server Component | `interface PrefetchEntry { queryKey: readonly unknown[]; queryFn: () => Promise<unknown> }`; `PrefetchGuard({ entries, children }: { entries: readonly PrefetchEntry[]; children: React.ReactNode }): Promise<JSX.Element>` — new `QueryClient`, `Promise.all` of `prefetchQuery`, `HydrationBoundary` with `dehydrate` |

### Modify

| Path | Change |
|---|---|
| `apps/web/src/components/{accounts/accounts-guard,alerts/alerts-guard,charges/charges-guard,dashboard/dashboard-guard,household/household-guard,schedule/schedule-guard,transfers/transfers-guard,incomes/unmatched-income-guard,payments/payment-detail-guard}.tsx` | build `entries` (same keys, services, query windows, same exported name and props) and render `<PrefetchGuard entries={…}>`; drop local `QueryClient`/`dehydrate`/`HydrationBoundary` imports. `payment-detail-guard` keeps its sequential `findOne` reads first |
| `apps/web/src/components/patterns/index.ts` | export `PrefetchGuard` only if the barrel exists and exports its siblings |
| `ARCHITECTURE.md` | registry row for `patterns/prefetch-guard.tsx` (CTX-3); Decisions: replace the 2026-11-24 « Debt BE-2 » line with « BE-2: `Filter` + `createWhereTranslator` + per-service field map is the single tested engine; naming differs from `listQuerySchema`/`toPrismaArgs`, accepted » and note FE-2 closed |
| `specs/current/app-shell/spec.md` | not edited: `no behaviour change` (SPEC-3) |

### Read (allow-list)

- `ARCHITECTURE.md`
- the nine guard files above, `apps/web/src/components/patterns/index.ts`
- `apps/web/src/lib/month-queries.ts`

### Reuse (from the registry)

- server services (`*Service.findMany/findOne`), `lib/month-queries.ts`, existing query keys of `queries/*.ts` (keys must stay identical).

### Style exemplars

- `apps/web/src/components/patterns/show-closed-toggle.tsx` — small shared component.

### Libraries

- `@tanstack/react-query` (`QueryClient`, `dehydrate`, `HydrationBoundary`). None new.

### Forbidden

- Changing pages, views, contents, query keys, service signatures, the where translator or any schema; `BudgetGuard` (no prefetch, leave as is); `useEffect`; Prisma, `dev.db`. Any file not listed: stop and ask.

## Tests

None locked (glue). Must stay green: full jest, `tsc --noEmit`, lint on touched files, `npm run build`.

## Handoffs
