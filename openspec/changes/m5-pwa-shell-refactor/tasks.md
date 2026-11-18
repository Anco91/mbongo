# Tasks

## 1. Coque mobile fixe

- [x] 1.1 `layout.tsx` : conteneur `h-dvh` borné, header `shrink-0`, `main` `min-h-0 flex-1 overflow-y-auto`, TabNav `shrink-0` ; `globals.css` (`height: 100%`, `overscroll-behavior-y: none`) ; test layout (nav montée, main scrollable)
- [x] 1.2 Zones sûres : header `pt-[env(safe-area-inset-top)]`, TabNav et `chart-fullscreen` `pb-[env(safe-area-inset-bottom)]`
- [x] 1.3 `routeChrome(pathname)` pur dans `src/lib/routes.ts` (titres `/alerts`, `/household`, `/schedule`, sous-vues `/new`, `/[id]/edit`, `/schedule/[id]`) ; `AppHeader` + `TabNav` branchés dessus ; suppression de `subTitles`/regex locaux ; tests unitaires des routes

## 2. PWA installable

- [x] 2.1 `app/manifest.ts` (nom, `short_name`, `start_url: /`, `display: standalone`, `background_color`, `theme_color`, icônes 192/512 + maskable) ; icônes dans `public/`
- [x] 2.2 `export const viewport` (`device-width`, `initialScale: 1`, `viewportFit: cover`, `themeColor`) + `metadata` iOS (`appleWebApp`, `icons.apple`, `lang="fr"`) ; test de présence des métadonnées
- [x] 2.3 `public/sw.js` : `CACHE_VERSION`, précache de la coque + `/offline`, réseau d'abord sur navigation, jamais de cache API ; `service-worker-register.tsx` monté dans le layout, désactivé en dev ; test du register (navigator.mock)
- [x] 2.4 Page `/offline` statique (aucune requête) avec lien de reprise

## 3. Décomposition des vues

- [x] 3.1 `src/lib/charges.ts` : `chargeStatus`, `chargeAmountLabel` purs (+ tests) ; remplacer la fonction locale et les deux ternaires de suffixe dans `charges-content`
- [x] 3.2 `src/lib/filters.ts` : `matchesMemberFilter`, `filterCharges`, `buildAccountsMap`, `buildChargesMap`, `groupPaymentsByCharge`, `nextPendingByCharge` (+ tests) ; réutilisés par charges, comptes, dashboard
- [x] 3.3 `charges/` : extraire `charge-row.tsx`, `charge-detail.tsx`, `charge-schedule-list.tsx`, `use-charges-view.ts` ; `charges-content` devient composition (< 120 l.)
- [x] 3.4 `accounts/` : extraire `account-card.tsx` + `use-accounts-view.ts` ; `accounts-content` < 120 l.
- [x] 3.5 `schedule/` : extraire `use-schedule-rows.ts` (fusion paiements + encours carte) et `schedule-row.tsx`
- [x] 3.6 `schedule/payment-detail-content` : extraire `payment-actions.tsx` et `payment-schedule.tsx`

## 4. Cohérence UI

- [x] 4.1 `common/member-filter-chips.tsx` : primitive unique (Tous les membres + prénoms), appliquée à comptes et charges ; test
- [x] 4.2 `common/async-state.tsx` : `LoadingState` + `ErrorPanel` (message FR + « Réessayer ») ; remplacer les panneaux inline (comptes, transferts, échéancier, détail échéance) ; test
- [x] 4.3 Copy FR : remplacer `Loading accounts...`, `Retry`, `No accounts yet` et libellés anglais résiduels ; `lang="fr"`
- [x] 4.4 `error.tsx` ajoutés pour dashboard, charges, alerts, household (coque préservée + reprise)
- [x] 4.5 Déplacer `sankey-flows-chart`, `donut-categories-chart`, `chart-fullscreen` dans `components/charts/` ; mettre à jour imports et barrel

## 5. Vérification

- [x] 5.1 `npx tsc --noEmit` + `npx eslint src --ext .ts,.tsx --fix` + `npx prettier --write src` 0 erreur
- [x] 5.2 `npx jest --silent` : les 328 tests existants restent verts + nouveaux tests (routes, helpers, primitives, layout)
- [x] 5.3 `npm run build` + smoke mobile (DevTools) : nav fixe pendant le scroll, installation proposée, mode standalone, offline, zones sûres simulées
- [x] 5.4 Contrôle tailles : aucun composant > 500 l., vues de composition < 200 l. ; rapport final des fichiers déplacés
