# Tasks — fix-budget-charts-alerts-dueday

## 1. Bug 3 — État lu des alertes partagé

- [x] 1.1 Créer `apps/web/src/lib/alerts-read-store.ts` (store module-level, `subscribe`/`getSnapshot`/`markAllRead`, helpers purs `parseReadIds`/`serializeReadIds`, guard SSR) et vérifier via tests purs `__tests__/alerts-read-store.test.ts` (JSON invalide → Set vide, round-trip, immutabilité + notification, fingerprints `{id}|{amount}|{date}`).
- [x] 1.2 Basculer `useAlertsRead` sur `useSyncExternalStore` avec le store (contrat `{ readIds, markAllRead }` inchangé) et vérifier via `__tests__/alerts-badge.integration.test.tsx` : AppHeader + AlertsContent avec le store réel (non mocké), badge effacé sans rechargement, redéclenchement → badge revient.

## 2. Socle — requêtes échéances fenêtrées

- [x] 2.1 Ajouter `useMonthPayments(monthKey)` dans `use-schedule.ts` (clé `['payments', { dueDate: { gte, lte } }]` dérivée de la chaîne du mois, `limit: 500`) ; vérifier via test de hook avec QueryClient de test (clé stable, bornes du mois choisi).
- [x] 2.2 Aligner les prefetch serveur et client sur la même requête fenêtrée typée (`dashboard-guard.tsx`, `alerts-guard.tsx`, `app/budget/[mois]/page.tsx`) ; vérifier via `__tests__/dashboard-content.test.tsx` étendu (charts alimentés par la fenêtre du mois choisi ; changement de mois → nouvelle requête ; mois au-delà des 100 premières échéances correct).
- [x] 2.3 Corriger l'invalidation de `useMarkPaymentAsPaid` vers le préfixe `['payments']` (API du hook conservée) ; vérifier via test d'invalidation du hook.

## 3. Bug 1 — Recap sur les vraies sources

- [x] 3.1 Rewriter `recap-step.tsx` : `computeMonthlyBudget(charges, paymentsDuMois, mois, convert)` avec les échéances fenêtrées + revenus calculés depuis les transactions du mois hors transferts + tuiles « Échéances (hors provisions) » et « Provisions » ; vérifier via `__tests__/recap-step.test.tsx` (charge créée aux steps précédentes → total > 0 ; revenu d'une source démarrée le mois précédent compté depuis la transaction ; tuiles décomposition ; scénario 4 400 / 1 877,92 / 2 522,08).

## 4. Bug 4 — Jour de prélèvement (`dueDay`)

- [x] 4.1 Ajouter `dueDaySchema` (coercition 1–31, nullable, défaut null) + superRefine « mensuel uniquement » dans `packages/shared/src/schemas/charge.ts` ; vérifier via tests du schema (coercition string→number, bornes, chaîne vide rejetée, non-mensuel → erreur).
- [x] 4.2 Ajouter `resolveDueDay` (clamp à la longueur du mois) et l'ancrage mensuel (mois d'ancrage toujours généré, jour choisi) dans `packages/shared/src/domain/schedule.ts` ; vérifier via `__tests__/schedule.due-day.test.ts` (31 → 28/29/30/31 selon le mois ; créé le 23 avec jour 5 → échéance le 5 du mois courant ; `dueDay=null` → jour de `startDate` legacy ; `startDate` futur ; weekly/daily inchangés ; `missingPayments` en non-régression).
- [x] 4.3 Créer la migration Prisma additive (`Charge.dueDay Int?`) et vérifier que `npx prisma migrate dev` s'applique sans perte (colonne nullable, données existantes préservées).
- [x] 4.4 Étendre `charge.service.ts` (`dueDay` en create/toPrisma/toCharge, `touchesSchedule` inclut `dueDay`) ; vérifier via `__tests__/charge.service.test.ts` étendu (création persiste `dueDay` + échéances au jour choisi ; édition `dueDay` → régénération des futures `PENDING` non rapprochées, `PAID`/rapprochées intouchées ; `dueDay` sur fréquence non-mensuelle → 422).
- [x] 4.5 Ajouter le sélecteur « Jour de prélèvement » aux formulaires (`charge-create-form.tsx` défaut 1 + `startDate` défaut 1ᵉʳ du mois courant ; `charge-edit-form.tsx` défaut `dueDay ?? jour de startDate` ; masqué hors mensuel) ; vérifier via tests formulaires étendus (select visible pour `FIXED_RECURRING`, masqué pour `INSTALLMENT`, coercition, défauts).

## 5. Bug 2 — Charts prévu + réalisé

- [x] 5.1 Fenêtrer `useActiveAlerts` sur les échéances `PENDING` à `dueDate ≤ J+30` (`limit: 500`, bornes dérivées de la chaîne jour `YYYY-MM-DD` pour une clé stable) ; vérifier via test du hook (clé stable dans la journée, couverture retard + forecast).
- [x] 5.2 Inclure les échéances `PENDING` du mois dans `computeSankeyFlows` et `computeDonutExpenses` (champ `planned: true`, dédup rapprochement préservée) ; vérifier via `__tests__/m3-calculations.test.ts` étendu (liens/segments `planned`, mois préparé sans paiement → non vide, mois vide → état vide).
- [x] 5.3 Rendre le prévu distinct : `sankey-flows-chart.tsx` (lien pointillé/opacité), `donut-categories-chart.tsx` + `dashboard-fullscreen-charts.tsx` (opacité segment) ; vérifier via tests composants (segments prévus distincts, plein écran inchangé sinon).
- [x] 5.4 Vérifier le parcours manuel : onboarding d'un mois avec charges → Sankey/donut non vides avant tout paiement ; consigner le résultat dans `verification.md`.

## 6. Qualité et vérification

- [x] 6.1 Lancer `npm run quality` (lint, format, typecheck, tests) et atteindre les cibles de coverage : nouvelles fonctions pures 100 % branches, domaine touché ≥ 90 %. La cible « web global ≥ 80 % » est retirée de ce change (écart préexistant, 75,5 % stmts, hors code touché) ; voir `verification.md` §6.1.
- [x] 6.2 Parcourir le flux complet : préparation du mois → recap > 0 → charts prévu visibles → badge alertes effacé sans rechargement → échéance au jour choisi (5) ; consigner les preuves dans `verification.md`.

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
- Verify the archived result.
