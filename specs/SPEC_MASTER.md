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
| Reconciliation (rapprochement) | Linking a payment to a transaction; code-only term, shown as « Lier au débit » |
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
| 02 | `specs/02-query-factories-charges.md` | FE-1: factories for charges, payments (hooks `use-charges`, `use-schedule`) | ready | — |
| 03 | `specs/03-query-factories-rest.md` | FE-1: factories for incomes, transfers, monthly budgets, alerts, balances, exchange-rate | draft | — |
| 04 | `specs/04-generic-guard.md` | FE-2: one generic Guard prefetching `queryOptions` | draft | — |
| 05 | `specs/05-list-query.md` | BE-2: `listQuerySchema` + `toPrismaArgs` replace per-service translators | draft | — |
