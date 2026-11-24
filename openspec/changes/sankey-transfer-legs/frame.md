---
id: sankey-transfer-legs
status: ready
branch: fix/balances-and-transfers-in-charts
tier: small
locked_at: 4571062
locked_tests:
  - apps/web/__tests__/sankey-transfer-legs.test.ts
---

# Frame — sankey-transfer-legs (master row 23)

## Summary

Les transferts entre n'importe quels comptes sont dessinés comme un flux compte → compte dans la devise du compte cible (jamais comme un revenu), donc un compte joint qui ne reçoit que des virements a une entrée et aucun revenu inventé. Le calcul traitait le montant reçu comme de l'EUR; les transferts CHF→CHF ou EUR→CHF étaient faux.

## Design decisions

- Decision: no income is ever invented for a transfer; the existing income leg only uses expected incomes (spec 12). Row 23 reduces to making the transfer link correct for any currency pair; rejected a separate "joint income detection".
- Decision: link currency = target account currency; amount = `amountReceived`, else (ESTIMATED) same currency => `amountSent`, CHF->EUR => `counterValue(amountSent, effectiveRate)` (unchanged), EUR->CHF => `amountSent * rateEstimated`.

## Frame

Modify: `packages/shared/src/lib/calculation/sankey.ts` (section « 2. Transferts » only). `addLink` already converts CHF to EUR.
Forbidden: any other file, locked test. Checks: npm run test, typecheck, lint, build. Advisor updates `specs/current/dashboard/spec.md` at review.
