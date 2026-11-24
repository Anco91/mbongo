# Tasks

- [ ] Implement `checkTransferAccounts`, `isSameCurrencyTransfer`, `settleSameCurrencyTransfer` (locked tests)
- [ ] `buildTransferFormSchema` uses `checkTransferAccounts` (messages `Le compte source est clôturé` / `Le compte cible est clôturé`; same-account stays on the shared schema)
- [ ] `TransferService.create`: replace CHF/EUR rule with `checkTransferAccounts` (422); same currency creates COMPLETED + both legs
- [ ] Form: any open account on both sides, hide rate/preview when same currency (send rate 1), success message by mode
- [ ] ARCHITECTURE.md registry row
