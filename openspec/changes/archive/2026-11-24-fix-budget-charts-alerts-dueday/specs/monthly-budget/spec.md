# Spec Delta — monthly-budget

## MODIFIED Requirements

### Requirement: Récapitulatif du mois préparé

Le récapitulatif SHALL afficher les revenus du mois, le total des échéances du mois hors provisions, le total des provisions, le total des charges du mois et le reste à vivre (revenus − charges). Les revenus SHALL être calculés depuis les transactions positives du mois hors transferts. Les échéances du mois SHALL être requêtées à la source pour le mois préparé. Le total des charges SHALL réutiliser le calcul de budget mensuel existant, sans double comptage des provisions.

#### Scenario: Calcul du reste à vivre

- **GIVEN** 4 400 CHF de revenus, 1 850 CHF d'échéances et 27,92 CHF de provisions sur le mois
- **WHEN** l'utilisateur atteint le récapitulatif
- **THEN** les charges affichées sont 1 877,92 CHF et le reste à vivre est 2 522,08 CHF

#### Scenario: Revenu non saisi

- **GIVEN** aucune transaction positive sur le mois
- **WHEN** l'utilisateur atteint le récapitulatif
- **THEN** les revenus affichent 0,00 et le parcours invite à revenir à l'étape Revenus sans bloquer la sortie

#### Scenario: Provision non doublée

- **GIVEN** une charge annuelle provisionnée dont la facture tombe hors du mois préparé
- **WHEN** le récapitulatif est calculé
- **THEN** seule la provision mensuelle est comptée dans les charges

#### Scenario: Charges créées pendant le parcours

- **GIVEN** une charge fixe créée à l'étape Charges du parcours
- **WHEN** l'utilisateur atteint le récapitulatif
- **THEN** le total des charges du mois inclut l'échéance de cette charge et affiche un total supérieur à 0

#### Scenario: Revenu d'une source démarrée un mois précédent

- **GIVEN** un revenu dont la source a démarré le mois précédent et une transaction positive confirmée ce mois
- **WHEN** l'utilisateur atteint le récapitulatif
- **THEN** le revenu du mois est affiché depuis la transaction du mois

#### Scenario: Décomposition échéances et provisions

- **WHEN** le récapitulatif est calculé
- **THEN** le total des échéances hors provisions et le total des provisions sont affichés séparément
