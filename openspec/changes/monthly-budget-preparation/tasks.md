# Tasks

## 1. Modèle de données et schémas partagés

- [x] 1.1 Ajouter `packages/shared/src/schemas/income.ts` (source, création, mise à jour, confirmation mensuelle, requête) et vérifier les tests de validation (devise, montant positif, dates, fréquence).
- [x] 1.2 Ajouter `packages/shared/src/schemas/monthly-budget.ts` (clé `AAAA-MM` validée) et étendre `transaction.ts` avec `incomeId` et `budgetMonth` en lecture ; vérifier que les tests de transaction existants passent.
- [x] 1.3 Ajouter les modèles Prisma `Income` et `MonthlyBudget`, les colonnes `incomeId`/`budgetMonth` et l'unicité `(incomeId, budgetMonth)` ; vérifier `npx prisma migrate dev` puis `npx prisma generate` sans erreur.
- [x] 1.4 Vérifier la migration SQL générée : tables, index, clés étrangères, `onDelete: SetNull`, et absence de contrainte sur les transactions ordinaires.
- [x] 1.5 Mettre à jour `prisma/seed.ts` avec une source « Salaire », les revenus des mois seedés et l'état du mois courant ; vérifier `npm run db:seed` deux fois de suite sans doublon.

## 2. Revenus — service et API

- [x] 2.1 Implémenter `server/incomes/income.service.ts` (CRUD, désactivation) et vérifier par tests unitaires les cas source active, désactivée, date de fin.
- [x] 2.2 Implémenter la sélection des sources actives pour un mois (mensuelle dès `startDate`, annuelle au mois anniversaire) et vérifier par tests les bornes `startDate`, `endDate` et `active`.
- [x] 2.3 Implémenter la confirmation mensuelle : upsert d'une transaction positive rattachée, montant ajustable, date contrainte au mois ; vérifier qu'une double confirmation ne crée qu'une transaction.
- [x] 2.4 Implémenter les contrôleurs et routes `/api/incomes` et `/api/incomes/{id}/confirm` ; vérifier par tests HTTP les statuts 201/200/404/422 et les messages lisibles.
- [x] 2.5 Vérifier la suppression d'une source : transactions conservées avec `incomeId` remis à `null`, source absente de la liste ; test d'intégration dédié.
- [x] 2.6 Documenter le contrat revenus dans `docs/API_REVENUS.md` et vérifier que les exemples correspondent aux réponses réelles des tests HTTP.

## 3. État mensuel — service et API

- [x] 3.1 Implémenter `server/monthly-budgets/monthly-budget.service.ts` (lire un mois, marquer préparé en upsert idempotent) et vérifier par tests unitaires.
- [x] 3.2 Exposer `GET /api/monthly-budgets/{month}` et `PUT /api/monthly-budgets/{month}` via contrôleur et routes ; vérifier par tests HTTP le mois absent, le mois préparé et la double préparation.

## 4. Calculs partagés

- [x] 4.1 Étendre `computeMonthlyBudget` avec un convertisseur optionnel `(amount, currency) => number` ; vérifier les tests existants inchangés et un nouveau test CHF/EUR.
- [x] 4.2 Ajouter un helper partagé des revenus du mois (transactions positives hors transferts, conversion par devise) ; vérifier par tests les cas transfert exclu, montant négatif exclu et devise mixte.
- [x] 4.3 Ajouter les helpers de clé mensuelle côté web (`AAAA-MM` vers date à midi, libellé long « novembre 2026 », bornes du mois) et vérifier par tests les mois sans heure d'été et le passage d'année.

## 5. Couche client

- [x] 5.1 Ajouter `repositories/incomes.repository.ts` et `hooks/use-incomes.ts` (liste par mois, création, mise à jour, suppression, confirmation) ; vérifier par tests de hooks les invalidations de `transactions`, `incomes` et du dashboard.
- [x] 5.2 Ajouter `repositories/monthly-budgets.repository.ts` et `hooks/use-monthly-budget.ts` ; vérifier par tests l'état absent, l'état préparé et l'invalidation après `PUT`.
- [x] 5.3 Vérifier que les mutations de revenu et de budget rafraîchissent le Sankey, le récapitulatif et la carte dashboard sans rechargement manuel (test d'intégration de hooks).

## 6. Dashboard et navigation

- [x] 6.1 Créer la carte « Budget de novembre — à préparer » (mois, total des charges, action « Préparer le mois », état préparé avec « Modifier ») et vérifier par tests les deux états.
- [x] 6.2 Brancher la carte sur l'état du mois courant et l'action vers `/budget/{mois}` ; vérifier qu'aucune invitation n'apparaît pour un mois passé consulté via le curseur.
- [x] 6.3 Gérer le premier lancement sans compte actif : le dashboard propose la création du premier compte et n'ouvre pas le wizard ; vérifier par test avec liste de comptes vide.
- [x] 6.4 Ajouter les routes budget au chrome de sous-vue (`routeChrome`) et vérifier par tests le titre, l'eyebrow et le retour.
- [x] 6.5 Ajouter les libellés « Préparer le mois », « Budget de novembre », « Revenus », « Reste à vivre » à `docs/LEXIQUE.md` et vérifier qu'ils sont employés à l'identique dans les composants.

## 7. Parcours — coque et étape Revenus

- [x] 7.1 Créer la page serveur `/budget/[mois]` avec préchargement (comptes, charges, échéances, transactions, revenus, état mensuel), `HydrationBoundary`, squelette de chargement et garde d'erreur ; vérifier par test de route.
- [x] 7.2 Créer la coque du parcours : quatre étapes ordonnées, retour, continuer, sortie, reprise sur données à jour ; vérifier par tests de navigation et de reprise.
- [x] 7.3 Créer l'étape Revenus : sources actives du mois, montant attendu, confirmation ajustable, revenu ponctuel non rattaché ; vérifier par tests l'ajustement, l'absence de doublon et le cas aucune source.
- [x] 7.4 Vérifier que quitter puis rouvrir le parcours après confirmation affiche le revenu confirmé sans proposer une seconde transaction.

## 8. Parcours — étapes Charges et Comptes

- [x] 8.1 Ajouter une prop de sortie (`redirectTo` ou `onSaved`) aux formulaires de charge et de compte existants et vérifier que les pages `/charges/new`, `/accounts/new` et les éditions gardent leur comportement actuel.
- [x] 8.2 Créer l'étape Charges : liste des charges non expirées (y compris fixes sans date de fin), ajustement du montant, suppression confirmée, ajout via le formulaire réutilisé ; vérifier par tests les quatre actions et le masquage des charges expirées.
- [x] 8.3 Vérifier qu'un ajustement de montant depuis l'étape Charges met à jour les échéances futures non payées et laisse les échéances `PAID` intactes (test de non-régression).
- [x] 8.4 Créer l'étape Comptes : liste des comptes actifs, création, ajustement du solde d'ouverture et du découvert ; vérifier par tests le rafraîchissement du patrimoine et l'absence des comptes clos.

## 9. Parcours — récapitulatif et clôture

- [x] 9.1 Créer l'étape Récapitulatif : revenus, échéances hors provisions, provisions, total des charges, reste à vivre converti ; vérifier par tests le scénario 4 400 / 1 877,92 / 2 522,08.
- [x] 9.2 Vérifier les cas revenus à zéro (message non bloquant) et provision non doublée ; tests dédiés.
- [x] 9.3 Implémenter « Terminer » : marquage du mois, invalidation des requêtes, retour dashboard ; vérifier par test que la carte d'invitation disparaît.
- [x] 9.4 Vérifier la réouverture d'un mois préparé (données conservées, aucune duplication de revenu) par test d'intégration.

## 10. Vérification finale

- [x] 10.1 Exécuter `npm run quality` et vérifier lint, format, typecheck et tous les tests verts.
- [x] 10.2 Revue visuelle à 390 px (Chrome headless) du dashboard avec et sans invitation, et des quatre étapes ; consigner les constats dans `verification.md`.
- [x] 10.3 Parcours manuel complet : premier lancement sans compte → création compte → préparation du mois → terminer → réouverture → mois suivant ; consigner le résultat dans `verification.md`.
- [x] 10.4 Exécuter `openspec validate monthly-budget-preparation --strict` et vérifier la validation.

## Workflow follow-up

- Archiver le change après revue et vérification.
- Vérifier le résultat archivé dans `openspec/specs/`.
