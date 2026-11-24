## ADDED Requirements

### Requirement: Accès aux revenus à lier depuis le tableau de bord

Le tableau de bord SHALL afficher un lien « N revenus à lier » vers `/incomes/unmatched` quand au moins une entrée d'argent est sans source de revenu, et SHALL n'afficher aucun lien sinon. N SHALL être le nombre de lignes de l'écran (`findUnmatchedIncome`).

#### Scenario: Entrées à lier

- **GIVEN** deux entrées d'argent sans source
- **WHEN** l'utilisateur ouvre le tableau de bord
- **THEN** le lien « 2 revenus à lier » est visible et ouvre `/incomes/unmatched`

#### Scenario: Rien à lier

- **WHEN** aucune entrée n'est sans source
- **THEN** aucun lien n'est affiché

#### Scenario: Après un lien

- **WHEN** l'utilisateur lie la dernière entrée puis revient au tableau de bord
- **THEN** le lien a disparu
