# Tasks

## 1. Fix EditableItem UI Bug

- [x] 1.1 Corriger `EditableItem` pour retourner les éléments directement sans fragment `<>...</>`, vérifier que le layout flex de `ItemList` fonctionne correctement sur mobile (390px) et desktop.
- [x] 1.2 Ajouter des tests unitaires pour `EditableItem` vérifiant le rendu correct sans fragment et le layout responsive.

## 2. IncomeSourceForm Component

- [x] 2.1 Créer `components/incomes/income-source-form.tsx` avec `useForm` + `zodResolver(createIncomeSchema)`, prop `onSaved?: (income: Income) => void` pour mode inline, double mode (inline vs page dédiée) comme `ChargeCreateForm`. Vérifier que le formulaire crée une source de revenu correctement.
- [x] 2.2 Ajouter les champs : label, amount, currency (select CHF/EUR), accountId (select), frequency (monthly/yearly), startDate, endDate (optionnel). Vérifier que la validation Zod fonctionne.
- [x] 2.3 Ajouter des tests unitaires pour `IncomeSourceForm` vérifiant la création, la validation, et les deux modes (inline/page).

## 3. IncomesStep CRUD Complet

- [x] 3.1 Ajouter `CreatePanel` avec `IncomeSourceForm` dans `IncomesStep`, bouton "Ajouter un revenu". Vérifier que la création fonctionne et rafraîchit la liste.
- [x] 3.2 Créer `IncomeRow` adapter (comme `ChargeRow`) qui wrap `EditableItem` avec les mutations `useUpdateIncome` et `useDeleteIncome`. Ajouter boutons "Modifier" et "Supprimer" sur chaque ligne.
- [x] 3.3 Vérifier que le CRUD complet fonctionne : créer, modifier, supprimer une source de revenu depuis le wizard. Tester sur mobile (390px).
- [x] 3.4 Ajouter des tests d'intégration pour le CRUD des revenus dans le wizard.

## 4. AccountCreateForm Double Mode

- [x] 4.1 Ajouter prop `onSaved?: (account: Account) => void` à `AccountCreateForm` (comme `ChargeCreateForm`). Vérifier que le mode page dédiée (`/accounts/new`) reste inchangé.
- [x] 4.2 Implémenter le mode inline : si `onSaved` fourni, callback au succès + pas de `FormSuccess` ni redirect. Vérifier avec un test.

## 5. AccountsStep CRUD Complet

- [x] 5.1 Ajouter `CreatePanel` avec `AccountCreateForm` dans `AccountsStep`, bouton "Ajouter un compte". Vérifier que la création fonctionne et rafraîchit la liste.
- [x] 5.2 Créer `AccountRow` adapter qui wrap `EditableItem` avec les mutations `useUpdateAccount` et `useCloseAccount`/`useDeleteAccount`. Ajouter boutons "Modifier" et "Supprimer" sur chaque ligne.
- [x] 5.3 Vérifier que le CRUD complet fonctionne : créer, modifier, supprimer un compte depuis le wizard. Tester sur mobile (390px).
- [x] 5.4 Ajouter des tests d'intégration pour le CRUD des comptes dans le wizard.

## 6. ChargesStep Layout Fix

- [x] 6.1 Améliorer le layout de `ChargesStep` pour mobile (390px) : utiliser classes responsive Tailwind (`flex-col sm:flex-row`, `gap-2`, `w-full sm:w-auto`). Vérifier que les boutons ne débordent pas.
- [x] 6.2 Tester le layout sur 390px, 768px, 1024px et vérifier que tout reste lisible et fonctionnel.

## 7. Renforcer les Règles Agents

- [x] 7.1 Ajouter section "Philosophie de Codage" dans `AGENTS.md` : FP (pure functions, server state first, éviter useState/useEffect/Context), composition (vérifier l'existant, réutiliser patterns), minimalisme (YAGNI, KISS, DRY, fonctions < 30 lignes), craftsmanship (code lisible, tests obligatoires).
- [x] 7.2 Mettre à jour `.kilo/agents/coder.md` avec les mêmes principes FP/craftsmanship. Ajouter règles strictes : "Avant de coder, vérifier si le composant/hook existe déjà", "Préférer composition > inline", "Éviter useState sauf pour UI ephemeral".
- [x] 7.3 Mettre à jour `.kilo/agents/advisor.md` avec les mêmes principes. Ajouter : "Valider que le plan respecte FP/craftsmanship", "Vérifier réutilisabilité avant de proposer de nouveaux composants".

## 8. Vérification Finale

- [x] 8.1 Exécuter `npm run quality` et vérifier lint, format, typecheck et tous les tests verts.
- [x] 8.2 Tester manuellement le wizard complet sur mobile (390px) : créer/modifier/supprimer des revenus, charges, comptes. Vérifier que tout fonctionne et que le layout est correct.
- [x] 8.3 Exécuter `openspec validate fix-budget-wizard-crud-and-coding-standards --strict` et vérifier la validation.

## Workflow follow-up

- Archiver le change après revue et vérification.
- Vérifier le résultat archivé dans `openspec/specs/`.
