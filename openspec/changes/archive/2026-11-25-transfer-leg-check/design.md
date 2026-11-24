## Decisions (AUTO-1)

- Codes: SOURCE_MISSING, SOURCE_DUPLICATE, SOURCE_ACCOUNT, SOURCE_AMOUNT, TARGET_MISSING (only when status COMPLETED), TARGET_DUPLICATE, TARGET_ACCOUNT, TARGET_AMOUNT, TARGET_UNEXPECTED (target leg while amountReceived is null), FEES_GAP (completed, fees != round2(amountSent*rateEstimated - amountReceived), tolerance 0.01).
- Amount comparison tolerance 0.005 (floats). Reuses `counterValue`/`transferFees` from conversion.ts.
- Kept minimal and unwired: triage said low value; the master row only requires the pure check.
