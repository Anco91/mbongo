---
id: payment-manual-debit
status: ready
branch: fix/manual-payment-debits-account
tier: medium
locked_at: 421d91e
locked_tests:
  - apps/web/__tests__/payment-debit.test.ts
---

# Frame — payment-manual-debit (master row 24)

## Summary

Cocher une échéance « payée » sans choisir de transaction enregistre maintenant le débit sur le compte de la charge (et le lie à l'échéance), donc les soldes et le patrimoine consolidé baissent. Avant, les échéances cochées ne changeaient aucun solde (soldes = ouverture + transactions). Valable pour tous les membres. Aucune migration.

## Investigation (2026-11-25)

Consolidated 2389 CHF = +6270.15 income − 3881 transfer, exact from transactions. The rent and the 1000 CHF savings move have no transaction in dev.db (all 856 payments PENDING, none linked); transfers to any account are now possible (row 22) and write both legs. So the missing piece is the manual tick.

## Design decisions

- Decision: a manual tick books the debit and links it (`transactionId`), because balances are transaction-based and a tick must not leave money in the account; rejected computing balances from PAID payments (double count once reconciled, breaks matching model).
- Decision: reconcile after tick stays possible via existing unlink then link; rejected auto-merge.
- Decision: only when the payment has no transaction yet and goes PENDING -> PAID in `PaymentService.update`; ticking again or reconcile paths unchanged.

## Frame

Modify:
- `packages/shared/src/domain/payment-debit.ts`: implement `planPaymentDebit` (signature unchanged; locked).
- `apps/web/src/server/payments/payment.service.ts`: in `update`, when `input.status === 'PAID'`, existing has no `transactionId` and is not already PAID: load charge account, `planPaymentDebit(payment, account, input.paidAt)`, create the transaction (`transferId` null) and set `transactionId` on the payment, all in one `prisma.$transaction`.
- `ARCHITECTURE.md`: registry row. `openspec/changes/payment-manual-debit/tasks.md` not needed.
Advisor only: `specs/current/payment-schedule/spec.md`.
Forbidden: schema/migration, other files, locked test. Checks: npm run test, typecheck, lint, build.
