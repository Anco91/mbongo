# Design — due-charges-net-worth

## Decisions

- Decision: due charges = every `PENDING` payment of the current month (not only the already-due ones) because the human validated it; rejected counting only dueDate <= today.
- Decision: current month only (no overdue of earlier months) because `useMonthPayments` loads one month; rejected a new query for a rare case.
- Decision: functions take the CHF→EUR rate and return `null` when a CHF amount cannot be converted; rejected a fake rate (no fictional rate rule of `resolveRate`).
- Decision: new files `due-charges.ts` and `remaining-to-live.ts` rather than growing `consolidated.ts` (already 190 lines); rejected spec wording « consolidated.ts exposes ».
- Decision: label « Reste à vivre (comptes) » differs from the budget recap « Reste à vivre » (other meaning); entry in `docs/LEXIQUE.md`.

## Kickoff

- Product: smallest slice with a visible result; unblocks row 31. Out of scope: owner, scope.
- Architect: reuse `counterValue`, `isInMonth`/`monthRange`; no library needed; 2 new files + 3 edits.
- Skeptic: CHF without rate, credit-card negative balance, payment on month boundary, provisioned double count. Tests pin all four.
- PM: go.
