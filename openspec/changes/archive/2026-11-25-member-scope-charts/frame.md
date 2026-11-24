---
id: member-scope-charts
status: ready
branch: feat/member-scope-charts
tier: medium
locked_at: 2f449fd
locked_tests:
  - apps/web/__tests__/member-scope.test.ts
---

# Frame — member-scope-charts (master row 25)

## Summary

Le donut et le Sankey du tableau de bord montrent par défaut tout le foyer. Une rangée de boutons « Foyer / <membre> » (un par membre du foyer, générique) restreint les deux graphiques aux comptes de ce membre, y compris depuis le plein écran. Le patrimoine, les alertes et les échéances restent ceux du foyer. Aucune migration.

## Design decisions

- Decision: scope = accounts whose `memberId` is the member (joint accounts, `memberId` null, belong to no member and appear only in « Foyer »); rejected splitting joint expenses (no ownership data).
- Decision: transfers kept only when both ends are the member's accounts.
- Decision: selection is local component state, like the closed-accounts toggle; rejected adding nuqs (new dependency for one chip row; not in package.json). Debt noted.
- Decision: scope applies after `excludeClosedAccounts`; the closed toggle keeps working.

## Frame

Modify:
- `packages/shared/src/lib/calculation/member-scope.ts`: implement `scopeToMember(input, memberId)` (signature locked).
- `apps/web/src/components/dashboard/use-dashboard-data.ts`: new third param `memberId: string | null = null`; apply `scopeToMember` to `chartScope` (charts only).
- `apps/web/src/components/dashboard/dashboard-content.tsx`: state `memberId`, render the chips, pass to the hook and to fullscreen.
- `apps/web/src/components/dashboard/dashboard-fullscreen-charts.tsx`: render the same chips inside the fullscreen view (props `members`, `memberId`, `onMemberChange`).
Create: `apps/web/src/components/dashboard/member-scope-chips.tsx` exporting `MemberScopeChips({ members, value, onChange })` composed from existing `FilterChips` (components/patterns) if it fits, else Tailwind buttons with `aria-pressed`. Members from existing `useMembers`.
Also: `ARCHITECTURE.md` registry row. Advisor only: `specs/current/dashboard/spec.md`.
Forbidden: new dependency, schema, other files, locked test. Checks: npm run test, typecheck, lint, build.
