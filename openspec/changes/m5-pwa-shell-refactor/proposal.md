# Proposal

## Why

Sur mobile, la TabNav n'est pas fixe : elle vit dans le flux du document et n'est atteignable qu'en scrollant tout en bas. L'app n'est pas installable (aucun manifest, aucune icône, aucun service worker, aucun viewport `cover`) : ce n'est pas une PWA, seulement un site responsive. En parallèle, l'UI a accumulé de la duplication (chip de filtre membre, panneaux chargement/erreur, logique d'affichage des montants) et des copies mixtes FR/EN, ce qui rend les vues difficiles à faire évoluer.

## What Changes

- **Coque mobile fixe** : header et TabNav ancrés, `main` seul scrollable (`h-dvh`, `min-h-0`), zones sûres iOS (`env(safe-area-inset-*)`), navigation toujours accessible.
- **PWA installable** : `app/manifest.ts` (nom, icônes 192/512 + maskable, `display: standalone`, `theme_color`), icônes dans `public/`, meta iOS (`apple-mobile-web-app-*`, `apple-touch-icon`), viewport `device-width` + `viewport-fit=cover`.
- **Résilience hors-ligne** : service worker minimal (précache de la coque + page `/offline`), enregistrement client, pas de nouvelle dépendance.
- **Cohérence de navigation** : titres header pour toutes les routes (`/alerts` inclus), sous-vues (nouvelle/édition/détail) sans TabNav, retour explicite.
- **Décomposition UI** : primitives réutilisables (`MemberFilterChips`, `AsyncState`/`ErrorPanel`), helpers purs (`chargeStatus`, `chargeAmountLabel`, `matchesMemberFilter`) sortis du render, `charges-content` découpé (row, détail, échéancier), duplication supprimée.
- **Copy unifiée en français** et `lang="fr"` ; états de chargement/erreur identiques sur toutes les vues ; `error.tsx` manquants ajoutés.
- **Rangement** : charts génériques déplacés hors de `components/common/`, responsabilités par dossier (pas de composant > 500 lignes, aucun render de 300 lignes).

## Capabilities

### New Capabilities

- `app-shell`: comportement de coque applicative — installabilité PWA, viewport/zones sûres, navigation par onglets toujours accessible, visibilité et titres des routes, fallback hors-ligne.
- `ui-feedback`: comportement des états transitoires — chargement, erreur et reprise identiques sur toutes les vues, copy française cohérente, frontières d'erreur par segment.

### Modified Capabilities

Aucune : les capacités métier existantes (dashboard, charges, comptes, transferts, foyer, provisions) ne changent pas de comportement fonctionnel.

## Impact

- `apps/web/src/app/layout.tsx`, nouveau `src/app/manifest.ts`, `src/app/offline/page.tsx`, `public/` (icônes, `sw.js`).
- `src/components/common/` (nouveaux `member-filter-chips`, `async-state`, `error-panel` ; déplacement des charts), `src/components/charges/`, `src/components/accounts/`, `src/components/schedule/`, `src/components/dashboard/`, `src/components/providers/` (enregistrement SW).
- `src/app/*/error.tsx` (dashboard, alerts, household, charges), titres `app-header`.
- Aucun changement d'API, de schéma Prisma ni de dépendance runtime.
- Tests : layout/nav (jsdom), helpers purs extraits, non-régression des 328 tests existants.
