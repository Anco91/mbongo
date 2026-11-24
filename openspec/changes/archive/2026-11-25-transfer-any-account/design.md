# Design — transfer-any-account

## Kickoff

Product: smallest slice = relax the CHF->EUR rule, add same-currency instant settlement. Nothing about Sankey/balances.
Architect: pure rules in `domain/transfer-accounts.ts`, reused by `buildTransferFormSchema` and `TransferService.create`. No schema or migration: same-currency stores `rateEstimated=1`, `rateEffective=1`, `fees=0`, `amountReceived=amountSent`, status COMPLETED, both legs written in one Prisma transaction. Risk: the form still demands a rate.
Skeptic: closed accounts must be refused server-side (422); legs must be exactly -sent / +received; existing cross-currency flow must not change.

Decision: reuse existing Transfer model (no new kind column) because a same-currency transfer is a COMPLETED transfer at rate 1; rejected a `kind` column (migration, no need).
Decision: form hides rate/fees when currencies match and sends rate 1 because the shared schema requires a positive rate; rejected loosening the schema.
Decision: closed accounts refused for both sides because a closed account takes no new movement.
