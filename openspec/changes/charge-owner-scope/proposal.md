# Proposal — charge-owner-scope

## Why

The dashboard member filter changes nothing for charges: a charge has no owner of its own, it is attributed only through `Account.memberId`. A rent paid from a joint account can never be « Anco's », and a shared grocery budget paid from Anco's account counts as Anco's. The scope also cannot drill down to one account.

## What changes

- `Charge.memberId` (nullable, owner/debtor) and `Charge.shared` (boolean, common to the household). Defaults keep today's behaviour: the charge follows its account.
- Pure `chargeOwner(charge, account)` returns the owner member id, or `null` for common.
- `scopeToMember` attributes charges and their payments through `chargeOwner`; new optional `accountId` restricts the scope to one account.
- Charge create/edit forms: « Propriétaire / débiteur » select (each member, Commun, Suivre le compte).
- Charge list/detail owner badge uses `chargeOwner`.
- Dashboard: with a member selected, sub-chips list that member's accounts (`?compte=`); donut and Sankey follow; reset on member change.

## Out of scope

- Splitting one charge between several members.
- Owner on incomes, transactions or transfers (still attributed by account).
- Backfilling existing charges: all stay « Suivre le compte ».

## Human gate

Prisma migration (`Charge.memberId`, `Charge.shared`) needs the human go-ahead before it runs (GIT-7).
