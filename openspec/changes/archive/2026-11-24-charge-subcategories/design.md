## Decisions

- **Colonne `subcategory String?` sur `Charge`, rien d'autre.** Liste fermée en code, pas de table. Rejeté: table `Category`/`Subcategory` (migration lourde, écran d'administration, aucun besoin d'édition par l'utilisateur ; parcimonie).
- **`category` reste une chaîne libre.** Des lignes existantes portent des valeurs hors liste (`rent`, `Vie courante`…) : un enum Zod ferait échouer la lecture. Une catégorie hors liste n'a aucune sous-catégorie possible; sa sous-catégorie reste `null`.
- **Taxonomie unique** `CHARGE_CATEGORIES` dans `packages/shared/src/domain/charge-category.ts`, remplace les deux listes dupliquées des formulaires. Libellés en français, ceux des formulaires (sept catégories, même ordre).
- **LAMal sous Santé, pas sous Assurances.** La ligne maître l'avait sous Assurances; la palette du donut la classe déjà « Santé (LaMaL) » et le formulaire a une catégorie Santé. Assurances = Auto, Habitation, Responsabilité civile, Garantie, Vie.
- **Règle unique, deux appelants** : `checkChargeSubcategory(category, subcategory)` rejoue dans `createChargeSchema.superRefine` (chemin `subcategory`) et dans `ChargeService` (create et update, 422). Sous-catégorie `null` toujours valide.
- **Édition partielle** : `updateChargeSchema` est un `.partial()` sans règle croisée. `resolveChargeSubcategory(existing, patch)` fixe la valeur stockée : valeur explicite gagne; sinon changement de catégorie ⇒ `null`; sinon inchangée. Le service fusionne avec la ligne existante puis vérifie. Rejeté: refuser (422) un changement de catégorie sans sous-catégorie (friction inutile).
- **Formulaire sans `useEffect`** : `useWatch` sur `category` pour les options du second sélecteur; le résolveur remet `subcategory` à `null` quand la valeur est vide ou étrangère à la catégorie (même motif que `dueDay`). `SelectInput` inchangé.
- **Donut hors tranche.** Forme retenue pour 10b : `computeDonutExpenses` garde un segment par catégorie (couleurs, part prévue intactes) et ajoute une ventilation optionnelle `subcategories` affichée en légende. Les transactions n'ont que la catégorie; Sankey inchangé. Test existant à garder vert: `m3-calculations.test.ts`.
- **Migration non appliquée.** `20261124230000_add_charge_subcategory/migration.sql` générée par `prisma migrate diff` (un seul `ADD COLUMN`). L'appliquer à `dev.db` est une porte GIT-7: humain. L'Executor lance seulement `npx prisma generate` (ne touche pas la base).
- Tranche de 8 fichiers de production après découpe 10a / 10b.

## Kickoff

**Product**: plus petite tranche visible = second sélecteur + ligne de détail. Le donut suit en 10b.
**Architect**: règle pure dans `domain/charge-category.ts`, appelée par le schéma et le service; composant `ChargeCategoryFields` partagé par les deux formulaires (FE-9). Risque: enum Zod sur `category`.
**Skeptic**: pins: `null` toujours valide (y compris catégorie libre), sous-catégorie sensible à la casse, changement de catégorie seul ⇒ remise à `null`, lignes legacy toujours lisibles et éditables, patch sans les deux champs n'écrit pas `subcategory`.
**Decisions**:
- Decision: colonne nullable because zéro admin; rejected table de catégories.
- Decision: LAMal sous Santé because palette et formulaire; rejected Assurances.
- Decision: remise à `null` au changement de catégorie because moins de friction; rejected 422.

## Frame amendment (typecheck)

`subcategory` is required in the inferred `Charge` type (`.default(null)`), so existing `Charge` fixtures fail `tsc` (jest passes). Decision (PM): add `subcategory: null` to the fixtures of 5 existing test files; keep the type required. Mechanical edit, no assertion change.
