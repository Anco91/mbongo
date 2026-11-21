# Proposal

## Why

Le wizard de préparation de budget mensuel (`/budget/[mois]`) est fonctionnellement incomplet et contient des bugs UI critiques. Les specs existent (income-management, monthly-budget, account-management) mais l'implémentation ne les respecte pas : l'étape Revenus ne permet pas de créer/modifier/supprimer des sources de revenu, l'étape Comptes est en lecture seule, et le composant `EditableItem` casse le layout flex. De plus, les règles agents ne强制ent pas assez les principes de Functional Programming, composition et réutilisabilité, ce qui a conduit à du code dupliqué et inline.

## What Changes

- **Fix EditableItem** : Corriger le fragment `<>...</>` qui casse le layout flex de ItemList
- **Compléter IncomesStep** : Ajouter CRUD complet des sources de revenu (créer, modifier, supprimer) via `IncomeSourceForm` + `CreatePanel` + boutons d'action
- **Compléter AccountsStep** : Ajouter création de compte via `AccountCreateForm` + `CreatePanel`, et boutons modifier/supprimer
- **Corriger ChargesStep** : Améliorer le layout pour éviter que les boutons débordent
- **Renforcer les règles agents** : Ajouter dans `AGENTS.md`, `.kilo/agents/coder.md`, `.kilo/agents/advisor.md` les principes FP/craftsmanship obligatoires :
  - Pure functions first, server state first (TanStack Query)
  - Éviter useState/useEffect/Context sauf justification
  - Vérifier l'existant avant de créer
  - Composition > inline, réutilisabilité stricte
  - YAGNI, KISS, DRY, minimalisme

## Capabilities

### New Capabilities

Aucune nouvelle capability. Ce change corrige l'implémentation de capabilities existantes.

### Modified Capabilities

- `income-management` : L'implémentation actuelle ne permet pas le CRUD complet des sources de revenu dans le wizard (seulement la confirmation mensuelle). La spec exige "créer, modifier et désactiver une source de revenu" — l'UI doit refléter cela.
- `monthly-budget` : L'étape Comptes est en lecture seule alors que la spec exige "permettre d'ajouter un compte ou d'ajuster le solde d'ouverture et le découvert autorisé". L'étape Charges a des problèmes de layout.
- `account-management` : L'UI du wizard n'intègre pas `AccountCreateForm` pour permettre la création de compte depuis l'étape Comptes.

## Impact

- **UI** : Composants `EditableItem`, `IncomesStep`, `AccountsStep`, `ChargesStep`
- **Nouveaux composants** : `IncomeSourceForm` (mirroir de `ChargeCreateForm`)
- **Configuration agents** : `AGENTS.md`, `.kilo/agents/coder.md`, `.kilo/agents/advisor.md`
- **Aucun breaking change API** : Les endpoints existent déjà, seule l'UI est incomplète
- **Tests** : Ajouter tests pour `IncomeSourceForm`, CRUD incomes dans le wizard, CRUD accounts dans le wizard
