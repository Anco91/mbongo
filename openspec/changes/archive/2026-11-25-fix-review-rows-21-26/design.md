## Decisions (AUTO-1)

- Marker = reserved `note` value `AUTO_DEBIT_NOTE` on the Transaction: no migration (GIT-7 gate); rejected a new column.
- Pure `paymentDebitAction(existing {status, hasAutoDebit}, input {status?, amount?, currency?, paidAt?}) -> 'create'|'delete'|'update'|'none'` decides; the service applies it in one `$transaction`.
- Tick guard: `updateMany({where:{id, transactionId:null, status:{not:'PAID'}}})`, 409 when count 0, debit created after the guard.
- Unlink and remove delete an auto debit; reconcile replacing an auto debit deletes it in the same transaction (no double count). A real (non-auto) transaction is never deleted.
- Row 23 `rateEstimated`: reviewer worry rejected: the convention everywhere (`counterValue`, forms) is target per source, so `amountSent * rateEstimated` is right for EUR->CHF too. Locked test edit of 0e07dba (`?? ''` type narrowing) retro-approved by the Advisor, no behaviour effect.
- Row 21: pending state is mostly visible in dev (no prefetch, on-demand compile); noted in the spec.
- Row 25 nuqs debt recorded here: member scope stays local state until nuqs is installed.
