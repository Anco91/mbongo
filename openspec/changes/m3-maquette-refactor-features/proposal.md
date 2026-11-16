# Proposal

## Why

L'app atteint le jalon M3 (« V1 utilisable ») : il lui manque le dashboard (F6), les provisions (F10), les alertes (F11), le capital restant dû (F13) et les filtres foyer (F8). Parallèlement, le code existant dévie de la maquette validée et des conventions du projet (URLs françaises, pas de page d'accueil, formulaires et composants redondants, services surchargés de logique qui appartient aux libs partagées). Le jalon M3 est le bon moment pour aligner l'app sur la maquette et standardiser le socle avant d'y brancher les features.

## What Changes

- **BREAKING** — Routes anglaises et page d'accueil : `/` = dashboard ; `/echeancier` → `/schedule`, `/comptes` → `/accounts`, `/transferts` → `/transfers`.
- **Nouveau dashboard `/`** (F6) : patrimoine consolidé (totaux par devise + consolidé EUR au taux daté), Sankey des flux du mois, donut des dépenses par catégorie (F14, présent dans la maquette), échéances du mois, cartes provisions, bandeau d'alertes.
- **Provisions** (F10) : lissage mensuel des charges annuelles/échelonnées, calcul en lib partagée, affichage dashboard.
- **Alertes** (F11) : échéance dans les 7 jours, approche du découvert autorisé, trésorerie prévisionnelle négative — règles pures en lib partagée, bandeau sur le dashboard.
- **Capital restant dû** (F13) : la vue détaillée d'une charge échelonnée affiche l'échéancier complet et le capital restant dû.
- **Vue foyer** (F8) : filtres personne/couple sur les comptes et les charges.
- **Refonte UI selon la maquette** (les éléments de navigation et de présentation, pas le phone-frame de démo) : navigation basse 4 onglets, en-tête, bottom sheets de détail (`DetailSheet`), plein-écran de charts avec zoom/pan, badges de type et de statut, chips de compte.
- **Standardisation front** : primitives de formulaire (`Field`, `InputField`, `SelectField`, `SwitchField`…) et `<Form>` composé dont les styles vivent dans les primitives ; pattern de vue standard `page → XxxView → XxxGuard (children reçoivent la data) → XxxContent` ; consolidation des hooks doublés (`src/hooks` + `components/*/hooks`) ; suppression des redondances ; réutilisation systématique des types zod de `packages/shared` (aucun type recréé à la volée).
- **Standardisation back** : traducteur where générique `createWhereTranslator(fieldMap)` (noyau portable, field map par service ~6 lignes) remplaçant le boilerplate par entité de `filter-to-where.ts` ; services réduits au CRUD + méthodes transactionnelles ; les calculs restants migrent vers `packages/shared` et s'exécutent côté client (R9).
- **Reporté** : import CSV de relevés (F9) — échantillons CSV réels non disponibles au moment de la planification.

## Capabilities

### New Capabilities

- `dashboard`: vue d'ensemble consolidée — patrimoine par devise et consolidé EUR daté, Sankey des flux du mois, donut des dépenses par catégorie, échéances du mois, provisions, bandeau d'alertes.
- `provisions`: lissage mensuel des charges annuelles ou échelonnées — provision calculée, cumul suivi, affichage dans le dashboard.
- `alerts`: alertes basiques — échéance à 7 jours, découvert approché/dépassé, trésorerie prévisionnelle négative — règles pures et présentation.

### Modified Capabilities

- `charge-management`: la vue détaillée d'une charge échelonnée SHALL afficher l'échéancier complet et le capital restant dû (F13).
- `household-members`: les vues comptes et charges SHALL être filtrables par membre et par couple (F8).

## Impact

- **Routes** : renommage des pages `(dashboard)` ; `/` devient la page dashboard.
- **Front** : `apps/web/src/components/*` (refonte toutes les vues, primitives ui), `apps/web/src/hooks` (consolidation), nouvelles primitives de formulaire ; navigation basse dans le layout.
- **Back** : `apps/web/src/server/common/filter-to-where.ts` remplacé par le noyau générique + field maps dans chaque service ; amincissement des services (logique de calcul retirée vers `packages/shared`).
- **Lib partagée** : nouveaux modules `packages/shared/src/lib/calculation/` (sankey, provisions, remaining-principal) et `packages/shared/src/domain/alerts.ts`.
- **Schémas** : réutilisation des zod schemas existants ; éventuels nouveaux schémas (provision, alert) dans `packages/shared/src/schemas/`.
- **Doc** : `CONVENTIONS.md` mis à jour (pattern guard, form kit, conventions de nommage des routes).
