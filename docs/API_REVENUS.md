# API Revenus — Contrat

## Vue d'ensemble

API REST pour la gestion des sources de revenu récurrentes et leur confirmation mensuelle.

## Endpoints

### GET /api/incomes

Liste les sources de revenu avec filtres optionnels.

**Query Parameters:**
- `month` (optional): Clé mensuelle au format "YYYY-MM" pour filtrer les revenus dus
- `active` (optional): "true" ou "false" pour filtrer par statut
- `accountId` (optional): ID de compte pour filtrer
- `limit` (optional): Nombre max de résultats (défaut: 100, max: 500)

**Réponse 200:**
```json
{
  "data": [
    {
      "id": "income-1",
      "label": "Salaire",
      "amount": 4400,
      "currency": "CHF",
      "accountId": "account-ubs-courant",
      "memberId": null,
      "frequency": "monthly",
      "startDate": "2026-01-01T12:00:00.000Z",
      "endDate": null,
      "active": true,
      "createdAt": "2026-01-01T12:00:00.000Z",
      "updatedAt": "2026-01-01T12:00:00.000Z"
    }
  ]
}
```

### POST /api/incomes

Crée une nouvelle source de revenu.

**Body:**
```json
{
  "label": "Salaire",
  "amount": 4400,
  "currency": "CHF",
  "accountId": "account-ubs-courant",
  "memberId": null,
  "frequency": "monthly",
  "startDate": "2026-01-01T12:00:00.000Z",
  "endDate": null,
  "active": true
}
```

**Réponse 201:** Objet Income créé

**Erreurs:**
- 422: Compte inexistant ou dates invalides

### PATCH /api/incomes/{id}

Met à jour une source de revenu.

**Body:** Objet partiel avec les champs à modifier

**Réponse 200:** Objet Income mis à jour

**Erreurs:**
- 404: Source introuvable
- 422: Dates invalides

### DELETE /api/incomes/{id}

Supprime une source de revenu. Les transactions associées sont conservées avec `incomeId` remis à `null`.

**Réponse 204:** No Content

**Erreurs:**
- 404: Source introuvable

### POST /api/incomes/{id}/confirm

Confirme le revenu d'un mois (upsert idempotent).

**Body:**
```json
{
  "month": "2026-11",
  "amount": 4400,
  "date": "2026-11-01T12:00:00.000Z"
}
```

**Réponse 200:** Transaction créée ou mise à jour

**Erreurs:**
- 404: Source introuvable
- 422: Source inactive ou date hors du mois

**Note:** Cet endpoint est idempotent. Un appel multiple pour le même mois met à jour la transaction existante au lieu d'en créer une nouvelle.

## GET /api/monthly-budgets/{month}

Retourne l'état de préparation d'un mois.

**Réponse 200:**
```json
{
  "data": {
    "month": "2026-11",
    "preparedAt": "2026-11-01T12:00:00.000Z",
    "createdAt": "2026-11-01T12:00:00.000Z",
    "updatedAt": "2026-11-01T12:00:00.000Z"
  }
}
```

Si le mois n'a jamais été préparé, retourne `{ "data": null }` (pas 404).

## PUT /api/monthly-budgets/{month}

Marque un mois comme préparé (upsert idempotent).

**Réponse 200:** Objet MonthlyBudget créé ou mis à jour

## Types partagés

```typescript
// packages/shared/src/schemas/income.ts
export type Income = {
  id: string;
  label: string;
  amount: number;
  currency: 'CHF' | 'EUR';
  accountId: string;
  memberId: string | null;
  frequency: 'monthly' | 'yearly';
  startDate: string;
  endDate: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

// packages/shared/src/schemas/monthly-budget.ts
export type MonthlyBudget = {
  month: string; // "YYYY-MM"
  preparedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
```

## Exemples d'utilisation

### Confirmer un salaire mensuel

```bash
POST /api/incomes/income-salaire/confirm
Content-Type: application/json

{
  "month": "2026-11",
  "amount": 4400
}
```

### Préparer un mois

```bash
PUT /api/monthly-budgets/2026-11
Content-Type: application/json

{}
```

## Notes importantes

1. **Chemin d'écriture exclusif**: Les champs `incomeId` et `budgetMonth` sur les transactions sont écrits uniquement par l'endpoint `/confirm`.

2. **Upsert idempotent**: L'endpoint `/confirm` utilise `prisma.transaction.upsert` sur la clé composée `(incomeId, budgetMonth)`.

3. **Date à midi**: Les dates sont stockées à midi (`${month}-01T12:00:00`) pour éviter les problèmes de fuseau horaire.

4. **GET mensuel**: `GET /api/monthly-budgets/{month}` retourne 200 avec `{ data: null }` si le mois n'existe pas, pas 404.

5. **POST confirm**: Retourne 200 (pas 201) car c'est un upsert idempotent.
