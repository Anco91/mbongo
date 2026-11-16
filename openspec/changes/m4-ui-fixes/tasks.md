# Tasks

## 1. Devise d'affichage + taux fiable

- [x] 1.1 `packages/shared` : `PAYMENT_STATUS_LABELS` (code → libellé FR, source de vérité) + `resolveRate(live, fallbackTransfers)` pure retournant `{ rate, rateDate, source: 'live' | 'fallback' } | null` ; tests unitaires sans réseau
- [x] 1.2 `StatusBadge` : consommer `PAYMENT_STATUS_LABELS` — accepter codes ET libellés FR existants (aucun break) ; test du mapping
- [x] 1.3 `DisplayCurrencyProvider` (contexte `EUR | CHF`, localStorage `mbongo.displayCurrency`, défaut EUR) + exposition du taux courant (via hook 1.4) ; wrap dans le layout
- [x] 1.4 Hook `useExchangeRate` : React Query sur Frankfurter (`latest?base=EUR&symbols=CHF`, staleTime 12 h), fallback `findLatestRate(transfers)`, méta `{ rate, rateDate, source }` ; pas de route serveur
- [x] 1.5 `AppHeader` : sélecteur connecté au provider ; dashboard reformate patrimoine consolidé + charts selon la devise (CHF principal ↔ EUR parallèle), mention source + date du taux (« au taux du JJ/MM/AAAA · BCE » / « dernier taux connu du JJ/MM/AAAA »)
- [x] 1.6 Vérification : bascule EUR/CHF live sans rechargement, persistance au rechargement, fallback réseau coupé (débrancher), tests verts

## 2. Alertes : cloche, badge, vue dédiée

- [x] 2.1 IDs d'alertes déterministes dans `computeAlerts` (type + entité + période) si absents ; conserver les tests existants
- [x] 2.2 État lu : `useAlertsRead` (localStorage `mbongo.alertsRead`, ensemble d'IDs) + hook `useActiveAlerts` (computeAlerts sur données prefetchées) ; badge = actives non lues
- [x] 2.3 `AppHeader` : cloche + badge (masquée si 0 ou données absentes), lien vers `/alerts`
- [x] 2.4 Vue `/alerts` : trio view/guard/content (guard prefetch accounts/transactions/charges/payments), liste triée par gravité, état vide lisible, marquage lu à l'ouverture ; retrait du bandeau du dashboard
- [x] 2.5 Vérification : badge décrémenté après consultation, redéclenchement fait revenir le badge, tests alerts view + compteur

## 3. Sankey lisible

- [x] 3.1 `SankeyFlowsChart` dans `components/common/` : renderers custom node/link, palette par type (revenus vert, comptes bleu, dépenses orange), liens colorés par catégorie source (opacité 0.5), tooltips ; mutualisée carte + plein écran (supprime la duplication dashboard)
- [x] 3.2 Vérification visuelle : lisibilité en carte (h-56) et plein écran, contraste suffisant, cohérence des couleurs avec donut

## 4. Pagination transferts

- [x] 4.1 `transfers-content` : `visibleCount` (3 initial, +5 par « afficher les autres »), bouton masqué si tout visible ; test avec 12 transferts et avec 2
- [x] 4.2 Vérification : ordre inchangé (date desc), aucune donnée perdue après révélation complète

## 5. Vérification globale

- [x] 5.1 `npx tsc --noEmit` + lint 0 erreur + suite de tests complète au vert
- [x] 5.2 `npm run build` au vert ; smoke test manuel : dashboard (devise, taux daté + source, sankey coloré, cloche), /alerts, transferts paginés, chips FR sur l'échéancier du dashboard
