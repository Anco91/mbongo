# Design

## Context

Voir `proposal.md` — Why. L'état actuel qui contraint l'approche :

- Le budget mensuel est **dérivé** : `computeMonthlyBudget(charges, payments, month)` additionne les échéances du mois et les provisions. Il n'est ni stocké ni exposé par l'UI.
- Les revenus n'ont pas de modèle : seules les `Transaction` positives comptent, et aucun écran ne permet d'en créer.
- Il n'y a ni authentification ni table utilisateur. Le foyer est unique ; « premier lancement » ne peut pas venir d'un compte utilisateur.
- Les charges, comptes, échéances et transactions disposent déjà de services, contrôleurs, schémas Zod partagés et hooks TanStack Query. Le wizard doit les composer, pas les réimplémenter.
- Les montants vivent en devise native (CHF/EUR) et la consolidation passe par un taux partagé.

## Goals / Non-Goals

**Goals:**

- Un état mensuel minimal qui distingue « préparé » de « à préparer ».
- Des revenus récurrents déclarés une fois, confirmés chaque mois sans doublon.
- Un parcours en quatre étapes qui écrit directement dans les entités existantes.
- Un récapitulatif cohérent avec le budget déjà calculé par le dashboard.
- Aucune régression sur les charges, les échéances payées et le Sankey.

**Non-Goals:**

- Plan mensuel figé avec comparaison prévu/réel.
- Authentification, multi-foyer, onboarding par utilisateur.
- Import bancaire, récurrence de revenu hebdomadaire ou quotidienne.
- Refonte du dashboard ou des formulaires existants au-delà du point d'entrée nécessaire.

## Decisions

### D1. Le wizard orchestre, il ne duplique pas

Chaque action d'étape appelle les services existants : création/édition/suppression de charge, création/édition de compte, confirmation de revenu. Aucun modèle « brouillon de budget » ni copie mensuelle des charges.

Alternative écartée : un modèle `BudgetLine` par mois. Il aurait fallu resynchroniser charges, montants et échéances à chaque édition, pour un besoin de comparaison prévu/réel hors périmètre.

### D2. État mensuel : `MonthlyBudget`

```prisma
model MonthlyBudget {
  id         String    @id @default(uuid())
  month      String    @unique   // "2026-11"
  preparedAt DateTime?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

Une ligne existe seulement après « Terminer ». `preparedAt` porte la date de dernière préparation et rend l'opération idempotente (`upsert` sur `month`). L'absence de ligne = mois à préparer. Aucun backfill : les mois passés restent non préparés, ce qui est l'état réel.

Alternative écartée : dériver « préparé » de la présence de revenus ou de charges. Faux dès qu'un mois n'a qu'un revenu ponctuel ou aucune charge.

### D3. Revenus : source récurrente + confirmation mensuelle

```prisma
model Income {
  id        String    @id @default(uuid())
  label     String
  amount    Float
  currency  String    // CHF | EUR
  accountId String
  memberId  String?
  frequency String    // monthly | yearly
  startDate DateTime
  endDate   DateTime?
  active    Boolean   @default(true)
  transactions Transaction[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

La confirmation d'un mois crée ou met à jour une `Transaction` positive :

```prisma
model Transaction {
  // …
  incomeId   String?
  income     Income?  @relation(fields: [incomeId], references: [id], onDelete: SetNull)
  budgetMonth String? // "2026-11", renseigné uniquement par la confirmation
  @@unique([incomeId, budgetMonth])
}
```

- `budgetMonth` matérialise le couple source/mois et rend le doublon impossible côté base. SQLite autorise plusieurs `NULL`, donc les transactions ordinaires ne sont pas contraintes.
- `onDelete: SetNull` : supprimer une source laisse l'historique, en retire seulement le rattachement (spec `income-management`).
- La date de la transaction doit tomber dans `budgetMonth` ; le service le valide.
- Fréquence `monthly` : proposée chaque mois à partir de `startDate`. Fréquence `yearly` : proposée le mois anniversaire de `startDate`. `endDate` et `active` bornent la proposition.

Alternative écartée : étendre `POST /api/transactions` pour créer un revenu rattaché. L'écriture passerait par un endpoint générique sans garantie d'unicité mensuelle. On expose à la place `POST /api/incomes/{id}/confirm` avec `{ month, amount, date? }`, qui fait l'upsert transactionnel.

### D4. « Premier lancement » dérivé, pas stocké

Sans authentification, un indicateur d'onboarding serait un état global déguisé. Le premier lancement se détecte par l'absence de compte actif (`accounts.filter(status === 'ACTIVE').length === 0`). L'écran propose alors la création du premier compte, puis ouvre le wizard. Une fois un compte créé, le wizard et l'invitation mensuelle suffisent.

Alternative écartée : table `OnboardingState` ou drapeau local. Le drapeau local ne survit pas au changement d'appareil et la table ajoute un état à maintenir sans utilisateur à qui l'attacher.

### D5. Une route, quatre étapes locales

Route `/budget/[mois]` (`2026-11`), page serveur qui précharge comptes, charges, échéances du mois, transactions du mois, revenus et état mensuel, puis hydrate un composant client. L'étape courante est un état React local (`revenus → charges → comptes → recapitulatif`) avec boutons « Retour » et « Continuer ».

Alternative écartée : une route par étape. Elle ajoute quatre fichiers, un `loading.tsx` par segment et des transitions de navigation pour un parcours court ; la reprise demandée porte sur les données, pas sur l'étape.

### D6. Écriture immédiate, pas de brouillon

Chaque formulaire d'étape sauvegarde immédiatement via les hooks existants (`useCreateCharge`, `useUpdateCharge`, `useDeleteCharge`, `useCreateAccount`, `useUpdateAccount`, `useConfirmIncome`). Quitter le parcours ne perd rien. Les mutations attendent leur fin avant de changer d'étape ou de naviguer, conformément au standard de formulaire du change `standardize-ui-ux-foundation`.

Alternative écartée : un état local de brouillon appliqué à la fin. Il dupliquerait la validation serveur, empêcherait de reprendre après fermeture et compliquerait la régénération des échéances.

### D7. Réutilisation des formulaires de charge et de compte

`ChargeCreateForm`, `ChargeEditForm` et `AccountCreateForm` reçoivent une prop de sortie (`redirectTo` ou `onSaved`) pour être utilisés hors de leurs pages dédiées. L'étape Charges affiche une liste éditable (montant + enregistrer, supprimer avec `DeleteButton`) et un panneau « Ajouter une charge » qui embarque le formulaire existant. L'étape Comptes réutilise le formulaire de compte et édite le solde d'ouverture et le découvert.

Alternative écartée : réécrire des formulaires spécifiques au wizard. Cela violerait DRY et ferait diverger les règles de validation.

### D8. Récapitulatif : même calcul que le budget, plus les revenus

- Charges = `computeMonthlyBudget(charges, payments, month)`.
- Revenus = transactions positives du mois, hors transferts (`transferId === null`), converties dans la devise d'affichage.
- Reste à vivre = revenus − `total`.

`computeMonthlyBudget` reçoit un convertisseur optionnel `(amount, currency) => number` pour consolider CHF et EUR ; sans convertisseur, comportement actuel inchangé (tests existants préservés). Un helper partagé unique calcule les revenus du mois, utilisé par le récapitulatif et réutilisable par le dashboard.

Alternative écartée : additionner les montants natifs. Faux dès qu'une charge EUR et un revenu CHF coexistent.

### D9. Contrats HTTP

| Route | Usage |
|---|---|
| `GET /api/incomes?month=2026-11` | Sources actives pour le mois + confirmation existante |
| `POST /api/incomes`, `PATCH/DELETE /api/incomes/{id}` | CRUD des sources |
| `POST /api/incomes/{id}/confirm` | Upsert du revenu mensuel (`{ month, amount, date? }`) |
| `GET /api/monthly-budgets/{month}` | État préparé ou absent |
| `PUT /api/monthly-budgets/{month}` | Marquer préparé (idempotent) |

Les schémas Zod vivent dans `packages/shared/src/schemas/` : `income.ts`, `monthly-budget.ts`, extension de `transaction.ts` en lecture pour `incomeId` et `budgetMonth`.

### D10. Vocabulaire et affordance

Le libellé visible est **« Préparer le mois »**, la carte **« Budget de novembre — à préparer »**, l'action de réouverture **« Modifier »**. Aucun terme technique (wizard, onboarding, étape de flux). Les entrées sont ajoutées à `docs/LEXIQUE.md`. Chaque étape garde une action principale unique en bas et un retour explicite dans le chrome de sous-vue.

## Risks / Trade-offs

- **Contrainte d'unicité sur colonnes nullables** → SQLite accepte plusieurs `NULL`, mais Prisma doit générer l'index correctement. Mitigation : vérifier la migration SQL, test d'intégration « deux confirmations = une transaction », et test « transactions ordinaires multiples sans `incomeId` ».
- **Édition d'une charge dans le wizard régénère des échéances** → risque de toucher l'historique. Mitigation : le service existant ne remplace que les `PENDING` non rapprochées ; test de non-régression sur les échéances `PAID`.
- **Devise mixte dans le récapitulatif** → un total faux si la conversion est oubliée. Mitigation : convertisseur obligatoire injecté par l'UI, helper partagé, tests CHF/EUR.
- **Clé mensuelle et fuseaux horaires** → `2026-11` calculé localement peut glisser en UTC. Mitigation : construire les dates à midi (`T12:00:00`) comme `monthLabel`, valider que la transaction confirmée appartient au mois.
- **Parcours long et mobile** → quatre étapes sur 390 px. Mitigation : une action principale par étape, listes paginées `ShowMoreList`, pas de modale bloquante, squelette au chargement.
- **Suppression d'une source de revenu** → perte de rattachement. Mitigation : `onDelete: SetNull`, test « trois mois confirmés conservés après suppression ».

## Migration Plan

1. Migration Prisma additive : tables `incomes` et `monthly_budgets`, colonnes nullables `incomeId` et `budgetMonth` sur `transactions`, index et clés étrangères.
2. Aucun backfill : les transactions existantes restent sans rattachement, aucun mois n'est marqué préparé.
3. Seed de démonstration : une source « Salaire » et les revenus des mois déjà seedés, plus `MonthlyBudget` du mois courant pour vérifier les deux états d'invitation.
4. Rollback : supprimer les deux tables et les deux colonnes ; les transactions restent intactes puisque les colonnes sont nullables et sans dépendance métier existante.
5. Déploiement : migration puis application ; l'invitation apparaît sur le mois courant tant que « Terminer » n'a pas été utilisé.
