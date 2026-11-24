## Decisions (AUTO-1)

- Entrée = bandeau sur le tableau de bord, pas un onglet : l'écran est ponctuel, la barre d'onglets reste à 4 entrées.
- Le compte vient de `useUnmatchedIncome().items.length` : une seule définition de « à lier », pas de nouvelle requête ni d'API de comptage.
- Le bandeau n'a pas de prefetch serveur : il apparaît après chargement client (pas de blocage du tableau de bord).
- Wording ajouté à `docs/LEXIQUE.md` : « N revenus à lier » (singulier « 1 revenu à lier »).

## Reuse

`useUnmatchedIncome` (spec 18), `routes.ts`, `Card`/`Button` de `components/ui`.
