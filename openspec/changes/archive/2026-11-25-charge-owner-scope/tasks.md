# Tasks

- [x] 0. HUMAN GATE: go-ahead received for the Prisma migration
- [x] 1. `schema.prisma` + migration `charge-owner` (`Charge.memberId`, `Charge.shared`); `prisma generate`
- [x] 2. `schemas/charge.ts`: `memberId`, `shared` in base, create refine (exclusive), update
- [x] 3. `charge.service.ts`: persist, map, validate member and exclusivity (create + update)
- [x] 4. Implement `chargeOwner` (`domain/charge-owner.ts`)
- [x] 5. `scopeToMember`: owner attribution + optional `accountId`
- [x] 6. Charge create/edit forms: « Propriétaire / débiteur » select
- [x] 7. `OwnerBadge` call sites (charge row, detail, month-payments, provisions cards) use `chargeOwner`; `use-charges-view.ts` filter
- [x] 8. Dashboard: `?compte=` sub-chips, `useDashboardData` accountId, fullscreen charts
- [x] 9. `docs/LEXIQUE.md`, `ARCHITECTURE.md` registry rows
- [x] 10. `npm run test`, `typecheck`, `lint`, `build`
