# Design

## Contexte

Socle M3 en place : view/guard/content partout, form kit, primitives, `computeConsolidatedBalance` (fallback transferts), `computeAlerts` (asOf), `computeSankeyFlows` (recharts, gris), `StatusBadge` (clés FR), tests 253 verts. Les écarts sont localisés : `AppHeader` (état devise local), `dashboard-content` (bandeau alertes, sankey stylé, statuts bruts), `transfers-content` (pas de pagination), sourcing du taux inexistant.

## Décisions

### D1 — Devise d'affichage : contexte React + localStorage (pas de DB)

Un `DisplayCurrencyProvider` (`'use client'`, contexte `EUR | CHF`) enveloppe le layout. `AppHeader` écrit, les vues lisent. Persistance localStorage (`mbongo.displayCurrency`), défaut EUR. La conversion d'affichage : CHF natif × taux courant pour afficher en EUR, inverse pour EUR → CHF ; les données persistées ne bougent jamais. Le provider expose aussi le taux courant et sa méta (date, source : `live` | `fallback` | `none`) — une seule source de vérité pour les deux concerns.

### D2 — Taux : hook client `useExchangeRate` (Frankfurter), pas de route dédiée

Fetch direct côté client vers `https://api.frankfurter.dev/v1/latest?base=EUR&symbols=CHF` au montage du dashboard (swr-like via React Query, `staleTime` 12 h). Cache = cache React Query en session. Fallback : `findLatestRate(transfers)` existant (déjà dans `consolidated.ts`). Fusion dans une petite fonction pure `resolveRate(live, fallbackTransfers)` dans `packages/shared` (testable sans réseau) : retourne `{ rate, rateDate, source: 'live' | 'fallback' } | null`. Pas de persistance DB, pas de clé, pas de proxy serveur (pas de secret, API publique avec CORS ouvert). Si Frankfurter bloque (réseau), React Query retente et le fallback prend le relais immédiatement.

### D3 — Alertes : cloche header + vue `/alerts`, état lu localStorage

- `AppHeader` : icône cloche + badge (nombre d'alertes actives non lues). Le calcul `computeAlerts` reste pure, exécuté dans un petit hook partagé (comptes/soldes/paiements/charges déjà prefetchés par les guards).
- Nouvelle vue `alerts-view/guard/content` sur `/alerts`, pattern vue/guard standard, guard prefetch minimal (les données sont déjà hydratées sur le dashboard, mais `/alerts` est une route directe → prefetch services comme dashboard-guard).
- État lu : ensemble d'IDs d'alertes lues en localStorage (`mbongo.alertsRead`). L'identifiant d'alerte est déterministe (type + entité + période, produit par `computeAlerts`), donc le redéclenchement crée un nouvel ID non lu → badge revient. localStorage et non DB : périmètre par appareil, aucune valeur métier.
- Le badge du header a besoin des données même hors dashboard → le hook tourne dans le provider racine (les guards prefetchent déjà tout au chargement des vues ; le badge ne s'affiche que quand les données sont là).

### D4 — Sankey : renderers custom recharts

Node/link renderers custom (`SankeyNode`, `SankeyLink`) : palette fixe par type de nœud (revenus = vert, comptes = bleu/slate, dépenses = orange/rose), liens colorés par catégorie source avec opacité 0.5, tooltips natifs. Composant `SankeyFlowsChart` dans `components/common/` pour mutualiser carte + plein écran (supprime la duplication actuelle).

### D5 — Libellés FR centralisés

`StatusBadge` accepte les codes (`UPCOMING`, `DUE`, `PAID`, `CANCELLED`, `FAILED`, `ESTIMATED`, `COMPLETED`, `PENDING`) ET les libellés FR déjà utilisés, via une map unique `PAYMENT_STATUS_LABELS` dans `packages/shared` (source de vérité zod-adjacente). Appels existants qui passent déjà du FR restent valides — aucun break.

### D6 — Pagination transferts : révélation client

Client-side : `visibleCount` état (3, puis +5 par tap « afficher les autres »). Pas de query params, pas de cursor serveur — la liste est déjà petite (mono-utilisateur, historique humain). Même pattern que « Échéances du mois ».

## Non-décisions

- Pas d'i18n complet : l'app est FR seule, la map centralisée suffit (décision utilisateur).
- Pas de persistance du taux en DB : valeur dérivée, re-fetchable, aucune valeur métier.
- CSV F9 : hors scope, en attente des samples.
- Vue foyer + attribution membre + dashboard mensuel : change séparé `m4-household-history` (décision utilisateur, option B).

## Risques

- Frankfurter indisponible au premier chargement sans transfert → « Taux indisponible » (déjà géré).
- Badge cloche sans données hydratées (route directe) → guard prefetch ; coût faible (findMany existants).
- Recharts Sankey custom renderers : API recharts stable pour `Sankey` node/link components ; test visuel manuel requis.
