# Design

## Context

Le wizard de préparation mensuel (`/budget/[mois]`) utilise les patterns FP créés lors de la refactorisation précédente : `ItemList`, `EditableItem`, `CreatePanel`, `StepLayout`. Cependant, l'implémentation est incomplète :

1. **EditableItem** retourne un fragment `<>...</>` qui casse le layout flex de `ItemList` (rowClassName="flex items-center justify-between")
2. **IncomesStep** n'expose que la confirmation mensuelle, pas le CRUD des sources
3. **AccountsStep** est en lecture seule, pas de création/modification/suppression
4. **ChargesStep** a des problèmes de layout (boutons qui débordent)

Les composants de formulaire existent déjà : `ChargeCreateForm` (avec prop `onSaved`), `AccountCreateForm` (sans prop `onSaved` actuellement). Le pattern "double mode" (page dédiée vs inline) est déjà établi pour `ChargeCreateForm`.

## Goals / Non-Goals

**Goals:**

- Corriger le bug UI de `EditableItem` (fragment → éléments directs)
- Compléter le CRUD des sources de revenu dans `IncomesStep` (créer, modifier, supprimer)
- Compléter le CRUD des comptes dans `AccountsStep` (créer, modifier, supprimer)
- Améliorer le layout de `ChargesStep` pour mobile (390px)
- Renforcer les règles agents pour prévenir ce genre de problème (FP, composition, réutilisabilité)

**Non-Goals:**

- Refondre l'architecture du wizard (la structure 4 étapes reste)
- Modifier les API endpoints (ils existent déjà)
- Créer de nouveaux patterns FP (réutiliser `ItemList`, `EditableItem`, `CreatePanel`)
- Changer le comportement de `ChargeCreateForm` (déjà correct)

## Decisions

### D1. Fix EditableItem : supprimer le fragment

**Décision** : Retourner les éléments directement sans fragment `<>...</>`.

**Rationale** : `ItemList` wrap chaque item avec `rowClassName="flex items-center justify-between"`. Le fragment casse ce layout car les deux `<div>` internes ne sont pas en flex row. En retournant les éléments directement, ils héritent du flex layout du parent.

**Alternative écartée** : Wrapper dans un `<div className="flex w-full">` — ajouterait un niveau de DOM inutile.

### D2. IncomeSourceForm : mirroir de ChargeCreateForm

**Décision** : Créer `IncomeSourceForm` dans `components/incomes/` avec le même pattern que `ChargeCreateForm` :
- `useForm` + `zodResolver(createIncomeSchema)`
- Prop `onSaved?: (income: Income) => void` pour mode inline
- Double mode : si `onSaved` fourni → callback + pas de redirect, sinon → `FormSuccess` + redirect

**Rationale** : Réutiliser le pattern éprouvé de `ChargeCreateForm`. Le schéma `createIncomeSchema` existe déjà dans `packages/shared/src/schemas/income.ts`.

**Champs** : label, amount, currency (CHF/EUR), accountId (select), frequency (monthly/yearly), startDate, endDate (optionnel).

### D3. IncomesStep : CRUD complet avec CreatePanel

**Décision** : Ajouter dans `IncomesStep` :
- `CreatePanel` avec `IncomeSourceForm` pour la création
- Boutons "Modifier" et "Supprimer" sur chaque ligne (via `EditableItem` prop `actions`)
- `IncomeRow` adapter (comme `ChargeRow`) qui wrap `EditableItem` avec les mutations

**Rationale** : Réutiliser le pattern de `ChargesStep` (qui a déjà `ChargeRow` + `CreatePanel`). La composition est déjà éprouvée.

### D4. AccountsStep : CRUD complet avec AccountCreateForm

**Décision** :
1. Ajouter prop `onSaved?: (account: Account) => void` à `AccountCreateForm` (comme `ChargeCreateForm`)
2. Ajouter `CreatePanel` avec `AccountCreateForm` dans `AccountsStep`
3. Ajouter `AccountRow` adapter avec boutons "Modifier" et "Supprimer"

**Rationale** : `AccountCreateForm` existe déjà, il suffit d'ajouter le double mode. Le pattern est identique à `ChargeCreateForm`.

### D5. Layout mobile : responsive flex

**Décision** : Pour `EditableItem` et les rows, utiliser :
- `flex flex-col sm:flex-row` pour stack sur mobile, row sur desktop
- `gap-2` pour espacement
- `w-full sm:w-auto` pour les boutons

**Rationale** : Mobile-first, 390px est la cible. Les boutons ne doivent pas déborder.

**Alternative écartée** : Media queries CSS — moins maintenable que les classes Tailwind responsive.

### D6. Renforcer les règles agents

**Décision** : Ajouter dans `AGENTS.md`, `.kilo/agents/coder.md`, `.kilo/agents/advisor.md` une section "Philosophie de Codage" avec :
- **FP** : pure functions first, server state first (TanStack Query), éviter useState/useEffect/Context
- **Composition** : vérifier l'existant avant de créer, réutiliser patterns (`ItemList`, `EditableItem`, etc.)
- **Minimalisme** : YAGNI strict, KISS, DRY, fonctions < 30 lignes
- **Craftsmanship** : code lisible, pas de magie, tests obligatoires

**Rationale** : Les règles actuelles ne强制ent pas assez ces principes. L'implémentation du wizard a montré que sans règles strictes, les agents produisent du code inline dupliqué.

## Risks / Trade-offs

- **[Risk] `AccountCreateForm` est plus complexe que `ChargeCreateForm`** (carte de crédit avec `linkedAccountId`) → **Mitigation** : Le formulaire existe déjà, il suffit d'ajouter la prop `onSaved`. La logique est déjà testée.

- **[Risk] Les tests existants peuvent casser si on change la signature de `AccountCreateForm`** → **Mitigation** : La prop `onSaved` est optionnelle, le comportement par défaut reste inchangé. Les tests existants doivent passer sans modification.

- **[Risk] Le layout responsive peut casser sur d'autres tailles d'écran** → **Mitigation** : Tester sur 390px (mobile), 768px (tablet), 1024px (desktop). Utiliser les classes Tailwind responsive (`sm:`, `md:`).

- **[Trade-off] Ajouter des boutons "Modifier"/"Supprimer" sur chaque ligne augmente la complexité UI** → **Acceptable** car c'est ce que la spec exige (CRUD complet) et le pattern existe déjà dans `ChargesStep`.
