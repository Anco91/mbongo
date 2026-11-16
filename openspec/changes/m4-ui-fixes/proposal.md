# Proposal

## Why

Le smoke test M3 révèle des écarts entre l'app et le socle promis : le sélecteur EUR/CHF du header ne change rien (état local non partagé), le Sankey est gris et illisible, les alertes occupent tout le haut du dashboard sans état lu, les chips de statut de l'échéancier s'affichent en anglais, et le taux EUR→CHF dérivé des transferts utilisateur produit un patrimoine consolidé faux (32 653,36 € = 12 779,50 CHF). Il faut un socle UI fiable et lisible avant d'ajouter la vue foyer et l'historique mensuel (m4-household-history).

## What Changes

- **Sélecteur de devise d'affichage fonctionnel** : le choix EUR/CHF du header devient un contexte React partagé ; le dashboard reformate le patrimoine consolidé et les charts selon la devise choisie (montants natifs inchangés, conversion affichée uniquement).
- **Taux EUR→CHF fiable** : fetch du taux officiel au chargement du dashboard via Frankfurter (taux ECB, sans clé), cache par session, fallback dernier taux connu des transferts ; source et date affichées.
- **Alertes : cloche + badge + vue dédiée** : le bandeau empilé du dashboard est remplacé par une icône cloche dans le header avec badge du nombre d'alertes actives ; consultation dans une vue dédiée `/alerts` ; état lu conservé par appareil, badge décrémenté quand lues.
- **Sankey lisible** : nœuds et liens colorés par type (revenus, comptes, dépenses), palette cohérente en carte comme en plein écran.
- **Chips de statut en français partout** : libellés centralisés dans `StatusBadge` (code → libellé FR), fin des codes bruts `UPCOMING`/`DUE`/`PAID` dans l'UI.
- **Pagination de la liste des transferts** : révélation par paquets (« afficher les autres ») adaptée au mobile.

## Capabilities

### New Capabilities

- `exchange-rate` : sourcing du taux EUR→CHF — fetch officiel au chargement du dashboard, cache, fallback dernier taux connu (transferts), source et date affichées.

### Modified Capabilities

- `dashboard` : MODIFIED « Patrimoine consolidé » (taux live + devise d'affichage), MODIFIED « Sankey des flux du mois » (couleurs lisibles), ADDED « Sélecteur de devise d'affichage ».
- `alerts` : MODIFIED « Présentation des alertes » (cloche + badge + vue dédiée au lieu du bandeau), ADDED « État lu des alertes ».
- `transfer-management` : ADDED « Pagination de la liste des transferts ».

## Impact

- `apps/web/src/components/common/app-header.tsx` : sélecteur → contexte partagé ; ajout de la cloche + badge.
- `apps/web/src/components/dashboard/dashboard-content.tsx` : consommation du contexte devise + taux live + Sankey coloré + suppression du bandeau alertes.
- Nouveau `apps/web/src/components/alerts/` (vue/guard/content) + route `/alerts`.
- `apps/web/src/components/transfers/transfers-content.tsx` : pagination client.
- `packages/shared/src/lib/calculation/consolidated.ts` : fallback conservé + fonction de fusion taux live/fallback.
- `packages/shared/src/domain/payment-status.ts` + `components/common/status-badge.tsx` : libellés FR centralisés.
- Pas de migration DB : le taux n'est pas persisté (fetch + cache session) ; l'état lu des alertes est local (localStorage).
- Tests : status-badge, fusion taux live/fallback, pagination transferts, alerts view.
