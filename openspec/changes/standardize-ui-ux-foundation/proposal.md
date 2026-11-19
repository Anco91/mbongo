# Proposal

## Why

La croissance rapide des features a laissé trois dettes visibles : une arborescence de composants qui mélange atomes, motifs et domaines ; des formulaires qui réimplémentent chacun leur soumission, leur attente et leur succès ; et une expérience mobile sans retour visuel pendant les navigations et mutations. S'y ajoutent des graphes illisibles en carte, un vocabulaire d'interface hérité du développement, et un champ `role` sans usage métier.

## What Changes

- **Arborescence de composants normalisée** : séparation `ui/` (primitives), `form/` (kit formulaire), `patterns/` (motifs transverses), `charts/` (renderers), puis un dossier par domaine. `dashboard/cards/` isole les cartes ; un dossier `payments/` sort le détail d'échéance et le rapprochement du dossier `schedule/`. `formatAmount`/`formatDate` quittent `common/` pour `lib/format.ts`.
- **Renommages de cohérence** : `payment-schedule.tsx` devient `payment-candidates.tsx` (son rôle réel est la sélection de transactions candidates) ; `payment-actions.tsx` devient `payment-reconcile-actions.tsx`.
- **Formulaire standard** : un `FormActions` unique fixe la position des boutons (soumettre, annuler, zone destructive séparée), avec un état d'attente identique partout (spinner + libellé stable, bouton désactivé). Un `FormError` et un `FormSuccess` uniques remplacent les variantes locales.
- **Sortie de formulaire uniforme** : tous les formulaires attendent la mutation avant de naviguer, affichent l'échec au même endroit, et confirment la création avant de revenir à la liste. La création de charge, aujourd'hui silencieuse, est alignée.
- **Chargement de navigation** : chaque segment de route obtient un `loading.tsx` avec un squelette au gabarit réel, et le dashboard remplace son montage différé par un squelette de charts.
- **Graphiques lisibles** : le Sankey n'affiche ses libellés qu'en plein écran ; le donut abandonne les libellés posés dans l'anneau au profit du survol et d'une légende. Les marges de carte sont recalculées pour la largeur mobile.
- **Rôles supprimés** : `role` disparaît du schéma partagé, de l'API membres, du formulaire, de la vue, de Prisma et du seed. **BREAKING** pour les clients de `GET /api/members` et `POST/PATCH /api/members`.
- **Lexique utilisateur** : vocabulaire bancaire et technique remplacé par des libellés orientés foyer ; les actions ressemblent à des actions (icône et affordance explicites) ; un glossaire unique documente les choix.
- **Documentation alignée** : `CONVENTIONS.md` décrit la convention de nommage réellement appliquée (kebab-case) et la nouvelle taxonomie.

## Capabilities

### New Capabilities

- `interface-copy`: vocabulaire visible, ton, affordance des actions et glossaire unique de l'interface.

### Modified Capabilities

- `ui-feedback`: ajoute le chargement de navigation, le formulaire standard (position des boutons, attente, erreur, succès) et l'ordre mutation-puis-navigation.
- `app-shell`: rend explicites l'accès aux vues secondaires (foyer, alertes, échéancier) et leurs titres.
- `dashboard`: inverse la politique de libellés des graphes (Sankey en plein écran seulement, donut sans texte dans l'anneau).
- `household-members`: retire le rôle des membres, à l'API comme dans l'UI.

## Impact

- **UI** : `apps/web/src/components/**` (déplacements et renommages), `apps/web/src/app/**/loading.tsx` (nouveaux), `apps/web/src/lib/format.ts` (nouveau), `apps/web/src/lib/routes.ts`, `apps/web/src/components/common/**`.
- **Contrat partagé** : `packages/shared/src/schemas/member.ts`, `contracts/members.http.ts`, types exportés.
- **Persistance** : `apps/web/prisma/schema.prisma`, migration de suppression de colonne, `apps/web/prisma/seed.ts`.
- **Serveur** : `apps/web/src/server/members/member.service.ts`, `members.controller.ts`, `apps/web/src/app/api/members/**`.
- **Tests** : tests unitaires et d'intégration touchés par les renommages, le retrait du rôle et les nouveaux libellés.
- **Documentation** : `CONVENTIONS.md`, glossaire `docs/LEXIQUE.md`.
