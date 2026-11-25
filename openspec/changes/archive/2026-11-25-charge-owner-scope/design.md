# Design — charge-owner-scope

## Decisions

| Decision | Reason |
|---|---|
| Two columns `memberId String?` + `shared Boolean @default(false)` on `Charge`, no relation required to be mandatory | Matches the master sub-spec; additive, defaults keep today's meaning, no data change |
| `chargeOwner`: `shared` → null; else `charge.memberId`; else `account.memberId`; else null. Missing fields on legacy objects read as « follows account » | Single rule shared by scope, badge and filter |
| `chargeOwner` lives in `packages/shared/src/domain/charge-owner.ts` | Business rule, pure, no I/O |
| `scopeToMember(input, memberId, accountId = null)`: charges kept when `chargeOwner === memberId`; accounts, transactions, incomes still by account; `accountId` ignored when `memberId` is null; with `accountId`, charges also need `charge.accountId === accountId` | Charge attribution leaves the account; everything else unchanged |
| Common charge never appears in a member scope | Foyer-only, consistent with joint accounts |
| Service re-checks: `shared && memberId` → 422, unknown `memberId` → 422, using the effective values on update | BE-4: server re-checks every invariant |
| Form: one `SelectInput` with values `''` (follow), `'shared'`, member id; mapped to `{ memberId, shared }` in the form schema transform, not in the component | One select, no hand-made state; mapping is testable |
| `?compte=` via nuqs, ignored when it is not an account of the selected member | Same pattern as `?membre=` |
| No backfill | Default keeps meaning |

## Human gate

The Prisma migration is created and applied by the Executor only after the human says go. Advisor stops at that point (session handoff `human-gate`).

Go-ahead received from the human on 2026-11-25: migration `charge_owner` approved.

## Reuse analysis

`scopeToMember`, `excludeClosedAccounts`, `OwnerBadge`/`ownerLabel`, `MemberScopeChips` + `FilterChips`, nuqs `useQueryState` (dashboard-content), `SelectInput` pattern of `account-edit-form.tsx`. No new dependency.

## Frame amendments (review of PR #75)

- `schemas/charge.ts`: `memberId` is `.nullable().optional()` and `shared` is `.optional()`, not `.default(...)`. Defaults make both fields required in the output type and break typecheck of 6 unlocked fixtures. The service maps `?? null` / `?? false`. Accepted: keep.
- `packages/shared/src/index.ts`: adds `export * from './domain/charge-owner'`. Needed, not listed in the Frame. Accepted.
- `charge-create-form.tsx`: resolver cast `as unknown as Resolver<ChargeFormValues>`, the owner mapping lives in the resolver instead of a schema transform. Accepted; optional cleanup later.
