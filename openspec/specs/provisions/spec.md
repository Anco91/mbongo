# provisions Specification

## Purpose

TBD - created from delta of change m3-maquette-refactor-features.

## Requirements

### Requirement: Provision mensuelle sur charge annuelle ou échelonnée

Le système SHALL permettre d'activer un provision sur une charge à échéance annuelle (ou échelonnée longue) : la provision mensuelle est le total de la charge divisé par 12, arrondi au centime. L'UI de création/édition SHALL proposer l'option « lisser sur 12 mois » pour ces types de charges.

#### Scenario: SERAFE provisionnée

- **GIVEN** une charge annuelle de 335 CHF
- **WHEN** le provision est activé
- **THEN** la provision mensuelle affichée est 27,92 CHF

#### Scenario: Provision désactivée

- **WHEN** l'utilisateur désactive le provision
- **THEN** aucune provision mensuelle n'est comptée pour cette charge

### Requirement: Provisions visibles sur le dashboard

L'UI du dashboard SHALL afficher la carte « Provisions · lissage mensuel » listant les charges provisionnées : libellé, provision mensuelle, total annuel, compte débité, et le total provisionné du foyer par mois.

#### Scenario: Somme des provisions

- **GIVEN** deux charges provisionnées (27,92 CHF et 40,00 CHF)
- **WHEN** le dashboard se charge
- **THEN** le total provisionné affiché est 67,92 CHF / mois

### Requirement: Budget du mois inclut les provisions

Le budget d'un mois SHALL compter les échéances du mois plus les provisions du mois. Une charge provisionnée ne plombe pas deux fois : elle compte au titre du provision, pas à sa date de facturation future, dans le total mensuel affiché.

#### Scenario: Provision vs échéance

- **GIVEN** une charge annuelle provisionnée dont la facture tombe dans 8 mois
- **WHEN** le total du mois courant est calculé
- **THEN** seule la provision mensuelle compte ; la future facture n'apparaît pas deux fois
