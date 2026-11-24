## Why

Neuf guards serveur répètent la même mécanique (QueryClient, prefetch, dehydrate, HydrationBoundary). FE-2 demande un seul Guard générique. Les lignes 04 et 05 fusionnent : le filtre (BE-2) est déjà un moteur unique (`Filter` + `createWhereTranslator`), on le constate et on ferme l'écart sans le réécrire.

## What Changes

- Un composant générique `PrefetchGuard` (`entries: { queryKey, queryFn }[]`) porte toute la mécanique.
- Les neuf guards de domaine deviennent de fines déclarations d'entrées (mêmes clés, mêmes services, mêmes fenêtres) : aucun changement de comportement.
- `ARCHITECTURE.md` : l'écart BE-2 est tranché (moteur unique existant, nommage différent du standard), l'écart FE-2 est fermé.

## Out of scope

- `listQuerySchema` / `toPrismaArgs` (réécriture du filtre sans gain), pagination (ligne 20).
- Changer les pages, vues ou contenus.

## Capabilities

### Modified Capabilities
- `app-shell`: no behaviour change.
