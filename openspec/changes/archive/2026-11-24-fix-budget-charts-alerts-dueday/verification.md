# Verification — fix-budget-charts-alerts-dueday

Preuves accumulées pendant l'application du change (schema `spec-driven`).
Chaque entrée : exigence → commande → résultat observé.

## 5.4 — Onboarding d'un mois avec charges → Sankey/donut non vides avant tout paiement

**Exigence** (spec delta `dashboard`) : un mois préparé avec des échéances à
venir et aucune dépense réalisée affiche la jambe « prévu » dans le Sankey et
des catégories dans le donut, avec un total au centre non nul.

**Preuves automatisées** (le parcours onboarding est couvert au niveau des
calculs et du dashboard assemblé, avec des échéances `PENDING` seules) :

- `npx jest --runTestsByPath __tests__/m3-calculations.test.ts` → 21/21 ✓
  - `donut: a prepared month without any payment is not empty (PENDING only)`
    → 1 segment, `planned: true`, valeur 1850
  - `sankey: a prepared month without any payment shows the account → charge leg`
    → 1 lien `planned: true` `UBS CHF → Logement`
  - `donut: an empty month still yields an empty state` → `[]`
- `npx jest --runTestsByPath __tests__/dashboard-content.test.tsx` → 7/7 ✓
  - `feeds the charts with the windowed payments of the chosen month` →
    une seule échéance `PENDING` du mois (fenêtre `dueDate`) → donut non vide
    (pas d'état « Aucune dépense catégorisée »), total du mois 1 720,50 €,
    échéance « Loyer GE » listée
  - `issues a new windowed query when the month changes` → le hook reçoit
    la nouvelle clé de mois

**Interprétation** : avec une charge créée pendant l'onboarding (échéance
`PENDING` du mois) et zéro paiement, les deux charts s'affichent avec la part
prévue distincte — l'état vide ne concerne que les mois sans échéance ni
transaction.

## 6.1 — Qualité (lint, format, typecheck, tests, coverage)

**Statut : COMPLET (périmètre du change).** Cibles « nouvelles fonctions
pures 100 % branches » et « domaine touché ≥ 90 % » atteintes. La cible
« web global ≥ 80 % » a été retirée de la tâche 6.1 sur décision de
l'utilisateur (écart préexistant hors code touché, voir plus bas).

`npm run quality` (lint → format:check → typecheck → test) : **vert** après
corrections ci-dessous.

Corrections nécessaires pour passer le gate :

- `lint` : 3 erreurs prettier/`no-inferrable-types` dans `packages/shared`
  (`schedule.ts`, `donut.ts`, `sankey.ts`) et 51 dans `apps/web` (tests et
  sources du change) → `eslint --fix` + 4 corrections manuelles
  (`todayKey` inutilisé, 3 casts de mocks Jest typés).
- `typecheck` : `dueDay: null` ajouté aux fixtures `Charge`
  (`m3-calculations`, `m5-filters`, `schedule.missing-payments`) ; spread
  `...link` réordonné dans `sankey-flows-chart.test.tsx` (source/target
  écrasés) ; `charge?.type` / `charge?.frequency` dans `charge-edit-form.tsx`
  (accès avant la garde `!charge`) ; `AlertsReadState.readIds` typé
  `ReadonlySet<string>` (aligné sur le store) ; lecture de `planned` typée
  sur le payload du lien Sankey.

Résultat final : **72 suites, 565 tests verts**.

Coverage (`npm run test:coverage`, jest `coverageThreshold` global 80 %) :

| Mesure     | Obtenu | Cible |
|------------|--------|-------|
| Statements | 75,5 % | 80 %  |
| Branches   | 65,91 %| 80 %  |
| Functions  | 58,14 %| 80 %  |
| Lines      | 75,71 %| 80 %  |

→ **Cible « web global ≥ 80 % » non atteinte.** Le déficit provient de
fichiers non touchés par ce change à 0 % (pages `loading`/`error`, routes
API, `charges-step`, `schedule-*`, contrôleurs). Fichiers du change :
`alerts-read-store.ts` 97,9 % / 100 % branches, `month-queries.ts` 100 %,
`charges.ts` 100 %, `recap-step.tsx` 100 % lignes (43,75 % branches),
`charge.service.ts` 98,8 %, `use-alerts.ts` 100 % lignes.

**Cibles du domaine partagé (`packages/shared`)** — mesurées avec une config
jest temporaire (`collectCoverageFrom` sur les 4 fichiers touchés, hors du
périmètre `src/**` de la config web) :

| Fichier (fichier entier)                  | Stmts   | Branches | Funcs | Lines |
|-------------------------------------------|---------|----------|-------|-------|
| `domain/schedule.ts`                      | 92 %    | 69,7 %   | 100 % | 92,2 %|
| `lib/calculation/donut.ts`                | 93 %    | 73,5 %   | 100 % | 100 % |
| `lib/calculation/sankey.ts`               | 96,7 %  | 83,9 %   | 100 % | 100 % |
| `schemas/charge.ts`                       | 100 %   | 100 %    | 100 % | 100 % |

- **Domaine touché ≥ 90 %** : atteint (stmts ≥ 92 % sur les 4 fichiers).
  `sankey.ts` (83 → 96,7 %) et `charge.ts` (87 → 100 %) ont été remontés par
  de nouveaux tests sur d'anciens chemins (dépenses depuis transactions,
  champs requis par type de charge) : `m3-calculations.test.ts` (5 tests),
  `m2-schemas.test.ts` (4 tests).
- **Nouvelles fonctions pures 100 % branches** : atteint. Les branches non
  couvertes restantes (rapport par branche, lignes `schedule.ts` 86-88/101/112/417,
  `donut.ts` 63/81/96/108-113, `sankey.ts` 116/120/145-170) sont toutes dans du
  code antérieur au change ; `resolveDueDay`, `generateMonthlyPayments`, le
  `superRefine` de `dueDay`, la logique `planned` (Sankey/donut),
  `parseReadIds`/`serializeReadIds` et `month-queries` n'ont aucune branche
  non couverte.

**Reste ouvert — « web global ≥ 80 % »** : 75,5 % / 65,91 % / 58,14 % / 75,71 %
(inchangé par les tests ci-dessus : le dénominateur web n'inclut pas
`packages/shared`). Combler l'écart exigerait ~201 fonctions couvertes en
plus sur 121 fichiers non touchés par ce change (hooks, services,
contrôleurs, guards). `npm run quality` ne lance pas la coverage
(`test`, pas `test:coverage`) ; seul `npm run test:coverage` échoue sur le
seuil global.

## 6.2 — Parcours complet

**Statut : COMPLET — les 5 étapes observées dans le navigateur.**

**Environnement** : `npm run dev` (Next.js 15.5.29) sur `http://localhost:3000`,
base SQLite locale (`file:./dev.db`), migration `dueDay` appliquée
(`prisma migrate status` → « Database schema is up to date »), date du
jour 2026-11-24, navigateur Chrome piloté via l'extension Claude. Charge de
test créée : « TEST 6.2 Loyer » (FIXED_RECURRING, mensuelle, 1000 CHF, compte
« Grady - YUH »), id `53cee78d-fd7f-4a58-8044-02ad6f2df04e`.

### 1. Préparation du mois — sélecteur « Jour de prélèvement »

**Exigence** (delta `charge-management`) : le formulaire de création affiche
un sélecteur « Jour de prélèvement » pour une charge fixe mensuelle, défaut 1.

- Action : `/budget/2026-11` → étape 2 « Charges » → « Ajouter une charge »,
  type « Fixe récurrente », périodicité « Mensuelle ».
- Résultat : le champ « Jour de prélèvement » est visible, valeur par défaut
  **1** (options 1 à 31) ; sélection de **5**, puis « Créer la charge » →
  la ligne « TEST 6.2 Loyer 1000.00 CHF — Logement » apparaît dans l'étape.

### 2. Récapitulatif > 0 avec les vraies sources

**Exigence** (delta `monthly-budget`) : le recap n'affiche plus 0 et
décompose échéances et provisions.

- Action : étapes 3 puis 4 « Récapitulatif » (aucune modification des comptes).
- Résultat (texte de page) : « Revenus 4789.90 EUR », « Échéances (hors
  provisions) 1088.61 EUR », « Provisions 0.00 EUR », « Charges 1088.61 EUR »,
  « Reste à vivre 3701.29 EUR ». Total charges > 0 et tuiles de décomposition
  présentes. « Terminer » non cliqué (mois déjà préparé le 24/11/2026).
- Contrôle de cohérence (1088.61 EUR ≠ 3 521.11 € du donut) :
  `GET /api/payments?dueDate[gte]=2026-11-01…&dueDate[lte]=2026-11-30…` →
  **1** échéance sur toute la base (« TEST 6.2 Loyer », `PENDING`, 1000 CHF
  ≈ 1088.6 EUR au taux affiché). Les 14 charges existantes ont
  `startDate 2026-11-22` et `dueDay` null (legacy) : leur première échéance
  est le 2026-12-22 (60 échéances jusqu'en 2031-11, aucune en novembre).
  Le recap (échéances du mois + provisions, 0 provision) est donc conforme
  à la spec ; le donut inclut en plus les transactions réalisées du mois.
  Le saut du mois de création pour les charges legacy est le comportement
  préservé par design (non-goal : pas de rétro-migration), pas un défaut
  de ce change.

### 3. Charts : prévu visible et distinct

**Exigence** (delta `dashboard`) : donut et Sankey non vides avec l'échéance
`PENDING` ; le prévu se distingue visuellement.

- Action : `/` (mois Nov. 2026), inspection du DOM.
- Résultat : donut « nov. 2026 · 3 521.11 € » (total non nul), 4 segments
  dont un à `fill-opacity` **0.45** (les autres à 1) ; Sankey 7 liens dont
  un à `stroke-opacity` **0.3** avec `stroke-dasharray` **« 6 4 »** (les
  autres pleins à 0.5). Liste « Échéances du mois » : « TEST 6.2 Loyer —
  5 nov. 2026 — 1 000.00 CHF — Dû ».

### 4. Échéance au jour choisi (5)

**Exigence** (delta `charge-management`) : les échéances tombent au jour
choisi, le mois d'ancrage est toujours généré.

- Action : `GET /api/payments?chargeId[eq]=53cee78d-…&limit=500`
  (la syntaxe `chargeId=<id>` simple renvoie 400 : le filtre est un objet).
- Résultat : HTTP 200, **61** échéances `PENDING` à 1000 ;
  `2026-11-05T00:00:00.000Z`, `2026-12-05T00:00:00.000Z`,
  `2027-01-05T00:00:00.000Z`, `2027-02-05T00:00:00.000Z`, … Le mois d'ancrage
  (5 nov., passé au 24/11) est bien généré. `GET /api/charges` →
  `dueDay: 5`. L'écran affiche « 5 nov. 2026 » (pas de décalage de jour
  observé en UTC+1).

### 5. Badge alertes effacé sans rechargement

**Exigence** (delta `alerts`) : header et vue alertes partagent l'état lu.

- Avant : sur `/`, lien de la cloche `aria-label` « Alertes (2 non lues) »,
  pastille « 2 ». Marqueur `window.__navMarker = 'no-reload-6.2'` posé,
  journal réseau vidé.
- Action : clic sur la cloche (navigation client vers `/alerts`).
- Après : URL `/alerts`, marqueur **toujours présent** (pas de rechargement
  de document), `aria-label` « Alertes » sans pastille. Réseau : seule
  requête de navigation `GET /alerts?_rsc=…` (pas de requête document).
  La vue liste 3 alertes, dont « Échéance en retard : TEST 6.2 Loyer —
  en retard de 19 jours » (5 nov. → 24 nov.).

### Observations hors périmètre

- Le badge « 1 Issue » de Next.js en dev est un avertissement d'hydratation
  causé par une extension navigateur (attributs ajoutés sur `<html>`),
  sans lien avec ce change.
- Le test « redéclenchement → badge revient » reste couvert par
  `alerts-badge.integration.test.tsx` (non rejoué dans le navigateur).
- La charge « TEST 6.2 Loyer » reste dans la base locale (voir rapport).
