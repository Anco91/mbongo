# Proposal

## Why

Le budget mensuel est aujourd'hui entièrement dérivé : le dashboard additionne les échéances du mois et les provisions, mais l'application ne sait ni saisir un revenu, ni dire qu'un mois a été préparé. Chaque début de mois, l'utilisateur doit retrouver seul ses charges, ses comptes et ses revenus, et rien ne lui signale que le mois courant n'a pas été revu. Le premier lancement ne propose aucun chemin guidé.

Ce change introduit un rituel unique — **Préparer le mois** — qui sert au premier lancement, à l'arrivée d'un nouveau mois et à la reprise d'un mois non préparé.

## What Changes

- Nouvelle page `/budget/[mois]` en quatre étapes : **Revenus**, **Charges**, **Comptes**, **Récapitulatif**. Chaque étape écrit directement dans les entités existantes (`Income`, `Charge`, `Payment`, `Account`, `Transaction`) ; aucun brouillon parallèle.
- Nouvelle carte sur le dashboard : « Budget de novembre — à préparer » avec l'action **Préparer le mois**. Elle disparaît quand le mois est marqué préparé.
- Nouveau modèle `Income` (source de revenu récurrente : salaire, allocation) et rattachement optionnel `Transaction.incomeId`. Le wizard préremplit le revenu du mois à partir de ces sources.
- Nouveau modèle `MonthlyBudget` : une ligne par mois (`2026-11`), marquée préparée par l'utilisateur. L'absence de ligne pour le mois courant déclenche l'invitation.
- Première utilisation : si le foyer n'a aucun compte, le dashboard invite à créer le foyer et le premier compte avant d'ouvrir le wizard.
- Récapitulatif : revenus du mois − échéances du mois − provisions = reste à vivre, calculé avec `computeMonthlyBudget` et les transactions positives du mois.
- Le wizard réutilise les formulaires de charge et de compte existants, y compris l'édition en place du montant d'une charge (régénération des échéances futures) et la suppression confirmée.
- **BREAKING** pour les clients de l'API : `Transaction` expose `incomeId` et `budgetMonth` (nullable) ; l'écriture de ces champs passe uniquement par `POST /api/incomes/{id}/confirm`. Aucun client existant n'est cassé tant qu'il ignore ces champs.

Non inclus : plan mensuel de montants prévus distincts du réel, comparaison prévu/réel, récurrence de revenu hebdomadaire ou quotidienne, import bancaire.

## Capabilities

### New Capabilities

- `monthly-budget`: état de préparation d'un mois, parcours guidé en quatre étapes, récapitulatif revenus/charges/provisions, détection du premier lancement et du mois non préparé.
- `income-management`: sources de revenu récurrentes, confirmation du revenu du mois et rattachement aux transactions.

### Modified Capabilities

- `dashboard`: ajout de la carte d'invitation « Préparer le mois », de son état préparé/à préparer et de l'action d'entrée vers `/budget/[mois]`.

## Impact

- **Base** : nouveaux modèles `Income`, `MonthlyBudget` ; colonne nullable `Transaction.incomeId`, index et FK ; migration + seed de démonstration.
- **Schémas partagés** : `income`, `monthly-budget`, extension de `transactionSchema`/`createTransactionSchema`.
- **API** : `/api/incomes`, `/api/incomes/[id]`, `/api/monthly-budgets` (lire et marquer préparé), extension de `/api/transactions`.
- **UI** : routes `/budget/[mois]` et `/budget/[mois]/[etape]`, carte dashboard, styles et formulaires réutilisés depuis `components/form`, lexique mis à jour (`docs/LEXIQUE.md`).
- **Tests** : schémas partagés, services et contrôleurs, wizard (navigation, reprise, marquage), carte dashboard, non-régression du budget existant.
