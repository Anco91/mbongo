# Tasks

- [x] Implement `checkTransferAccounts`, `isSameCurrencyTransfer`, `settleSameCurrencyTransfer` (locked tests)
- [x] `buildTransferFormSchema` uses `checkTransferAccounts` (messages `Le compte source est clôturé` / `Le compte cible est clôturé`; same-account stays on the shared schema)
- [x] `TransferService.create`: replace CHF/EUR rule with `checkTransferAccounts` (422); same currency creates COMPLETED + both legs
- [x] Form: any open account on both sides, hide rate/preview when same currency (send rate 1), success message by mode
- [x] ARCHITECTURE.md registry row
