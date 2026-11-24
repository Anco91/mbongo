---
id: 11-repair-first-month-payments
status: done
branch: feat/11-repair-first-month-payments
tier: small
locked_at:
locked_tests: []
---

# 11 — Repair missing anchor-month payments in dev.db

Master: `specs/SPEC_MASTER.md` · Rules: WF-3, WF-7, ROLE-1..4, TEST-1..5

## Summary

Le budget de novembre est faux : 14 des 15 charges de `dev.db` n'ont aucune échéance en novembre, parce qu'elles ont été créées avant le correctif `8b4f424` (le mois d'ancrage est maintenant toujours généré). Ce n'est pas un bug de code. Un script à usage unique recrée les échéances manquantes, en simulation par défaut. Aucun changement de comportement dans l'application.

## Goal

A one-off script lists, then on request creates, the payments missing for the current month on existing
charges, using the shared `missingPayments`. `dev.db` is backed up before any write.

## Diagnosis (checked in `apps/web/prisma/dev.db`, 2026-11-24)

- 14 monthly `FIXED_RECURRING` charges: `startDate` 2026-11-22, 60 payments each, first due date 2026-12-23.
  The November payment is absent.
- « Impôt FR » (`TEMPORARY`, start 2026-09-24, end 2026-12-24) has 2 payments, first on 2026-11-25. The
  generator may propose a payment next to it: the human reads the dry run before `--apply`.
- `missingPayments(charge, existing, from)` already compares the generated calendar to persisted due
  dates by instant. No new rule is needed.

## Acceptance criteria

1. Given `node apps/web/scripts/repair-first-month-payments.cjs` with no flag, then it prints, per charge,
   the payments it would create (label, due date, amount) and a total, and writes nothing.
2. Given `--apply`, then it first copies `dev.db` to `dev.db.bak-<YYYYMMDD-HHMMSS>` next to it, then creates
   the missing payments in one `prisma.$transaction`, then prints the count created.
3. Given the script runs twice with `--apply`, then the second run creates 0 payments.
4. Given a payment already `PAID` or linked to a transaction, then it is never modified or deleted: the
   script only creates.

## Frame

Standards to read first (CTX-5): none beyond `ARCHITECTURE.md`.

### Create

| Path | Role | Exports |
|---|---|---|
| `apps/web/scripts/repair-first-month-payments.cjs` | CommonJS one-off glue script; `require('@mbongo/shared')` (built `dist`) and `require('@prisma/client')`; flag `--apply`; no exports | none |

Behaviour: load all charges with their payments; map each row to a `Charge` like `toCharge`
(dates as ISO strings); call `missingPayments(charge, existingPayments, new Date())`; print the plan;
with `--apply`, back up the db file, then `createMany` the payments with `dueDate: new Date(iso)`.
Exit code 1 and a message if `@mbongo/shared` has no `dist` (tell the human to run
`npm run build -w @mbongo/shared`).

### Modify

None.

### Read (allow-list)

- `ARCHITECTURE.md`
- `apps/web/src/server/charges/charge.service.ts` (`toCharge`, `generateAndStorePayments`: copy the mapping, do not import `server-only`)
- `packages/shared/src/domain/schedule.ts` (`missingPayments`, `generatePayments` signatures only)
- `apps/web/prisma/schema.prisma` (models `Charge`, `Payment`)

### Reuse (from the registry)

- `packages/shared/src/domain/schedule.ts` → `missingPayments`: already computes what is absent.
- `apps/web/src/server/db.ts`: do NOT import (`server-only`); the script builds its own `PrismaClient`.

### Style exemplars

- `apps/web/scripts/verify-m1.sh` — header comment with purpose, usage, prerequisites.

### Libraries

- `@prisma/client` — read and `createMany`.
- Node `fs.copyFileSync` — the backup. No new dependency.

### Forbidden

- Any file not listed above. Do not run the script with `--apply`: the human does.
- Touching `dev.db` yourself, deleting or updating any payment, any migration.
- Adding a TS runner (`tsx`, `ts-node`) or a package script.
- A new date helper: dates through `new Date(iso)` and the shared output only.

## Tests

None (TEST-2: one-off glue, no business rule; the rule is `missingPayments`, already covered by
`apps/web/__tests__/schedule.missing-payments.test.ts`). Verification is the dry run (criterion 1),
read by the human before `--apply`.

### Locked

None.

### Proposed by the Executor

| Path | What it covers | Status |
|---|---|---|

### Test change requests

| Test | Reason | Proposal | Decision |
|---|---|---|---|

## Out of scope

- Changing generation rules or the alert/budget code.
- Repairing other stale data (income links, transfers: rows 13 to 16).
- Keeping the script after the repair: the human may delete it once applied.

## Handoffs

