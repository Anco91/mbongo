# charge-management Specification (delta)

## ADDED Requirements

### Requirement: Capital restant dû sur charge échelonnée

L'UI de détail d'une charge échelonnée SHALL afficher l'échéancier complet des échéances (dates, montants, statuts) et le capital restant dû : somme des montants des échéances non payées à date. Le restant dû SHALL diminuer au fil du rapprochement des échéances.

#### Scenario: Impôt FR en 4 prélèvements

- **GIVEN** une charge échelonnée de 4 × 312 EUR dont 2 échéances sont payées
- **WHEN** la feuille de détail s'ouvre
- **THEN** l'échéancier complet (4 lignes) est affiché
- **AND** le capital restant dû affiché est 624,00 EUR

#### Scenario: Tout payé

- **GIVEN** toutes les échéances payées
- **THEN** le restant dû affiché est 0,00
