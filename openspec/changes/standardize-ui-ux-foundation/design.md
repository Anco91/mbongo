# Design

## Context

Voir `proposal.md` — Why. Contraintes actuelles qui pèsent sur l'approche :

- Rendu serveur par guard asynchrone : la page attend le prefetch avant tout affichage (`accounts-guard.tsx`, `schedule-guard.tsx`). Aucun `loading.tsx` n'existe dans `src/app`.
- TanStack Query hydrate le cache serveur ; les mutations client passent par des hooks de domaine (`src/hooks/`).
- Le kit formulaire existe déjà (`components/common/form.tsx`) mais chaque formulaire compose lui-même son bouton et son succès.
- Deux specs existantes imposent le comportement inverse de celui demandé : libellés Sankey en carte (`dashboard`) et libellés dans l'anneau du donut (`dashboard`). Les deltas les remplacent.
- `role` est présent dans le schéma Prisma, le seed, le schéma zod partagé, le contrat HTTP et trois composants. Aucun autre usage.
- `/schedule` n'a aucun point d'entrée : route orpheline.

## Goals / Non-Goals

**Goals :**

- Une seule taxonomie de composants, appliquée par une règle vérifiable.
- Un seul chemin de soumission, d'attente, d'erreur et de succès pour tous les formulaires.
- Un squelette par route, visible dès le tap, sans saut de mise en page.
- Des graphes lisibles à 390 px de large.
- Un vocabulaire unique, documenté et testable.
- Retrait complet du rôle membre, sans donnée résiduelle.

**Non-Goals :**

- Pas de refonte visuelle globale ni de changement de palette.
- Pas de librairie i18n : une seule langue, des chaînes en place.
- Pas de rendu optimiste des mutations.
- Pas d'ajout de route ni de fonctionnalité métier.
- Pas de découpage des specs existantes hors du périmètre `dashboard`, `app-shell`, `household-members`, `ui-feedback`.

## Decisions

### D1. Taxonomie `ui / form / patterns / charts / features`

Nouvelle arborescence :

```
components/
  ui/          primitives design (button, card, badge, skeleton)
  form/        Form, FormSection, FormField, inputs, FormActions, FormError
  patterns/    app-shell, app-header, tab-nav, month-cursor, swipe-zone,
               detail-sheet, detail-row, show-more-list, async-state,
               empty-state, filter-chips, section-title, delete-button
  charts/      renderers (donut, sankey, chart-fullscreen)
  dashboard/   orchestrateur + hook + cards/
  payments/    payment-detail-*, payment-reconcile-actions, payment-candidates
  schedule/    timeline uniquement
  accounts/ charges/ transfers/ household/
```

Règles d'affectation : un composant qui ne connaît aucun domaine va dans `ui/`, `form/` ou `patterns/` ; un composant qui importe un type métier reste dans son domaine. `formatAmount` et `formatDate` sortent de `common/` vers `lib/format.ts` : ce sont des fonctions, pas des composants.

Alternatives rejetées : Atomic Design (`atoms/molecules/organisms`) — jargon supplémentaire et frontières floues ; arborescence entièrement feature-first avec sous-dossiers `ui/` par feature — duplique la taxonomie et complique les imports transverses.

### D2. Nommage kebab-case, documenté

Le code est en kebab-case partout ; `CONVENTIONS.md` affirme le contraire (`PascalCase`). La convention suit le code, pas l'inverse : un seul changement de documentation, zéro renommage de masse des composants. Les composants exportés restent en PascalCase, seuls les fichiers changent de casse.

### D3. `FormActions` comme unique ossature d'actions

```tsx
<FormActions
  submitLabel="Créer la charge"
  isPending={isCreating}
  error={error?.message}
  onCancel={...}          // optionnel
  destructive={...}       // optionnel : slot DeleteButton
/>
```

Rendu fixe : bouton principal `size="lg"` pleine largeur, annulation `outline` pleine largeur, séparateur puis zone destructive. L'indicateur d'attente est un `Loader2` en rotation à largeur fixe, le libellé principal reste affiché ; le bouton est désactivé et porte `aria-busy`. `FormError` remplace les `<p className="text-red-600">` locaux ; `FormSuccess` remplace les écrans de succès dupliqués.

Alternatives rejetées : un composant `SubmitButton` seul — ne règle pas la position ni la zone destructive ; un wrapper `StandardForm` qui possède le `useForm` — cache le resolver et les defaults au parent, contraire au kit actuel.

### D4. Chargement par `loading.tsx`, pas par `Suspense` manuel

Chaque segment concerné reçoit un `loading.tsx` : `/charges`, `/transfers`, `/accounts`, `/schedule`, `/household`, `/alerts`, `/accounts/[id]/edit`, `/charges/[id]/edit`, `/schedule/[id]`, plus les routes `new`. Next streame le fallback dès la navigation, avant la résolution du guard. Les squelettes sont des compositions de primitives `ui/skeleton.tsx` (`SkeletonLine`, `SkeletonCard`, `SkeletonList`), au gabarit de la vue cible : même hauteur de carte, même nombre de lignes.

`/schedule` garde son `Suspense` existant, remplacé par un fallback squelette pour rester cohérent avec les autres segments.

Alternative rejetée : envelopper chaque `XxxView` dans un `Suspense` dans `page.tsx` — duplique la logique, oublie les sous-routes, et ne couvre pas la navigation vers une route non encore visitée.

### D5. Dashboard : squelette, pas drapeau `mounted`

`dashboard-content.tsx` rend des cartes vides jusqu'au montage puis les remplit, ce qui produit un pop-in et un saut de mise en page. Remplacer le couple `mounted` + données vides par un état « squelette de charts » de hauteur identique, conservé tant que l'hydratation n'est pas terminée. Le rendu serveur et le premier rendu client restent identiques, donc pas de mismatch d'hydratation.

### D6. Mutations : terminer avant de naviguer

`DeleteButton` devient asynchrone : il reçoit `onConfirmed: () => Promise<unknown>`, affiche un état d'attente, désactive les deux boutons, et ne rend la main qu'après résolution. Les hooks concernés exposent `mutateAsync` ; la navigation vit dans `onSuccess`. Les échecs restent sur place et affichent `InlineError`.

Alternative rejetée : navigation optimiste immédiate + invalidation en arrière-plan — masque les échecs et laisse une liste périmée, contraire à l'exigence « mutation terminée avant navigation ».

### D7. Graphiques : politique unique carte/plein écran

- `SankeyFlowsChart` : défaut `showLabels={false}` ; `margin.right` réduit à 16 px en carte. Le plein écran passe `showLabels` et une marge large. Le tooltip Recharts couvre le survol et le tap.
- `DonutCategoriesChart` : suppression de `donutSegmentLabel` et de la prop `showSegmentLabels`. Le total au centre reste. `DonutLegend`, aujourd'hui code mort, est rendu sous le donut en plein écran, avec le formatage de devise déjà injecté.

Sur mobile, l'absence de survol est compensée par la légende (lecture sans interaction) et le tooltip au tap.

### D8. Retrait du rôle membre

Ordre : schéma zod partagé → contrat HTTP → service et contrôleur → formulaire et vue → migration Prisma → seed → tests. La migration supprime la colonne `role`. Les deux membres seedés n'ont pas d'information de rôle à conserver.

**BREAKING** : les clients qui envoient `role` reçoivent une validation stricte (champ inconnu rejeté ou ignoré selon le mode zod retenu). Le contrat documente l'absence du champ. Rollback : migration inverse recréant `role` avec défaut `PRIMARY`, sans perte fonctionnelle puisque le champ n'est plus lu.

### D9. Lexique en place, glossaire séparé

Pas de module de chaînes ni de fichier `messages.ts` : les libellés restent dans les composants. `docs/LEXIQUE.md` fixe le terme retenu par concept, avec l'ancien terme en regard. La revue compare les libellés au glossaire ; aucune abstraction supplémentaire.

### D10. Points d'entrée des vues orphelines

- `/household` : ligne d'action avec chevron en bas de la vue Comptes, libellée « Gérer les membres ».
- `/schedule` : action « Échéances à venir » dans la vue Charges, avec icône calendrier.
- `/alerts` : cloche existante conservée.

Titres : `routeChrome` remplace « Vue foyer » par « Membres du foyer » et « Échéancier » par « Échéances à venir ». Les libellés d'onglets restent inchangés pour ne pas dépasser la largeur mobile.

## Risks / Trade-offs

- **Renommages massifs** → commits par phase (structure, puis formulaire, puis routes), `git mv` pour garder l'historique, `npm run typecheck` après chaque phase.
- **Squelettes désalignés** → chaque squelette reprend les classes de hauteur de sa vue ; vérification visuelle sur 390 px.
- **Doublons temporaires** pendant la transition (`common/form.tsx` et `form/`) → déplacement atomique par phase, aucun export conservé après migration.
- **Suppression de colonne irréversible en production** → sauvegarde avant migration ; le champ n'a aucun usage, donc aucune logique à restaurer.
- **Perte du survol sur tactile** → légende systématique en plein écran pour le donut ; tooltip au tap pour le Sankey.
- **Coût du prefetch inchangé** → les guards restent tels quels ; le gain vient de la perception (squelette immédiat), pas du temps serveur. Une réduction du prefetch est hors périmètre.

## Migration Plan

1. Phase structure : `git mv`, mise à jour des imports, `lib/format.ts`, correction de `CONVENTIONS.md`. Aucun changement de comportement.
2. Phase formulaire : `FormActions`, `FormError`, `FormSuccess`, `DeleteButton` asynchrone, migration des quatre formulaires.
3. Phase chargement : `ui/skeleton.tsx`, `loading.tsx` par segment, squelette du dashboard.
4. Phase graphes et lexique : politique carte/plein écran, `docs/LEXIQUE.md`, application des libellés, points d'entrée des vues orphelines.
5. Phase rôle : schéma partagé, API, UI, migration Prisma, seed, tests.

Rollback : les phases 1 à 4 sont réversibles par revert de commit. La phase 5 se rollback par migration inverse ; aucune donnée métier ne dépend du rôle.

## Open Questions

Aucune question bloquante : les choix de périmètre sont couverts par les specs du change.
