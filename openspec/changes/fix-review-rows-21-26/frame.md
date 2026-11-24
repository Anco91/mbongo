---
id: fix-review-rows-21-26
status: ready
branch: fix/review-rows-21-26
tier: medium
locked_at: PENDING
locked_tests:
  - apps/web/__tests__/payment-debit-sync.test.ts
---

# Frame — fix-review-rows-21-26

Rules: WF-3, ROLE-1..4, TEST-1..5, FE-1..9, SPEC-2/3.

## Summary

Fixes the findings of the review of rows 21, 23, 24, 25, 26: a manual payment tick no longer leaves orphan or double debits; fullscreen member chips stay usable; small a11y and flicker fixes. Visible: un-ticking or unlinking an auto-debited payment removes its debit.

## Frame

### Modify

| Path | Change |
|---|---|
| `packages/shared/src/domain/payment-debit.ts` | add `AUTO_DEBIT_NOTE` and `paymentDebitAction` (see test) |
| `apps/web/src/server/payments/payment.service.ts` | apply the design decisions (tick guard, sync, cleanup, 422/409 errors) |
| `apps/web/src/components/patterns/chart-fullscreen.tsx` | optional `toolbar?: ReactNode` rendered outside the transformed area |
| `apps/web/src/components/dashboard/dashboard-fullscreen-charts.tsx` | pass chips as `toolbar` |
| `apps/web/src/components/dashboard/dashboard-content.tsx` | `effectiveMemberId` fallback |
| `apps/web/src/components/patterns/filter-chips.tsx` | `aria-pressed` |
| `apps/web/src/components/patterns/tab-nav.tsx` | pulse `[animation-delay:100ms]` |
| `.gitignore` | `*.db.bak*` |
| `specs/21-navigation-performance.md` | note: pending state mostly dev-visible; `no behaviour change` wording |
| `specs/current/payment-schedule/spec.md` | Advisor only |

Also `git rm --cached apps/web/prisma/dev.db.bak-20261125-001735` (Advisor does it).

### Read (allow-list)

`ARCHITECTURE.md`, the files above, `apps/web/src/hooks/use-schedule.ts`, `apps/web/prisma/schema.prisma`.

### Reuse

`planPaymentDebit`, `HttpError`, `prisma.$transaction`, `FilterChips`.

### Forbidden

Prisma schema/migration, locked tests, any file not listed. Need one: stop and ask.

## Tests

Locked: `apps/web/__tests__/payment-debit-sync.test.ts`, existing `payment-debit.test.ts`.

## Handoffs
