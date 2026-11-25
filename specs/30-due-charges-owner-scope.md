---
id: 30-due-charges-owner-scope
tier: medium
---
# 30 — Due charges, charge owner, member/account scope

## Summary

Why: consolidated net worth ignores charges debited at the start of the month but not yet booked; the member filter on donut/Sankey changes nothing because charges carry no owner (attribution only through `Account.memberId`).
What changes: net worth shown net of due charges plus a « Reste à vivre (comptes) » figure; a charge can be owned by a member or be common, and the dashboard member scope gains per-account sub-chips.
Row 31 changes visible behaviour: Advisor updates `specs/current/` capability files at review (SPEC-3).

Row 30 = change A, row 31 = change B. Change C (donut percentages) is done: PR #71.
One change = one branch = one PR = one session. Order: A, then B.

## Change A (row 30) — due charges, net worth, reste à vivre

- Pure `computeDueCharges(payments, charges, today, convert)` in `packages/shared/src/lib/calculation/`: sum of `PENDING` payments of the current month plus earlier overdue ones, excluding `provisioned` charges (no double count, like `computeMonthlyBudget`). CHF converted with `counterValue`. `PAID` payments are already in balances (`domain/payment-debit.ts`), not recounted.
- Pure `computeRemainingToLive(accounts, balances, dueCharges, rate)`: balances of `ACTIVE` accounts except `SAVINGS`, minus due charges. Credit cards included (negative balance).
- `consolidated.ts`: expose `netOfDueEur = totalEur - dues`; keep the gross figure.
- `use-dashboard-data.ts`: call both with `useMonthPayments(currentMonthKey())` (current month, independent of the month cursor).
- `wealth-card.tsx`: line « dont charges dues », net total, and « Reste à vivre (comptes) » below. Distinct label: « Reste à vivre » already exists in `budget/steps/recap-step.tsx` with another meaning. Add to `docs/LEXIQUE.md`.
- Tests: `due-charges.test.ts`, `remaining-to-live.test.ts` (template: `net-worth-terms.test.ts`). ARCHITECTURE.md registry rows.

## Change B (row 31) — charge owner, scope fix, account drill-down

- Prisma: `Charge.memberId String?` (null = follows the account owner) and `Charge.shared Boolean @default(false)` (true = common / Foyer). Defaults keep today's behaviour. **Migration = human gate (GIT-7): stop and report before running it.**
- `schemas/charge.ts`: both fields in create/update; `shared` and `memberId` mutually exclusive. `charge.service.ts`: validate the member.
- Pure `chargeOwner(charge, account)` → `memberId | null` (null = common). Used by `scopeToMember`, `OwnerBadge`, `filterCharges` (`use-charges-view.ts`).
- `scopeToMember` (`lib/calculation/member-scope.ts`): charges and their payments attributed through `chargeOwner`; transactions still by account. New optional `accountId` to restrict to one account.
- `charge-edit-form.tsx`, `charge-create-form.tsx`: `SelectInput` « Propriétaire / débiteur » (each member, Commun, Suivre le compte). Pattern: `account-edit-form.tsx` lines 137-141.
- Dashboard: with a member selected, `MemberScopeChips` shows sub-chips for that member's accounts (nuqs `?compte=`); donut and Sankey follow; reset on member change.
- Tests: extend `member-scope.test.ts` (common charge on Anco's account, member charge on joint account, account filter) and add `charge-owner.test.ts`.
- Check first whether existing accounts have an owner (`Account.memberId`); if not, the user sets it in the account form.

## Decisions (log in design.md of each change)

- Default « follows the account »: no existing data changes meaning.
- Due charges = every `PENDING` payment of the current month, not only the already-due ones.

## Handoffs

- `docs/handoffs/20261125-0130-30-due-charges-owner-scope.md`
- `docs/handoffs/20261125-0135-30-due-charges-owner-scope.md`
