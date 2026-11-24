## Why

La page Transferts accumule les transferts réglés : la liste grossit et noie ceux qui attendent encore un crédit. Aucun moyen de les ranger, alors que les comptes clôturés ont déjà un interrupteur d'affichage.

## What Changes

- Un transfert peut être clos (statut `CLOSED`) depuis la page Transferts, depuis n'importe quel état.
- Les transferts clos sont masqués par défaut ; une case « Afficher les transferts clos » les révèle (même motif que les comptes clôturés).
- Un transfert clos ne peut plus être finalisé (409). Son taux effectif reste utilisable comme taux de repli (il compte comme réalisé).
- Aucune migration : la colonne `Transfer.status` est du texte libre.

## Out of scope

- Rouvrir un transfert clos.
- Suppression de transfert.
- Persistance de la case à cocher (comme pour les comptes : état local).
- Tests d'UI (glue).

## Capabilities

### Modified Capabilities
- `transfer-management`: clôture d'un transfert, masquage par défaut, refus de finalisation d'un transfert clos.
