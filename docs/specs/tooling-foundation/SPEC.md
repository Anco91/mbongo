# SPEC-TOOLING-001 — Runner npm et Turbo du monorepo

## Métadonnées

```yaml
spec_id: 'TOOLING-001'
version: '1.0.1'
title: 'Rétablir les commandes npm/Turbo du monorepo'
status: 'VALIDATED'
author: 'Agent IA Expert Architect'
created_at: '2026-11-05'
updated_at: '2026-11-05'
reviewer: 'Anco'
validated_at: '2026-11-06'
project: 'mbongo'
priority: 'HIGH'
```

## Objectif

> Permettre aux scripts racine d’orchestrer les scripts existants des workspaces de façon reproductible avec npm et Turborepo 2.

Les commandes racine échouent avant d’atteindre les packages : le dépôt n’a ni `turbo.json` ni lockfile npm, et la configuration Turbo v2 est encore déclarée dans `package.json` sous l’ancien format `pipeline`.

## Périmètre

### Inclus

- Faire de **npm** le gestionnaire de paquets du monorepo, comme tu l’as confirmé.
- Remplacer la dépendance locale `workspace:*` par une plage semver compatible avec npm workspaces ; npm reliera le package local correspondant.
- Ajouter le `package-lock.json` racine, généré à partir des manifestes actuels.
- Déplacer la configuration des tâches dans un `turbo.json` racine au format Turbo 2 (`tasks`) et retirer l’ancienne configuration `turbo.pipeline` du `package.json`.
- Garder les scripts racine existants et vérifier que Turbo route chaque tâche vers les workspaces qui déclarent ce script.

### Exclu

- Corriger les erreurs préexistantes du code (ESLint, formatage ou TypeScript) : elles auront leurs propres petites PR.
- Changer les versions fonctionnelles des dépendances sans nécessité pour installer le monorepo.
- Ajouter ou modifier une pipeline CI.
- Migrer vers pnpm ou un autre gestionnaire.

## Configuration cible

- `package.json` racine : workspaces `apps/*` et `packages/*`, scripts npm actuels.
- `turbo.json` racine : tâches `build`, `dev`, `lint`, `lint:fix`, `format`, `format:check`, `test`, `test:watch`, `test:coverage`, `typecheck` et `clean`.
- `package-lock.json` racine : source de résolution reproductible pour `npm ci`.

Les paramètres de cache et dépendances des tâches reprennent l’intention de la configuration actuelle. Les tâches persistantes (développement et tests en watch) ne sont pas mises en cache. Les commandes Prisma racine existantes restent directes et ne sont pas redirigées vers Turbo.

## Exemple d’usage

```sh
npm ci
npm run lint
npm run typecheck
npm run build
```

Turbo doit charger son graphe et lancer les scripts workspace correspondants. Une erreur ESLint ou TypeScript propre à un package reste visible comme telle et n’est pas masquée par le runner.

## Stratégie de vérification

- `npm ci` depuis un checkout propre installe les workspaces avec le lockfile commité.
- `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test` et `npm run build` atteignent leurs scripts workspace sans erreur de configuration Turbo ni avertissement d’absence de lockfile.
- Les échecs intrinsèques aux scripts des packages sont consignés séparément ; le socle qualité V1 ne sera déclaré vert qu’après leurs PR de correction.

## Limites

- **Toujours :** conserver les noms des scripts publics et utiliser npm workspaces.
- **Demander avant :** changer le gestionnaire de paquets ou introduire des dépendances de build supplémentaires.
- **Ne jamais :** masquer les codes de sortie d’un script workspace ou ignorer le lockfile.

## Critères de sortie

- [ ] Une installation propre avec `npm ci` réussit depuis le lockfile.
- [ ] Turbo 2 lit sa configuration depuis `turbo.json` et découvre les scripts déclarés dans les workspaces.
- [ ] Chaque commande racine de lint, format, types, tests et build lance les tâches attendues ; aucun script manquant n’est simulé comme réussi.
- [ ] Les erreurs de code déjà présentes restent visibles et sont traitées dans des PR distinctes.

## Questions ouvertes

- Aucune : le gestionnaire est fixé à npm selon la préférence du demandeur.

## Historique

- 1.0.0 — Spec initiale.
- 1.0.1 — Validée par le demandeur le 2026-11-06.

## Références

- [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces/)
- [Turborepo 2 — configuration des tâches](https://turborepo.dev/docs/reference/configuration)
