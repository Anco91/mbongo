---
id: 36-bank-import-core
status: ready
branch: spec/36-bank-import-core
tier: medium
locked_at: 6f07930f7c28e3835e626935aa39c235a19b14ad
locked_tests:
  - apps/web/__tests__/bank-import.test.ts
---

# 36 — Import bancaire BNP : noyau pur (parse, empreinte, analyse du mois)

Master: `specs/SPEC_MASTER.md` · Needs: 35, 37 · Plan: `docs/plans/20261125-budget-projection-import.md` § Sous-spec 36 · Rules: WF-3, TEST-1..5

## Summary

- Pourquoi : l'utilisateur veut comprendre ses dépenses du mois passé (catégories, commerçants) et ancrer le solde du compte à partir de son relevé BNP.
- Ce qui change : des fonctions pures lisent le CSV BNP (déjà décodé), calculent une empreinte par ligne pour ne jamais importer deux fois, et analysent un mois (par catégorie et commerçant). Aucun écran, aucune écriture : l'écran de dépôt, l'ancrage `BalanceSnapshot` et la table de correspondance persistée sont la ligne 45.
- Changement de comportement visible : non (noyau sans UI). `no behaviour change`.

## Decisions (PM)

- Découpe : 36 = noyau pur testable ; 45 = écran de dépôt local, aperçu validé, `BalanceSnapshot`, correspondance commerçant → catégorie persistée.
- Format (relevé sur `exports-xls/E3292319 (1).csv`) : `;`, `dd/MM/yyyy`, montant français (`-1 300,00`), débit négatif, banner en ligne 1 (`…;****2319;24/11/2026;;296,60`), pas d'en-tête de colonnes, texte ASCII déjà décodé par l'appelant.
- Date réelle d'un achat carte = `DU ddmmyy` du libellé (`date`) ; le jour de prélèvement reste `bookedDate`. L'analyse d'un mois utilise `date`.
- Empreinte = compte (suffixe) + `bookedDate` + montant en centimes + libellé normalisé (espaces compactés) + rang d'occurrence des lignes identiques dans le fichier. Stable si le fichier gagne des lignes ailleurs.
- Marchand : carte = texte après `DU ddmmyy ` jusqu'au bloc `CARTE` ; prélèvement SEPA = texte entre `PRLV SEPA ` et ` ECH/` ; sinon null (repli sur `bankType` dans l'analyse). Catégorie : seulement la table passée en argument ; sinon `UNCATEGORIZED`, jamais devinée.
- Bibliothèque CSV : `papaparse` dans `packages/shared` (+ `@types/papaparse`), `delimiter: ';'`. Dépendance nouvelle : porte GIT-7 levée par le PM (objectif utilisateur), enregistrée dans `ARCHITECTURE.md` Libraries.
- Confidentialité : les libellés ne sont jamais journalisés ; erreurs sans contenu de ligne, seulement `line N`.

## Acceptance criteria

1. `apps/web/__tests__/bank-import.test.ts` passe (verrouillé, 23 tests).
2. `parseBnpCsv` refuse un fichier sans banner et une ligne au montant illisible (`Error` dont le message contient `line N`, N = numéro de ligne du fichier, banner = 1).
3. Rien n'est lu sur disque ni écrit : fonctions pures sur du texte.
4. Typecheck, lint, suite complète, `arch-check.sh` verts.

## Frame

### Create

Aucun fichier : `packages/shared/src/domain/bank-import.ts` existe (stub verrouillé, exporté par le barrel). Remplacer les corps ; garder types et `UNCATEGORIZED`.

### Modify

| Path | Change |
|---|---|
| `packages/shared/src/domain/bank-import.ts` | Implémenter `parseBnpCsv`, `extractMerchant`, `dedupeRows`, `analyzeSpending` (signatures et types déjà dans le stub). Montants arrondis au centime. Tri : catégories et marchands par total décroissant. |
| `packages/shared/package.json` | + `papaparse`, `@types/papaparse` (dev). |
| `ARCHITECTURE.md` | Registre : `domain/bank-import.ts`. Libraries : papaparse (CSV bancaire). |

### Read / Reuse / Forbidden

- Read : `ARCHITECTURE.md`, `bank-import.ts`, `apps/web/__tests__/bank-import.test.ts`, `packages/shared/src/domain/balance.ts` (cent-rounding), `.agents-fw/standards/typescript.md`.
- Reuse : date-fns pour dates (`parse`, `format`) ; `round`/`roundCents` existant du domaine balance si exporté.
- Forbidden : toucher au test verrouillé ; fichier, réseau, Prisma ; `console.log` d'un libellé ; écran ou route (ligne 45) ; deviner une catégorie ou un virement (D9) ; `npm run build` pendant que le dev server tourne.

## Proof of failure

`npx jest __tests__/bank-import.test.ts` (apps/web) : 22 rouges (`not implemented`), 1 vert (refus d'un fichier sans banner qui lève déjà).

## Handoffs

(aucun)
