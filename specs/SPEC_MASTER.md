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
| 04 | `openspec/changes/archive/2026-11-25-generic-prefetch-guard/frame.md` | FE-2 + BE-2 (rows 04 and 05 merged): one generic `PrefetchGuard`; BE-2 settled (single filter engine already exists). No locked test (glue) | done | PR |
| 06 | `specs/06-closed-accounts-in-charts.md` | Dashboard toggle includes/hides closed accounts in Sankey and donut (recomputed); accounts page checkbox lists closed accounts. Hard delete postponed | done | `docs/handoffs/20261124-1719-06-closed-accounts-in-charts.md` |
| 07 | `specs/07-budget-remaining-recompute.md` | Last step of « Préparer le mois » and budget edit always recompute incomes − provisions − charges = reste à vivre, even when the month is already prepared (today shows 0) | done | `docs/handoffs/20261124-1906-07-budget-remaining-recompute.md` |
| 08 | `openspec/changes/net-worth-breakdown-hover/frame.md` | Hover on « Patrimoine consolidé » lists each term (+ 1000 CHF Épargne X, − 500 EUR Compte courant X découvert…) | done | `docs/handoffs/20261124-2218-net-worth-breakdown-hover.md` |
| 09 | `openspec/changes/archive/2026-11-24-transfers-archive/frame.md` | Transfers page: close/hide settled transfers (design to decide: archive flag vs closed status) | done | `docs/handoffs/20261124-2229-transfers-archive.md` |
| 10 | `openspec/changes/archive/2026-11-24-charge-subcategories/frame.md` | 10a: optional charge sub-category (column, shared taxonomy, server rule, create/edit forms, detail). Migration applied, PR 52 merged. Tests locked d16cc40 | done | `docs/handoffs/20261124-2250-charge-subcategories.md` |
| 10b | `openspec/changes/archive/2026-11-24-donut-subcategories/frame.md` | Donut legend shows each category's sub-category breakdown (`computeDonutExpenses` keeps one segment per category). 10a merged (PR 52) | done | — |
| 11 | `specs/11-repair-first-month-payments.md` | One-off script regenerating missing anchor-month payments of existing charges in dev.db (human OK 2026-11-24; stale data from before fix 8b4f424, not a code bug) | done | `docs/handoffs/20261124-2200-11-repair-first-month-payments.md` |
| 12 | `specs/12-sankey-income-leg.md` | Sankey income leg from expected incomes (unconfirmed drawn as planned); unmatched positives leave until 14; stripes fix. Tests locked 86d8502, relocked c8fcbd6 | done | `docs/handoffs/20261124-1951-12-sankey-income-leg.md` |
| 13 | `specs/13-settlement-domain.md` | Pure shared functions: settlement of an expected item against realized amounts (open/partial/settled/discrepancy + gap); no schema change. Human chose matching model (a), no ledger | done | `docs/handoffs/20261124-2005-13-settlement-domain.md` |
| 14 | `specs/14-unmatched-income-matching.md` | Pure shared `findUnmatchedIncome`: positive transactions without `incomeId`/`transferId` listed as unmatched, each with ranked source proposals (due, same account, not yet confirmed, settlement gap). No schema change. Tests locked c724afa | done | `docs/handoffs/20261124-2105-14-unmatched-income-matching.md` |
| 15 | `openspec/changes/archive/2026-11-25-transfer-leg-check/frame.md` | Pure shared `checkTransferLegs`: SOURCE leg = −amountSent, TARGET leg = +amountReceived, rate/fees explain the gap; same-currency transfers (rows 22/23) settle at creation. Not wired (no behaviour change). Tests locked | done | PR |
| 16 | `openspec/changes/archive/2026-11-24-account-statement-gap/frame.md` | Account card shows the gap of the latest snapshot vs balance computed at the snapshot date (`computeStatementGap`, reuses `computeSnapshotGap`). Read-only, no schema change; entering a snapshot is a later row. Needs 13. Tests locked 5afd317 | done | PR #45 |
| 17 | `specs/17-link-transaction-to-income.md` | Service + route to link an existing transaction to a source and month (`incomeId`, `budgetMonth`), enforcing the one-link rule. Needs 14. Tests locked b0298dd | done | `docs/handoffs/20261124-2110-17-link-transaction-to-income.md` |
| 18 | `specs/18-unmatched-income-screen.md` | `/incomes/unmatched`: unmatched income with proposals and a « Lier » action (hook + cache invalidation). Needs 14, 17. No locked test (glue) | done | `docs/handoffs/20261124-2121-18-unmatched-income-screen.md` |
| 19 | `openspec/changes/archive/2026-11-24-link-unmatched-income-entry/frame.md` | Dashboard banner « N revenus à lier » linking to `/incomes/unmatched` (only when N > 0). Needs 18. No locked test (glue) | done | `docs/handoffs/20261124-2138-link-unmatched-income-entry.md` |
| 20 | `openspec/changes/archive/2026-11-25-paginate-unmatched-income/frame.md` | « Revenus à lier » lists all unmatched income: server-side filter (amount, incomeId, transferId null) + cursor pages (50, stable order) + « Afficher plus » | done | PR |
| 21 | `specs/21-navigation-performance.md` | PRIORITÉ: page changes very slow, no loading feedback (e.g. click Charges: long wait, then skeleton). Profile (server prefetch blocking, `loading.tsx`, bundle), fix. User report 2026-11-24 | done | PR 57 |
| 22 | `openspec/changes/archive/2026-11-25-transfer-any-account/frame.md` | Transfer between ANY two accounts (YUH→YUH savings, BNP→BNP savings or joint, any member). Same currency: no fee/rate; different currency: rate + fees as today. Generic, not tied to one member. Today forced via an EUR account | done | PR 58 |
| 23 | `openspec/changes/archive/2026-11-25-sankey-transfer-legs/frame.md` | Sankey invents income for the joint account (it has charges, no income). Detect incoming transfers (from any member's account) and show them as transfers, not income. Needs 22 | done | PR 59 |
| 24 | `openspec/changes/archive/2026-11-25-payment-manual-debit/frame.md` | Consolidated net worth shows 2389 CHF while 1000 CHF went to YUH savings and rent 950 CHF + LAMal were paid: debited charges must reduce account balances; check savings and transfers are counted. Needs 22 | done | PR 60 |
| 25 | `openspec/changes/archive/2026-11-25-member-scope-charts/frame.md` | Household-wide donut/Sankey plus a « Membre X » button per member (only that member's expenses), reachable from fullscreen. Generic for every member | done | PR 61 |
| 26 | `openspec/changes/archive/2026-11-25-richer-category-taxonomy/frame.md` | Much richer categories and sub-categories modelled on real bank apps (missing: credits/loans, etc.). Research first, then extend `CHARGE_CATEGORIES` | done | PR 62 |
| 27 | `specs/27-clean-test-accounts.md` | Delete closed test accounts and closed transfers from dev.db. User authorised 2026-11-24; destructive: back up dev.db first, list rows before deleting | done | dev.db cleaned 2026-11-25 (9 closed accounts, 3 closed transfers, their 8 transactions + 2 snapshots) |
| 28 | `specs/28-unmatched-income-closed-account.md` | « N revenus à lier » alert/banner counts an income whose account is closed: exclude closed accounts from `findUnmatchedIncome` consumers (banner + `/incomes/unmatched`). Related to 27 (test data) | done | PR (fast-track) |
| 29 | `openspec/changes/archive/2026-11-25-domain-gaps/frame.md` | Leg check flags closed-without-target and completed-without-amountReceived; reserved auto-debit note refused as user input (no migration) | done | PR |
| 30 | `openspec/changes/archive/2026-11-25-due-charges-net-worth/frame.md` (change A) | Net worth net of due charges (`PENDING` of the month) + « Reste à vivre (comptes) » (non-savings balances minus due charges). Pure functions + tests, WealthCard | done | `docs/handoffs/20261125-0130-30-due-charges-owner-scope.md` |
| 31 | `openspec/changes/archive/2026-11-25-charge-owner-scope/frame.md` (change B, from `specs/30-due-charges-owner-scope.md`) | Charge owner/debtor (member or common), `scopeToMember` via `chargeOwner`, per-account sub-chips for donut/Sankey. Needs 30. Prisma migration = human gate | done | `docs/handoffs/20261125-0144-charge-owner-scope.md` (PR #75) |
| 32 | (fast-track) | Service tests for charge owner on create/update (account owner, other member, common, 422 refusals). Covers the service half of the owner select; the form half stays unchecked in the UI | done | PR (fast-track) |
| 33 | `specs/33-dashboard-scope-fullscreen-only.md` | Chips Foyer/membre seulement dans le plein écran des graphiques ; cartes de la page toujours Foyer ; sous-chips sans comptes épargne. User 2026-11-25 | done | `docs/handoffs/20261125-1157-33-dashboard-scope-fullscreen-only.md` |
| 34 | (à écrire) `docs/plans/20261125-budget-projection-import.md` § Sous-spec 34 | Scénarios de bout en bout du budget sur plusieurs mois (2 fichiers, `current` compile et échoue, `projection` verrouille 35). Advisor, tests verrouillés | draft | — |
| 35 | (à écrire) `docs/plans/20261125-budget-projection-import.md` § Défauts constatés | `balanceAsOf`, patrimoine projeté, provisions bornées, dues multi-mois, Sankey/donut/budget alignés. Needs 34 | draft | — |
| 36 | (à écrire) `docs/plans/20261125-budget-projection-import.md` § Sous-spec 36 | Import CSV bancaire (BNP puis Boursorama), spec seulement. Needs un export CSV réel dans `exports-xls/` et 35 | draft | — |
