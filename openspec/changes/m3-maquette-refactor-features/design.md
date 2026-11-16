# Design — M3 : maquette + refactor standards + features

## Context

Le socle M1/M2 est en place (comptes, transactions, transferts, charges, échéancier, cartes différées) avec 6 specs validées. L'UI existante dévie de la maquette validée (navigation, sheets, badges), le code porte les écarts relevés : URLs françaises sans page d'accueil, `filter-to-where.ts` codé en dur pour 6 entités, services 100–206 lignes contenant de la logique de calcul, hooks en double (`src/hooks` + `components/*/hooks`), styles et types redéclarés localement. Une partie du métier est déjà en lib partagée : `monthlyProvision`, `remainingBalance`, `paymentsInMonth`, `isOverdraft`, `paymentDisplayStatus`, `counterValue`, `effectiveRate`. La charge porte déjà un champ `provisioned`.

## Goals / Non-Goals

**Goals**

- Coquille UI conforme à la maquette, factorisée (primitives + compound components, zéro style dans les vues).
- Socle standard : pattern vue/guard unique, kit de formulaire zod, traducteur where générique, services CRUD minces, calculs en libs partagées exécutés côté client.
- Features M3 (F6, F8, F10, F11, F13, donut F14) branchées sur ce socle.

**Non-Goals**

- Import CSV (F9) — reporté, échantillons non disponibles.
- Changements de schéma Prisma (aucune migration nécessaire).
- Réécriture des endpoints `/api/**` (contrats inchangés ; seule la traduction filtre change en interne).
- Le phone-frame de la maquette (artefact de démo, pas de l'app).

## Decisions

### D1 — Routes anglaises + `/` = dashboard

`/` dashboard, `/charges`, `/schedule`, `/transfers`, `/accounts` (+ `/nouveau` → `/new`). Anciennes routes FR en redirections temporaires via `next.config.ts` `redirects()` (5 lignes, retirées plus tard). Alternative écartée : garder les URLs FR (l'utilisateur a tranché : tout en anglais).

### D2 — Traducteur where générique

Noyau portable `server/common/where-translator.ts` : `createWhereTranslator<T>(fieldMap)` où `fieldMap: Record<string, { ops: FilterOp[]; transform?: (v) => unknown }>`. Le noyau connaît les opérateurs génériques (`eq`, `not`, `in`, `gte`, `lte`, `contains`) et les convertit en conditions Prisma ; il ne connaît aucune entité. Chaque service déclare une field map de ~6 lignes à partir de son `xxxQuerySchema` zod existant — le zod reste la source de validation, la field map la source de traduction. Les `xxxQuerySchema` existants ne changent pas.

- Alternative 1 : dérivation automatique depuis les schémas zod (zéro config) — écartée : impossible de déduire les opérations autorisées par champ et les champs de relation sans métadonnées.
- Alternative 2 : une lib externe de filtrage — déjà écartée au M0 (cdc R3, conventions imposées ou projets trop jeunes).
- Portabilité : le noyau ne dépend que de la forme `Filter` et d'un mapping opérateur → objet, reproductible dans tout projet.

### D3 — Design system et kit de formulaire

Primitives projet dans `components/common/` (au-dessus de shadcn `components/ui/`) : `FormField` (label + contrôle + hint/error), `TextInput`, `SelectInput`, `ToggleInput`, `AmountInput` (devise CHF/EUR via `currencySchema`), `StatusBadge`, `TypeBadge`, `AccountChip`, `DetailSheet`, `SectionTitle`, `ExpandButton`, `ChartFullscreen` (zoom/pan). Tout le style vit ici — une seule fois.

Kit de formulaire : `<Form>` composé (RHF + `zodResolver` sur les schémas zod de `packages/shared`), formulaires déclaratifs : liste de champs typés par le schéma du domaine. Aucun style local dans les formulaires ; tous les formulaires existants migrés. Alternative écartée : méta-framework `<ZodForm schema>` générant tout — sur-abstraction, difficile à faire dévier proprement (parcimonie).

Icônes : `nucleo-sharp` comme la maquette ; charts : Recharts (déjà la cible).

### D4 — Pattern vue/guard unique

```
page.tsx (routage) → XxxView (coquille de composition : sections, en-tête)
                    → XxxGuard (appelle le service directement, R5 ; render
                       children avec les données ; Suspense/error déclaratifs)
                    → XxxContent (présentation pure, sans effet de bord)
```

Écrit une fois dans `CONVENTIONS.md` et appliqué à toutes les vues. Hooks de domaine réunis dans `src/hooks/` (place unique) ; suppression des `components/*/hooks/`. Aucun composant client n'importe `server/` (garanti par `server-only`).

### D5 — Dashboard : flux de données

Guard dashboard (RSC) charge via services : comptes + soldes, échéances du mois, charges provisionnées, transferts, taux. Sérialise vers les composants client. Les agrégations (Sankey, donut, alertes, provisions, consolidé) s'exécutent côté client à partir de ces données (R9) :

- `packages/shared/src/lib/calculation/sankey.ts` : construit nœuds/liens depuis transactions (revenus → comptes) et transferts (compte → compte) et échéances payées du mois (comptes → catégories). Pas de route `getSankey`.
- `packages/shared/src/lib/calculation/donut.ts` : dépenses du mois par catégorie.
- Consolidé EUR : dernier taux connu (taux effectif du dernier transfert réalisé, sinon dernier taux de référence saisi), affiché avec sa `rateDate` ; aucun taux → total consolidé masqué, jamais implicite (cdc § 3.4).

### D6 — Amincissement des services

Audit de chaque service : ne reste que CRUD (`findMany`, `findOne`, `create`, `update`, `remove`) + méthodes transactionnelles ($transaction, ~10 % : création de charge avec échéances, phase 2 transfert, clôture, ancrage snapshot). Toute logique de calcul ou de présentation migre vers `packages/shared`. Les field maps D2 remplacent la traduction inline. Objectif indicatif : services < 80 lignes.

### D7 — Provisions et budget du mois

`monthlyProvision` existe déjà. La carte Provisions liste les charges `provisioned: true` (total mensuel du foyer). Pour éviter le double comptage (spec provisions) : dans le total mensuel affiché, les échéances réelles d'une charge provisionnée sont exclues du lot « échéances du mois » et remplacées par sa provision.

### D8 — Alertes

`packages/shared/src/domain/alerts.ts` : fonctions pures `computeAlerts(input)` — entrées : échéances à venir, soldes + découverts, forecast 30 jours. Seuils : due ≤ 7 j (J+0 inclus) ; approche du découvert : solde provisionnel ≤ −70 % du découvert autorisé ; forte : dépassement ; trésorerie négative : solde provisionnel < 0 avec découvert non autorisé ou dépassé. Tri par gravité dans le bandeau. Aucune alerte persistée — calculées à la volée.

## Risks / Trade-offs

- [Gros change unique (choix utilisateur A)] → tâches ordonnées : coquille d'abord (purement mécanique), features ensuite ; validation `pnpm lint && pnpm build` + tests après chaque groupe de tâches.
- [Fidélité maquette subjective] → la maquette est la référence pixel : primitives reprennent ses classes Tailwind ; toute déviation se discute avant implémentation.
- [Sankey Recharts avec multi-niveaux CH/EUR] → le Sankey agrège en devise de consolidation pour les liens inter-comptes, montants natifs en tooltip ; cas dégénérés (mois vide, comptes clos) testés.
- [Redirections temporaires oubliées] → datées dans tasks, retrait prévu.
- [Services amincis : régression] → tests unitaires shared couvrent les fonctions extraites ; les tests existants des services restent verts.

## Migration Plan

1. Coquille (D1–D4) : renommage routes + redirects, primitives, pattern vue/guard, purge hooks, migration des vues existantes — l'app reste fonctionnelle à chaque commit.
2. Socle back (D2, D6) : noyau where + field maps service par service, extraction des calculs vers shared — contrats API inchangés.
3. Features (D5, D7, D8) : dashboard, provisions, alertes, restant dû, filtres foyer.
Rollback : git par commit ; aucune migration DB.

## Open Questions

Aucune question bloquante. Le format exact des CSV (F9 reporté) sera collecté au moment du change F9.
