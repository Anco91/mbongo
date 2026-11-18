# Design

## Context

Motivation : voir `proposal.md` — Why.

État actuel et contraintes qui façonnent l'approche (`apps/web`) :

- Aucun manifeste, icône, service worker ni export `viewport`.
- `layout.tsx` utilise `min-h-screen` sur un conteneur sans hauteur bornée ; `TabNav` est un frère de `main`, donc le document grandit et la nav tombe en fin de contenu.
- Gardes serveur (`view → guard → content`) et logique métier pure dans `packages/shared` déjà en place : à préserver.
- Aucun composant ne dépasse 500 lignes (max UI : `charges-content`, 319 l.), mais plusieurs concentrent trop de logique de rendu.
- Copies mixte FR/EN (`Loading accounts...`, `Retry`, `No accounts yet`) ; `lang="en"`.
- Contrainte projet : Next.js App Router, Tailwind, pas de nouvelle dépendance runtime sans nécessité.

## Goals / Non-Goals

**Goals:**

- Coque mobile à hauteur bornée : header et TabNav toujours visibles, `main` seul scrollable.
- Application installable et lisible hors-ligne sans nouvelle dépendance.
- Règles de navigation centralisées et testables (titres, sous-vues).
- Vues découpées en composants à responsabilité unique ; helpers purs hors du render.
- Primitives UI partagées (filtre membre, états chargement/erreur) et copy française.
- Aucun composant > 500 lignes ; vues de composition < 200 lignes.

**Non-Goals:**

- Aucune modification des règles métier, des API, du schéma Prisma ou des schémas Zod.
- Aucun cache des réponses API (données financières) dans le service worker.
- Pas de bibliothèque PWA (`next-pwa`, Serwist), pas de librairie d'état supplémentaire.
- Pas de refonte visuelle : mêmes maquettes, mêmes parcours.

## Decisions

### D1 — Coque à hauteur bornée (`h-dvh`)

`layout.tsx` : conteneur `flex h-dvh flex-col overflow-hidden` (repli `100dvh`), header `shrink-0`, `main` `min-h-0 flex-1 overflow-y-auto`, TabNav `shrink-0`. `dvh` suit la barre d'outils mobile. Le body ne scrolle plus : seul `main` scrolle.

```
+-------------------------------+
| AppHeader        (shrink-0)   |  <- hors scroll
+-------------------------------+
| main: overflow-y-auto min-h-0 |  <- seul scrollable
|                               |
+-------------------------------+
| TabNav           (shrink-0)   |  <- toujours visible
| + env(safe-area-inset-bottom) |
+-------------------------------+
```

Alternatives écartées : `min-h-screen` (état actuel) laisse le document grandir ; `position: fixed` sur la nav sort la nav du flux et impose un padding compensatoire fragile.

### D2 — PWA sans dépendance

`app/manifest.ts` (route Next) + icônes statiques dans `public/` + `public/sw.js` écrit à la main, enregistré par un composant client `service-worker-register.tsx` monté dans le layout. Précache : coque minimale + `/offline` ; réseau d'abord pour les navigations, cache de secours. Les API ne sont jamais mises en cache.

Alternatives écartées : `next-pwa` (non maintenu pour App Router) et Serwist (dépendance supplémentaire non nécessaire pour un précache de coque aussi réduit).

### D3 — Viewport, zones sûres, iOS

`export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#059669' }`. Meta complémentaires via `metadata` : `appleWebApp` (capable, status bar `default`, titre), `icons.apple`. TabNav et plein écran charts ajoutent `pb-[env(safe-area-inset-bottom)]` ; header `pt-[env(safe-area-inset-top)]`. `globals.css` : `html, body { height: 100%; overscroll-behavior-y: none; }` pour éviter le rebond et le pull-to-refresh qui perturbent le swipe mensuel.

Alternatives écartées : `100vh` (saut de la barre d'URL) ; approche JavaScript de mesure de hauteur (inutile, `dvh` est natif).

### D4 — Règles de navigation centralisées

Un seul helper pur `routeChrome(pathname)` dans `src/lib/routes.ts` retourne `{ title, isSubView }` pour toutes les routes (`/alerts`, `/household`, `/schedule`, `/…/new`, `/…/[id]/edit`, `/schedule/[id]`). `AppHeader` et `TabNav` le consomment : plus de `subTitles` / regex divergents, plus de titre `Mbongo` par accident. Les éditions (`/charges/<id>/edit`, `/accounts/<id>/edit`) deviennent des sous-vues (retour + TabNav masquée), cohérentes avec `/new`.

Alternatives écartées : garder les regex dans chaque composant (source de divergence actuelle) ; table de routes dans un contexte React (surcoût inutile pour une décision pure).

### D5 — Décomposition des vues

| Fichier actuel | Extraction | Responsabilité |
|---|---|---|
| `charges/charges-content.tsx` (319 l.) | `charge-row.tsx`, `charge-detail.tsx`, `charge-schedule-list.tsx`, `use-charges-view.ts` | présentation row / détail / échéancier ; état filtre + dérivations |
| `accounts/accounts-content.tsx` (244 l.) | `account-card.tsx`, `use-accounts-view.ts` | carte compte autonome ; filtre + chargement |
| `schedule/schedule-content.tsx` (234 l.) | `use-schedule-rows.ts`, `schedule-row.tsx` | fusion paiements + encours carte hors render |
| `schedule/payment-detail-content.tsx` (249 l.) | `payment-actions.tsx`, `payment-schedule.tsx` | actions groupées / calendrier |

Chaque carte de liste reçoit des props prêtes ; aucune dérivation dans le JSX au-delà d'un ternaire d'affichage.

Alternative écartée : conserver les monolithes et n'extraire que les helpers (laisse des fichiers de 250-320 lignes à responsabilités multiples).

### D6 — Helpers purs sortis du render

- `chargeStatus(charge, nextPayment, now)` → `src/lib/charges.ts` (remplace la fonction locale, testable).
- `chargeAmountLabel(charge)` → `src/lib/charges.ts` (suffixe `/ mois`, `× n`), utilisé par la row et le détail (fin de la duplication).
- `matchesMemberFilter(memberId, selected)` et `filterCharges(charges, accountsById, filter, member)` → `src/lib/filters.ts`.
- `buildAccountsMap` / `buildChargesMap` / `groupPaymentsByCharge` / `nextPendingByCharge` → helpers purs partagés avec le dashboard.
- Devise/taux : aucune logique nouvelle, `use-display-currency` reste la source.

Alternative écartée : placer ces helpers dans `packages/shared` (ils dépendent de la présentation, pas du domaine métier).

### D7 — Primitives d'état et de filtre

- `components/common/member-filter-chips.tsx` : bloc « Tous les membres + prénoms » (dupliqué à l'identique dans comptes et charges).
- `components/common/async-state.tsx` : `LoadingState` et `ErrorPanel` (message + « Réessayer »), utilisés par toutes les vues ; suppression des trois panneaux inline.
- Les charts génériques (`sankey-flows-chart`, `donut-categories-chart`, `chart-fullscreen`) quittent `components/common/` pour `components/charts/` ; `common/` ne garde que les primitives UI.
- `form-kit.ts` reste le barrel des champs de formulaire.

Alternative écartée : composant compound unique `AsyncState.Loading` / `AsyncState.Error` (API plus large que le besoin ; deux exports nommés suffisent).

### D8 — Rangement et frontières

- `src/lib/` = décisions pures sans React (routes, filtres charges, helpers de présentation).
- `src/components/common/` = primitives réutilisables et sans métier.
- `src/components/<domaine>/` = vues et composants métier du domaine.
- `src/components/charts/` = rendus de graphes génériques.
- `src/components/ui/` = shadcn (inchangé).
- Aucun composant > 500 lignes ; objectif < 200 lignes par fichier de vue.

Alternative écartée : tout regrouper sous `components/ui/` (mélangerait shadcn et composants métier).

### D9 — Vérification

`npx tsc --noEmit`, `npx eslint src --ext .ts,.tsx`, `npx jest --silent` (328 tests existants + nouveaux : `routeChrome`, helpers purs, `MemberFilterChips`, `AsyncState`, layout nav), `npm run build` + smoke mobile DevTools (nav fixe, scroll central, installabilité, offline). Aucun changement de comportement métier.

## Risks / Trade-offs

- [Le service worker sert un cache obsolète après un déploiement] → `CACHE_VERSION` incrémenté à chaque changement de coque, nettoyage des caches inconnus à l'activation, enregistrement désactivé en développement.
- [`overscroll-behavior-y: none` supprime le pull-to-refresh] → comportement voulu pour une PWA plein écran (le swipe mensuel ne doit pas recharger la page) ; documenté dans le design.
- [La nav masquée sur les éditions change un parcours existant] → même règle que `/new` (sous-vue avec retour explicite) ; test de non-régression sur les routes d'édition.
- [Déplacement des charts casse des imports] → déplacement atomique avec mise à jour du barrel et `tsc`/`jest` comme filet ; aucun changement de rendu.
- [Le découpage des vues modifie l'ordre de rendu] → extraction sans changement de markup ni de props publiques ; tests existants conservés comme preuve de non-régression.
- [L'audit ne détecte pas les problèmes d'installation sur Safari iOS] → smoke test manuel en mode standalone, plus contrôle des métadonnées côté build.

## Migration Plan

1. Groupe 1 (coque + routes) en premier : correctif visible, aucun changement métier.
2. Groupe 2 (PWA) ensuite : additif (fichiers statiques + métadonnées), sans impact sur les vues.
3. Groupes 3 et 4 (décomposition + primitives) par domaine, un fichier à la fois, avec `tsc` et `jest` après chaque extraction.
4. Rollback : chaque groupe est indépendant ; revert du commit du groupe concerné suffit. Aucune migration de données, aucun changement de schéma.
5. Service worker : si un cache fautif est livré, publier un `CACHE_VERSION` supérieur ; en dernier recours, désenregistrer le SW via un script de secours.

## Open Questions

- Identité visuelle des icônes : monogramme simple généré par défaut (SVG maskable + PNG 192/512) ; fournir les sources si une identité existe.
