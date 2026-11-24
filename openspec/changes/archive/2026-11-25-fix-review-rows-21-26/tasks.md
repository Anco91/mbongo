## 1. Payments
- [ ] 1.1 `AUTO_DEBIT_NOTE`, `paymentDebitAction` in `payment-debit.ts` (locked test)
- [ ] 1.2 `payment.service`: tick (guarded, marker note, paidAt default, 422 on currency mismatch, reject transactionId), un-tick/edit sync, unlink/remove/reconcile cleanup, all atomic
## 2. UI
- [ ] 2.1 `ChartFullscreen` `toolbar` slot outside the pan area; dashboard fullscreen passes the chips there
- [ ] 2.2 `effectiveMemberId` fallback in `dashboard-content`
- [ ] 2.3 `aria-pressed` in `FilterChips`; `animation-delay` on tab pulse
## 3. Repo
- [ ] 3.1 `git rm --cached` the dev.db backup; `.gitignore` `*.db.bak*`
- [ ] 3.2 `npm run typecheck`, lint, jest, build
