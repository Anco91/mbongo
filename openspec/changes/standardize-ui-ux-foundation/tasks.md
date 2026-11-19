# Tasks

## 1. Structure des composants

- [x] 1.1 Créer `components/form/`, `components/patterns/`, `components/dashboard/cards/`, `components/payments/` et déplacer les fichiers au `git mv` selon D1 ; vérifier avec `find src/components -maxdepth 2 -type d` et un `npm run typecheck` vert.
- [x] 1.2 Déplacer `formatAmount`/`formatDate` vers `src/lib/format.ts` et mettre à jour les imports ; vérifier qu'aucun fichier de `components/` n'exporte plus de fonction de formatage (`grep -rn "export function format" src/components`).
- [x] 1.3 Renommer `payment-schedule.tsx` en `payment-candidates.tsx` et `payment-actions.tsx` en `payment-reconcile-actions.tsx`, composants compris ; vérifier qu'aucune référence aux anciens noms ne subsiste (`grep -rn "PaymentSchedule\|payment-actions" src`).
- [x] 1.4 Mettre à jour `CONVENTIONS.md` (kebab-case, taxonomie, point d'import) ; vérifier que la section nommage cite `kebab-case` et que la structure décrite correspond à l'arborescence réelle.
- [x] 1.5 Ajouter un test de garde sur les imports de domaine (aucun composant client n'importe `server/`, aucun `common/` ne réexporte un déplacement oublié) ; vérifier avec `cd apps/web && npx jest __tests__/structure.test.ts`.

## 2. Formulaire standard

- [x] 2.1 Créer `FormActions`, `FormError`, `FormSuccess` dans `components/form/` selon D3 ; vérifier le rendu des trois états par un test Testing Library (`npx jest __tests__/form-actions.test.tsx`).
- [x] 2.2 Rendre `DeleteButton` asynchrone (`onConfirmed: () => Promise<unknown>`, état d'attente, double désactivation) ; vérifier qu'un `onConfirmed` rejeté laisse le bouton réactivé et affiche l'erreur (`npx jest __tests__/delete-button.test.tsx`).
- [x] 2.3 Migrer les formulaires compte (création, édition) vers `FormActions`/`FormError`/`FormSuccess` et attendre la clôture avant `router.push` ; vérifier que la clôture attend la mutation (`npx jest __tests__/account-edit-form.test.tsx`).
- [x] 2.4 Migrer les formulaires charge (création, édition) et ajouter la confirmation de création manquante ; vérifier qu'une création réussie affiche la confirmation puis revient à la liste (`npx jest __tests__/charge-forms.test.tsx`).
- [x] 2.5 Migrer le formulaire transfert et le formulaire membre vers les mêmes primitives ; vérifier que les cinq formulaires partagent le même ordre d'actions (`npx jest __tests__/form-actions.test.tsx`).
- [x] 2.6 Conserver la saisie et afficher `FormError` en cas d'échec de mutation ; vérifier par un test d'échec simulé sur la création de compte.

## 3. Chargement de navigation

- [x] 3.1 Créer `components/ui/skeleton.tsx` (`SkeletonLine`, `SkeletonCard`, `SkeletonList`) ; vérifier le rendu et les classes de hauteur par un test de snapshot ciblé (`npx jest __tests__/skeleton.test.tsx`).
- [x] 3.2 Ajouter `loading.tsx` pour `/charges`, `/transfers`, `/accounts`, `/schedule`, `/household`, `/alerts` avec squelettes au gabarit ; vérifier que chaque route possède son fichier (`find src/app -name loading.tsx | sort`).
- [x] 3.3 Ajouter `loading.tsx` pour `/accounts/new`, `/accounts/[id]/edit`, `/charges/new`, `/charges/[id]/edit`, `/transfers/new`, `/schedule/[id]` ; vérifier la navigation vers chaque sous-vue sans écran figé.
- [x] 3.4 Remplacer le drapeau `mounted` du dashboard par un squelette de charts de hauteur identique (D5) ; vérifier l'absence de saut de mise en page au premier rendu et `npx jest __tests__/dashboard-content.test.tsx`.
- [x] 3.5 Remplacer le `Suspense` de `/schedule` par le squelette commun ; vérifier que la page affiche le même fallback que les autres segments (`npx jest __tests__/schedule-page.test.tsx`).

## 4. Graphiques

- [x] 4.1 Passer `SankeyFlowsChart` en `showLabels={false}` par défaut, réduire la marge de carte et conserver les libellés en plein écran ; vérifier qu'aucun texte de nœud n'est rendu en carte (`npx jest __tests__/sankey-flows-chart.test.tsx`).
- [x] 4.2 Supprimer `donutSegmentLabel` et la prop `showSegmentLabels` ; vérifier qu'aucun `<text>` de segment n'est rendu et que le total central reste présent (`npx jest __tests__/donut-categories-chart.test.tsx`).
- [x] 4.3 Rendre `DonutLegend` sous le donut en plein écran ; vérifier la présence de chaque catégorie et de son montant (`npx jest __tests__/dashboard-fullscreen-charts.test.tsx`).
- [ ] 4.4 Vérifier la lisibilité à 390 px (aucun chevauchement de texte, légende complète) par une revue visuelle documentée dans la PR.

## 5. Lexique et points d'entrée

- [ ] 5.1 Créer `docs/LEXIQUE.md` avec le tableau terme retenu / ancien terme / écrans concernés ; vérifier qu'il couvre tous les libellés listés dans la spec `interface-copy`.
- [ ] 5.2 Appliquer les libellés du glossaire aux vues dashboard, échéancier, comptes, charges, transferts, foyer et alertes ; vérifier par `grep` qu'aucun ancien terme (« Rapprochement », « Vue foyer », « lissage mensuel », « Défrapprocher ») ne subsiste dans `src/components`.
- [ ] 5.3 Remplacer le lien texte des comptes par une ligne d'action « Gérer les membres » avec chevron ; vérifier le rendu et l'accessibilité du point d'entrée (`npx jest __tests__/accounts-content.test.tsx`).
- [ ] 5.4 Ajouter l'action « Échéances à venir » avec icône dans la vue Charges vers `/schedule` ; vérifier que `/schedule` est atteignable depuis l'interface (`npx jest __tests__/charges-content.test.tsx`).
- [ ] 5.5 Mettre à jour `routeChrome` (« Membres du foyer », « Échéances à venir ») et ses tests ; vérifier les titres de `/household` et `/schedule` (`npx jest __tests__/routes.test.ts`).
- [ ] 5.6 Réviser les titres de sections et messages d'erreur pour suivre le glossaire (« Impossible de charger… », plus de libellé technique) ; vérifier par revue de `docs/LEXIQUE.md` et un test sur `ErrorPanel`.

## 6. Retrait du rôle membre

- [ ] 6.1 Retirer `role` de `packages/shared/src/schemas/member.ts`, du contrat `members.http.ts` et des types exportés ; vérifier `npm run typecheck` à la racine.
- [ ] 6.2 Retirer `role` du service, du contrôleur et des routes API membres ; vérifier que `GET /api/members` ne retourne plus de rôle et que `POST` sans rôle réussit (`npx jest __tests__/member.service.test.ts`).
- [ ] 6.3 Retirer le sélecteur et l'affichage du rôle dans `member-form.tsx` et `household-content.tsx` ; vérifier qu'aucune mention « Titulaire »/« Partenaire » ne subsiste (`grep -rn "Titulaire\|Partenaire\|memberRole" src packages`).
- [ ] 6.4 Retirer `role` de `prisma/schema.prisma` et du seed, puis générer la migration ; vérifier que `npx prisma migrate dev --name remove-member-role` passe et que le seed s'exécute (`npm run db:seed`).
- [ ] 6.5 Mettre à jour les tests touchés par le retrait du rôle ; vérifier la suite complète (`cd apps/web && npm run test`).
- [ ] 6.6 Documenter la rupture de contrat dans le README ou `docs/` ; vérifier que le contrat membres est décrit sans `role`.

## 7. Vérification d'intégration

- [ ] 7.1 Vérifier la chaîne qualité complète : `npm run quality` à la racine (lint, format, typecheck, tests).
- [ ] 7.2 Parcourir le flux manuel : dashboard → charges → échéances → comptes → édition → clôture → foyer, en vérifiant squelette, attente de mutation et retours ; consigner le résultat dans la PR.
- [ ] 7.3 Vérifier `openspec validate standardize-ui-ux-foundation --strict` et l'absence de référence obsolète dans les specs archivables.

## Workflow follow-up

- Archiver le change après revue et validation de la qualité.
- Vérifier le résultat archivé dans `openspec/specs/`.
