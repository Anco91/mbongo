## ADDED Requirements

### Requirement: Écart de relevé par compte

La carte d'un compte SHALL afficher l'écart entre son dernier relevé (snapshot, date la plus récente) et le solde calculé à la date de ce relevé (solde d'ouverture + transactions du compte dont le jour est ≤ le jour du relevé). Un compte sans relevé SHALL n'afficher aucun écart. L'écart est `relevé − calculé`, arrondi au centime ; un écart nul s'affiche « Relevé conforme ».

#### Scenario: Écart positif

- **GIVEN** un compte ouvert à 1000, une transaction −200, un relevé à 900 daté après la transaction
- **THEN** le solde calculé à la date du relevé est 800 et la carte affiche un écart de +100

#### Scenario: Transaction postérieure ignorée

- **GIVEN** une transaction datée après le jour du relevé
- **THEN** elle n'entre pas dans le solde calculé à la date du relevé

#### Scenario: Transaction le jour du relevé

- **GIVEN** une transaction datée le même jour que le relevé, à une heure quelconque
- **THEN** elle entre dans le solde calculé

#### Scenario: Plusieurs relevés

- **WHEN** un compte a deux relevés
- **THEN** seul le plus récent est comparé

#### Scenario: Relevé conforme

- **GIVEN** un relevé égal au solde calculé (à 0,005 près)
- **THEN** la carte affiche « Relevé conforme »

#### Scenario: Sans relevé

- **WHEN** un compte n'a aucun relevé
- **THEN** la carte n'affiche aucune ligne d'écart
