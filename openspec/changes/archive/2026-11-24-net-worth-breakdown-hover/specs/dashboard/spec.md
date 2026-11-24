## ADDED Requirements

### Requirement: Détail du patrimoine consolidé

Le survol de la carte « Patrimoine consolidé » SHALL lister chaque terme du total : un par compte actif au solde non nul, en devise native, précédé de « + » (solde positif) ou « − » (solde négatif, suffixé « découvert »). Les comptes clôturés et les soldes nuls SHALL en être absents. Pour chaque devise, la somme signée des termes SHALL égaler le total natif de cette devise utilisé par le patrimoine consolidé.

#### Scenario: Épargne positive

- **GIVEN** un compte actif « Épargne X » à 1000 CHF
- **THEN** le détail contient « + 1 000 CHF Épargne X »

#### Scenario: Compte à découvert

- **GIVEN** un compte actif « Compte courant X » à −500 EUR
- **THEN** le détail contient « − 500 EUR Compte courant X découvert »

#### Scenario: Compte clôturé

- **GIVEN** un compte clôturé
- **THEN** il n'apparaît pas dans le détail

#### Scenario: Navigation clavier

- **WHEN** la carte reçoit le focus
- **THEN** le détail est visible comme au survol
