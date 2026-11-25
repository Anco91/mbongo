---
id: 45-import-screen
status: ready
branch: spec/45-import-screen
tier: medium
locked_at:
locked_tests: []
---

# 45 — Import bancaire BNP : écran `/import`

Master: `specs/SPEC_MASTER.md` row 45 · Needs: 36 · Plan: `docs/plans/20261125-budget-projection-import.md` § Sous-spec 36 · Rules: WF-3, TEST-1..3, FE-1..9

## Summary

- Pourquoi : lire ses dépenses du mois passé (catégories, commerçants) et ancrer le solde d'un compte sur le relevé BNP, sans rien saisir à la main.
- Ce qui change : un écran `/import` (entrée dans la barre d'onglets). L'utilisateur dépose son CSV, il est lu dans le navigateur (rien n'est envoyé ni journalisé). Il choisit un mois, voit les dépenses par catégorie et par commerçant, associe chaque commerçant à une catégorie (mémorisé dans le navigateur) et peut enregistrer le solde du bandeau comme relevé d'un compte, avec l'écart affiché.
- Changement de comportement visible : oui, nouvelle capability `bank-import`.

## Kickoff

- Product : plus petite tranche utile = lecture locale + analyse + correspondance + ancrage. Hors périmètre : transactions écrites, rapprochement automatique, virements créés (D9), dédoublonnage persisté, charges fixes vs variables. Débloque : rien de bloquant.
- Architect : `analyzeSpending`, `parseBnpCsv`, `computeStatementGap`, `CHARGE_CATEGORIES`, snapshot schema/repository/query existants ; store `useSyncExternalStore` modelé sur `lib/alerts-read-store.ts` ; helpers purs dans un fichier de domaine séparé. Risque : lire des données sensibles, ne jamais les journaliser ni les envoyer.
- Skeptic : un montant illisible lève une erreur (afficher son message, sans le libellé) ; localStorage indisponible ou JSON corrompu → table vide, jamais de crash ; un mois sans dépense ; un snapshot enregistré deux fois pour le même jour (autorisé, `computeStatementGap` prend le dernier créé).

## Decisions (PM)

- Mapping persisté dans `localStorage` clé `mbongo.merchantCategories` (pas de migration, par appareil). Catégorie vide ou `UNCATEGORIZED` = suppression de l'entrée.
- Lecture : `FileReader.readAsText(file, 'windows-1252')` (export ASCII, sûr pour accents).
- Compte du relevé : choisi par l'utilisateur dans une liste des comptes non clôturés (le CSV ne porte que `****2319`), jamais deviné.
- Écart (`computeStatementGap`) affiché après l'enregistrement, avec le solde calculé du compte (transactions du compte) ; null = non affiché.
- Tests : seulement les helpers purs (TEST-1..3), pas de test d'UI. Écrits par l'Executor (`pending-review`), relus par le Reviewer ; pas de verrou (aucune écriture de l'Advisor, pas de `locked_tests`).

## Acceptance criteria

1. Déposer le CSV réel affiche le mois le plus récent avec dépenses ; le sélecteur liste les mois ayant des dépenses, du plus récent au plus ancien.
2. Dépenses du mois par catégorie puis par commerçant (`analyzeSpending`) ; `À catégoriser` tant qu'aucune correspondance.
3. Choisir une catégorie (`CHARGE_CATEGORIES`) pour un commerçant la mémorise ; recharger la page conserve le choix ; choisir « À catégoriser » l'efface.
4. « Enregistrer le solde du relevé » : choix du compte, crée un `BalanceSnapshot` (date et solde du bandeau), puis affiche l'écart de relevé du compte.
5. Aucun appel réseau avec le contenu du fichier hors la création du snapshot ; aucun `console.*` du contenu ; aucune transaction ni virement écrits.
6. Fichier invalide : message d'erreur (n° de ligne), l'écran reste utilisable.
7. Typecheck, lint, suite complète, `arch-check.sh` verts.

## Frame

### Create

| Path | Role | Exports (signatures) |
|---|---|---|
| `packages/shared/src/domain/bank-import-view.ts` | pure helpers | `listStatementMonths(rows: ImportedRow[]): string[]` (YYYY-MM with ≥ 1 debit by `date`, desc) ; `parseMerchantMapping(raw: string \| null): Record<string,string>` (invalid JSON/non-object/non-string values → `{}` / dropped) ; `serializeMerchantMapping(m): string` ; `setMerchantCategory(m, merchant, category): Record<string,string>` (immutable; `''`/`UNCATEGORIZED` removes) ; `buildStatementSnapshot(statement: BankStatement, accountId: string): CreateSnapshotInput` (date = `balanceDate`, balance, note `Relevé BNP <accountSuffix>`) |
| `apps/web/__tests__/bank-import-view.test.ts` | tests of the helpers | pending-review |
| `apps/web/src/lib/merchant-mapping-store.ts` | external store | `subscribe`, `getSnapshot`, `getServerSnapshot`, `setCategory(merchant, category)`, key `MERCHANT_MAPPING_KEY`; same shape as `lib/alerts-read-store.ts`, uses the helpers |
| `apps/web/src/app/import/{page,loading,error}.tsx` | route | page renders `ImportView` ; loading/error as `app/incomes/unmatched/` |
| `apps/web/src/components/import/import-view.tsx` | View | `ImportView` |
| `apps/web/src/components/import/import-guard.tsx` | Guard | `ImportGuard` prefetching accounts through `PrefetchGuard` (same entries as the accounts guard) |
| `apps/web/src/components/import/import-content.tsx` | Content | file drop, month select, analysis, snapshot panel |
| `apps/web/src/components/import/merchant-category-row.tsx` | row | merchant, count, total, category `SelectInput` bound to the store |
| `apps/web/src/components/import/statement-snapshot-panel.tsx` | panel | account select + « Enregistrer le solde du relevé » + gap |

### Modify

| Path | Change |
|---|---|
| `packages/shared/src/index.ts` | export `bank-import-view` |
| `apps/web/src/hooks/use-snapshots.ts` | + `useCreateSnapshot()` mutation (repository `create`, invalidate `snapshotQueries.all()`) |
| `apps/web/src/components/patterns/tab-nav.tsx` | fifth tab « Import » → `/import` |
| `apps/web/src/components/ui/icons.tsx` | icon for the tab only if no existing one fits |
| `apps/web/src/lib/routes.ts` | `'/import': 'Import du relevé'` in `MAIN_ROUTES` |
| `ARCHITECTURE.md` | registry rows: `bank-import-view.ts`, `merchant-mapping-store.ts`, `components/import/` |
| `specs/SPEC_MASTER.md` | row 45 |
| `specs/current/bank-import/spec.md` | **Advisor only**, SPEC-2/3, Executor never edits |

### Read (allow-list)

`ARCHITECTURE.md`, `packages/shared/src/domain/bank-import.ts`, `packages/shared/src/domain/balance.ts`, `packages/shared/src/domain/charge-category.ts`, `packages/shared/src/schemas/snapshot.ts`, `apps/web/src/lib/alerts-read-store.ts`, `apps/web/src/hooks/{use-snapshots,use-accounts,use-transactions}.ts`, `apps/web/src/queries/{snapshots,accounts,transactions}.ts`, `apps/web/src/components/incomes/unmatched-income-{view,guard,content}.tsx`, `apps/web/src/app/incomes/unmatched/*`, `apps/web/src/components/accounts/*guard*.tsx`, `apps/web/src/components/form/select-input.tsx`, `apps/web/src/components/patterns/{async-state,tab-nav}.tsx`, `apps/web/src/components/ui/{button,card}.tsx`.

### Reuse (registry)

`parseBnpCsv`, `analyzeSpending`, `UNCATEGORIZED`, `computeStatementGap`, `CHARGE_CATEGORIES`, `snapshotsRepository`/`snapshotQueries`, `useSnapshots`, accounts and transactions hooks, `PrefetchGuard`, `SelectInput`, `AsyncState` patterns, `formatCurrency` from `lib/format.ts`.

### Style exemplars

`lib/alerts-read-store.ts` (store), `components/incomes/unmatched-income-*.tsx` (View/Guard/Content), `domain/charge-category.ts` (pure domain).

### Libraries

`useSyncExternalStore` (React), TanStack Query (snapshot mutation, no new dependency).

### Forbidden

Any file not listed. Prisma/server code, migration, new dependency, `useEffect` except external sync, `console.*` of file content, uploading the file, writing transactions/transfers, UI tests, `npm run build` (dev server running).

## Tests

### Proposed by the Executor (pending-review)

| Path | What it covers | Status |
|---|---|---|
| `apps/web/__tests__/bank-import-view.test.ts` | the five helpers: months order/filter, mapping parse (corrupt, wrong types), set/remove immutable, snapshot body valid against `createSnapshotSchema` | pending-review |

## Handoffs

(aucun)
