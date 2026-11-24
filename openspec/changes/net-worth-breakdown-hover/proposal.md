## Why

« Patrimoine consolidé » affiche un seul total. Impossible de voir ce qui le compose : quels comptes, en quelle devise, lesquels sont à découvert.

## What Changes

- Une fonction pure liste les termes du patrimoine : un par compte actif au solde non nul, avec sa devise, son solde et son sens (actif ou découvert).
- Au survol (et au focus clavier / toucher) de la carte « Patrimoine consolidé », un panneau liste chaque terme : « + 1 000 CHF Épargne X », « − 500 EUR Compte courant X découvert ».
- Aucun changement de schéma ni d'API ; le total consolidé est inchangé.

## Out of scope

- Conversion de chaque terme dans la devise d'affichage (les termes restent en devise native, comme les soldes de comptes).
- Comptes clôturés (le total les exclut déjà ; la liste suit le total).
- Tests d'UI (glue).

## Capabilities

### Modified Capabilities
- `dashboard`: la carte « Patrimoine consolidé » détaille ses termes.
