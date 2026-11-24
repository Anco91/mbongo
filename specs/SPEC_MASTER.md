# Spec master — Mbongo

Rules: WF-2, WF-4, SES-5. This file is an index: no implementation detail.

## Vision

Household budget app for a mixed France/Switzerland couple: multi-currency (CHF/EUR) accounts,
every type of charge (recurring, instalments, mandatory upcoming), CHF→EUR transfers with fees,
and a clear view of where money goes (Sankey, monthly budget). Parsimony: no feature without a
real need. Success = the household runs its monthly budget from Mbongo alone, and a change of
situation (second CHF salary) needs no model rewrite. Full context: `cdc.md` (archive).

## Invariants

- Amounts keep their native currency; only presentation is converted (`domain/conversion.ts`).
- Balances are anchored on real statements (snapshots); no open banking in V1.
- Accounts and charges are typed by country/currency/owner, never by the current situation.
- Zod schemas in `@mbongo/shared` are the only definition of a type; front and back parse with them.
- Business rules are pure functions in `packages/shared`; no Prisma, Next or HTTP there.
- Visible wording follows `docs/LEXIQUE.md`; URLs in English.

## Glossary

| Term | Meaning |
|---|---|
| Charge | A recurring or one-off expense; generates scheduled payments |
| Payment (échéance) | One scheduled occurrence of a charge; can be linked to a bank debit |
| Expected item | What the month plans: an income source for a month, a charge payment, a transfer leg |
| Realized | A real transaction on an account |
| Reconciliation (rapprochement) | Linking an expected item to at most one realized transaction (payment, income source+month, transfer leg); code-only term, shown as « Lier au débit » for payments |
| Settlement | Status of an expected item once matched: open, partial, settled, discrepancy, with the gap between expected and realized |
| Unmatched | A realized transaction with no expected item (unplanned income, or a salary not yet linked to its source) |
| Statement reconciliation | Snapshot balance (from a bank statement) compared with the balance computed from transactions |
| Provisioned charge | Annual charge smoothed monthly (« Charges lissées chaque mois ») |
| Snapshot | Real balance of an account at a date, from a statement |
| Transfer | CHF→EUR money move with rate and fees |
| Monthly budget | Per-month plan of incomes and charges (`/budget/[mois]`) |
| Deferred card | Card debited at month end (BNP); card account balance tracked separately |

## Sub-specs

<!-- Ordered. Only the next one or two are written in detail (WF-4). -->
<!-- status: draft | ready | in-progress | review | done -->
<!-- Prior specs (M1–M5) are archived in `openspec/` and `docs/specs/`. -->
| # | Sub-spec | Outcome | Status | Last handoff |
|---|---|---|---|---|
| 01 | `specs/01-query-factories.md` | FE-1 pilot: `queries/` factories for members, accounts, transactions; their hooks use them | done | `docs/handoffs/20261124-1628-01-query-factories.md` |
| 02 | `specs/02-query-factories-charges.md` | FE-1: factories for charges, payments (hooks `use-charges`, `use-schedule`) | done | `docs/handoffs/20261124-1637-02-query-factories-charges.md` |
| 03 | `specs/03-query-factories-rest.md` | FE-1: factories for incomes, transfers, monthly budgets, exchange-rate | done | — |
| 04 | `specs/04-generic-guard.md` | FE-2: one generic Guard prefetching `queryOptions` | draft | — |
| 05 | `specs/05-list-query.md` | BE-2: `listQuerySchema` + `toPrismaArgs` replace per-service translators | draft | — |
| 06 | `specs/06-closed-accounts-in-charts.md` | Dashboard toggle includes/hides closed accounts in Sankey and donut (recomputed); accounts page checkbox lists closed accounts. Hard delete postponed | done | `docs/handoffs/20261124-1719-06-closed-accounts-in-charts.md` |
| 07 | `specs/07-budget-remaining-recompute.md` | Last step of « Préparer le mois » and budget edit always recompute incomes − provisions − charges = reste à vivre, even when the month is already prepared (today shows 0) | done | `docs/handoffs/20261124-1906-07-budget-remaining-recompute.md` |
| 08 | `specs/08-net-worth-breakdown-hover.md` | Hover on « Patrimoine consolidé » lists each term (+ 1000 CHF Épargne X, − 500 EUR Compte courant X découvert…) | draft | — |
| 09 | `specs/09-transfers-archive.md` | Transfers page: close/hide settled transfers (design to decide: archive flag vs closed status) | draft | — |
| 10 | `specs/10-charge-subcategories.md` | Sub-categories under categories (Abonnements → mobile, internet, sport; Assurances → auto, LAMal, garantie…), reflected in donut | draft | — |
| 11 | `specs/11-repair-first-month-payments.md` | One-off script regenerating missing anchor-month payments of existing charges in dev.db (human OK 2026-11-24; stale data from before fix 8b4f424, not a code bug) | ready | — |
| 12 | `specs/12-sankey-income-leg.md` | Sankey income leg from expected incomes (unconfirmed drawn as planned); unmatched positives leave until 14; stripes fix. Tests locked 86d8502, relocked c8fcbd6 | done | `docs/handoffs/20261124-1951-12-sankey-income-leg.md` |
| 13 | `specs/13-settlement-domain.md` | Pure shared functions: settlement of an expected item against realized amounts (open/partial/settled/discrepancy + gap); no schema change. Human chose matching model (a), no ledger | done | `docs/handoffs/20261124-2005-13-settlement-domain.md` |
| 14 | `specs/14-unmatched-income-matching.md` | Pure shared `findUnmatchedIncome`: positive transactions without `incomeId`/`transferId` listed as unmatched, each with ranked source proposals (due, same account, not yet confirmed, settlement gap). No schema change. Tests locked c724afa | done | `docs/handoffs/20261124-2105-14-unmatched-income-matching.md` |
| 15 | `specs/15-transfer-leg-check.md` | Per transfer: SOURCE leg = −amountSent (CHF), TARGET leg = +amountReceived (EUR), rate and fees explain the gap. Check each leg against the Transfer record, never sum the legs. Needs 13 | draft | — |
| 16 | `specs/16-statement-reconciliation.md` | Snapshot balance vs balance computed from transactions per account, with the gap shown. Needs 13 | draft | — |
| 17 | `specs/17-link-transaction-to-income.md` | Service + route to link an existing transaction to a source and month (`incomeId`, `budgetMonth`), enforcing the one-link rule. Needs 14. Tests locked b0298dd | done | `docs/handoffs/20261124-2110-17-link-transaction-to-income.md` |
| 18 | `specs/18-unmatched-income-screen.md` | `/incomes/unmatched`: unmatched income with proposals and a « Lier » action (hook + cache invalidation). Needs 14, 17. No locked test (glue) | ready | `docs/handoffs/20261124-2121-18-unmatched-income-screen.md` |
