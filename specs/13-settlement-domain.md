---
id: 13-settlement-domain
status: done
branch: feat/13-settlement-domain
tier: small
locked_at: bc19af3
locked_tests:
  - apps/web/__tests__/settlement.test.ts
---

# 13 — Settlement domain function

Master: `specs/SPEC_MASTER.md` · Rules: WF-3, WF-7, ROLE-1..4, TEST-1..5

## Summary

Le budget compare ce qui est prévu (un revenu, une échéance, une jambe de virement) à ce qui est réellement passé, mais chaque écran refait ce calcul à sa façon. Cette tranche ajoute une seule fonction pure qui dit si un élément attendu est ouvert, partiel, réglé ou en écart, avec le montant de l'écart. Aucun changement visible : les specs 14, 15 et 16 s'appuient dessus. no behaviour change.

## Goal

`computeSettlement(expected, realized, options?)` returns status + gap for one expected item
(matching model (a), `ARCHITECTURE.md` Decisions 2026-11-24). No schema change, no UI.

## Acceptance criteria

1. No realized amount → `open`, `gap = −expected`, `realized = 0`.
2. |realized − expected| ≤ tolerance (default 0) → `settled`.
3. Realized below expected beyond tolerance → `partial`; above → `discrepancy`.
4. Several realized amounts are summed; sum and gap rounded to 2 decimals (no float drift).
5. `gap = realized − expected` is kept even when settled within tolerance.
6. A realized entry of 0 is realized (not `open`); `open` is only the empty list.
7. Negative or non-finite amount or tolerance → `RangeError`.

Amounts are positive magnitudes in the expected item's currency: the caller converts and
takes absolute values (a sign mismatch, e.g. a credit on a charge, is the caller's business).

## Frame

Standards to read first (CTX-5): none beyond `ARCHITECTURE.md`.

### Create

None: the stub `packages/shared/src/domain/settlement.ts` and its export exist (bc19af3).

### Modify

| Path | Change |
|---|---|
| `packages/shared/src/domain/settlement.ts` | Replace the `throw new Error('not implemented')` body of `computeSettlement` by the logic. Keep the exported types and signature unchanged |

### Read (allow-list)

- `ARCHITECTURE.md`
- `packages/shared/src/domain/settlement.ts`
- `packages/shared/src/domain/income.ts` (only `roundToCents` at the end, to mirror its style)

### Reuse (from the registry)

- `income.ts` `roundToCents` is private there; copy its one-line rounding locally, do not export or touch `income.ts`.

### Style exemplars

- `packages/shared/src/domain/income.ts` — pure function, JSDoc, no dependency.

### Libraries

- None.

### Forbidden

- Any file not listed. No currency conversion, no Prisma/Next/HTTP, no new dependency.
- Editing `settlement.test.ts` (locked) or the exported types.
- No class: a plain function (ARCH-4).

## Tests

### Locked

- `apps/web/__tests__/settlement.test.ts` — criteria 1-7.

`@mbongo/shared` is read through `dist`: run `npm run build -w packages/shared` before `jest`.

### Proof of failure

`npm run build -w packages/shared && cd apps/web && npx jest settlement`

```
Tests: 12 failed, 12 total   (all: Error: not implemented)
```

### Proposed by the Executor

| Path | What it covers | Status |
|---|---|---|

### Test change requests

| Test | Reason | Proposal | Decision |
|---|---|---|---|

## Out of scope

- Using it anywhere (14 unmatched income, 15 transfer legs, 16 statement reconciliation).
- Cross-currency checks and fees (spec 15), tolerance policy per item type.
- ARCHITECTURE.md registry row: the Advisor adds it at review (CTX-3).

## Handoffs

- `docs/handoffs/20261124-2005-13-settlement-domain.md`
