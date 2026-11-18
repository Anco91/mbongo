# Design

## Contexte

Socle M4-ui-fixes mergé : devise d'affichage partagée, taux live, cloche/badge alertes, `SankeyFlowsChart`/`DonutCategoriesChart`/`DonutLegend` réutilisables, `StatusBadge` FR, pagination transferts (inline). Champs membre réduits à `firstName`+`role` (schema zod + Prisma), service membre lecture seule (`findMany`), repository `GET /members` seul, aucun écran foyer. Le maquette `mock_POC.tsx.todo` porte des `note` sur les charges (texte légende) jamais modélisées.

## Décisions

### D1 — Membre : `lastName` optionnel + CRUD complet

`memberSchema` ajoute `lastName` (string optionnelle, `''`-safe) — optionnel pour ne pas casser le seed ni les membres existants (migration Prisma nullable). CRUD complet : service `create/update/delete` (contraintes : suppression = `update accounts set memberId = null` puis delete, transaction Prisma), controller + routes `POST/PATCH/DELETE /api/members`, repository + hooks `useCreateMember/useUpdateMember/useDeleteMember`. Vue `/household` : trio view/guard/content + form kit (prénom, nom, rôle en `SegmentedToggle`-like via `SelectInput`), suppression via `DeleteButton` existant. Accès : lien « Vue foyer » depuis la page comptes (la tab-nav reste à 4 onglets, maquette).

### D2 — `OwnerBadge` (qui-paie) : dérivation pure

Composant `OwnerBadge` (`components/common/`) : props `memberId: string | null | undefined`, lit la liste des membres (hook), affiche le prénom ou « Foyer » (chip slate). Dérivation pure extraite pour test : `ownerLabel(memberId, members)` dans shared? Non — présentation, reste dans le composant + test du rendu. Appelé dans : cards charges (ligne badges + détail), échéances du dashboard, cards comptes, provisions du dashboard.

### D3 — Dashboard mensuel : paramètre mois unique

État `selectedMonth` (YYYY-MM, défaut courant) dans `dashboard-content`. Helper `monthRange(iso: string): { start: Date; end: Date }` pure (shared, testable). Filtrage par mois appliqué aux entrées de `computeSankeyFlows`/`computeDonutExpenses`/`paymentsInMonth` (transactions, transferts, paiements du mois — `paymentsInMonth(payments, date)` accepte déjà une date ; on lui passe le mois choisi). `computeAlerts` garde `asOf` du jour (état de trésorerie, pas historique). Patrimoine consolidé reste global (multi-mois par nature).

Navigation : curseur « ‹ nov. 2026 › » au-dessus des charts + swipe (pointer events : `onPointerDown/Move/Up`, seuil 60 px horizontal, zone charts) — mêmes patterns que `ChartFullscreen`. Flèches `IconChevronLeft`/`ChevronRight`.

### D4 — Sankey : labels + montants toujours

`SankeyFlowsChart` : labels actifs par défaut (`showLabels` true). Montant par nœud : total calculé des liens (entrant+sortant, max des deux pour éviter double compte, round2) — pure `sankeyNodeTotals(data)`. Label : `nom · montant` sous/à côté du nœud, mise en page : nom au-dessus du montant ? Trop dense en carte → `nom · 3 000 €` une ligne. Marges ajustées (right 90).

### D5 — Donut : total au centre + catégories/% dans l'anneau

`DonutCategoriesChart` : total formaté au centre via un `<text>` SVG (devise d'affichage, `showCenterTotal` par défaut). Plein écran (`showSegmentLabels`) : chaque segment porte « nom · % » en blanc posé sur le bandeau coloré (recharts `Pie` `label` custom, `labelLine: false`, sans survol). Légende retirée de la carte ET du plein écran — « pas du texte à côté » (review : la légende ne concerne QUE les graphes).

### D6 — (abandonné, review)

Champ `note` sur Charge : **abandonné** — la demande « texte légende » ne concernait que les graphes (D5). Modèle Charge inchangé ; les cards de charges gagnent le badge « qui-paie » et la pagination (D7).

### D7 — `ShowMoreList` réutilisable (pagination PWA)

Composant `components/common/show-more-list.tsx` : props génériques `items: T[]`, `renderItem(t, index)`, `initialVisible = 3`, `step = 5`, `labelMore(n)`/`labelLess?`. Révélation « afficher les n autres » + « réduire », bouton pleine largeur style échéances (emerald). Aucune barre de pages : geste natif, liste continue. Utilisé par : transfers-content (refactor), accounts-content, charges-content (rows filtrées), échéances du dashboard, provisions du dashboard. `useMemo` libre à l'appelant ; la pagination est purement présentationnelle.

### D8 — Sélecteur devise dashboard-only

`AppHeader` : rend le sélecteur uniquement quand `pathname === '/'` (dashboard). Le provider reste global (localStorage persiste). Delta m4-ui-fixes (specs/dashboard) amendé avant archive pour que la spec main reflète la portée dashboard.

## Non-décisions

- Pas de renommage des rôles (`PRIMARY`/`PARTNER` conservés, libellés FR à l'affichage).
- Pas de seed auto de nouveaux membres : le foyer existant reste, éditable via la vue.
- CSV F9 : toujours hors scope (samples en attente).
- Pas de barre de pagination web (numéros de pages) : la révélation par paquets est le pattern mobile/PWA choisi.

## Risques

- Swipe vs scroll vertical : seuil horizontal strict (60 px, dy < dx) pour ne pas voler le scroll.
- Migration Prisma nullable : aucune donnée perdue, rollback trivial.
- Suppression membre avec comptes liés : transaction + nullification (sinon FK error).
- Donut sans données : centre affiche « 0 » ? Non — état vide existant conservé.
