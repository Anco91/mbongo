# 33 — Portée membre dans le plein écran seulement

tier: medium

## Summary

- Pourquoi : l'utilisateur veut les boutons Foyer / membre uniquement dans le plein écran du donut et du Sankey, pas sur la page dashboard.
- Ce qui change : la page dashboard n'a plus de chips ; les cartes de la page sont toujours Foyer. Le plein écran garde les chips, et ses sous-chips de comptes n'listent que les comptes courants (pas `SAVINGS`).
- Comportement visible modifié : oui (`specs/current/dashboard/spec.md`, « Portée par membre des graphiques »).

Décisions : `docs/plans/20261125-budget-projection-import.md`, D1.

## Frame

Modify:
- `apps/web/src/components/dashboard/dashboard-content.tsx` : retirer `MemberScopeChips` (l.165-172, import l.35) ; cartes de la page avec scope nul ; plein écran avec `scopeToMember(closedScope, memberId, accountId)`. Garder nuqs `?membre=` / `?compte=`.
- `apps/web/src/components/dashboard/dashboard-fullscreen-charts.tsx` : recevoir les données déjà scopées pour le plein écran ; sous-chips sans compte `SAVINGS`.
- `apps/web/src/components/dashboard/member-scope-chips.tsx` : filtrer les comptes proposés sur `accountType !== 'SAVINGS'`.
- `apps/web/src/components/dashboard/use-dashboard-data.ts` : exposer les données non scopées (page) et le moyen de scoper (plein écran) sans double chargement.
- `specs/current/dashboard/spec.md` : Advisor, au review (SPEC-3).

Read allow-list: `packages/shared/src/lib/calculation/member-scope.ts`, `apps/web/__tests__/member-scope*.test.ts`.
Reuse: `scopeToMember`, `FilterChips`. Libraries: nuqs. Forbidden: schéma, migration, nouvelle dépendance.
Tests: aucun verrouillé (glue). Un `?membre=` persisté ne filtre pas les cartes de la page.

## Handoffs

- `docs/handoffs/20261125-1157-33-dashboard-scope-fullscreen-only.md`
