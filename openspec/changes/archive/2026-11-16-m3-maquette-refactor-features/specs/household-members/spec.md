# household-members Specification (delta)

## ADDED Requirements

### Requirement: Filtrage des vues par membre ou couple

L'UI des vues comptes et charges SHALL proposer un filtre par membre du foyer et par couple (« foyer ») : sélectionner un membre limite la liste à ses éléments (propriétaire du compte, débiteur de la charge) ; « foyer » rétablit la liste complète. Le filtre SHALL être persistant pendant la navigation de la vue en cours.

#### Scenario: Filtre sur un membre

- **GIVEN** des comptes appartenant à Anco, à l'épouse et au couple
- **WHEN** l'utilisateur filtre sur Anco
- **THEN** seuls les comptes d'Anco sont listés

#### Scenario: Retour au foyer

- **GIVEN** un filtre membre actif
- **WHEN** l'utilisateur sélectionne « foyer »
- **THEN** la liste complète réapparaît

### Requirement: Données nécessaires aux filtres

L'API SHALL fournir la liste des membres avec leur identifiant, prénom et rôle pour alimenter les filtres. Aucune information supplémentaire sur les membres SHALL être nécessaire.

#### Scenario: Alimentation du filtre

- **GIVEN** le seed du foyer
- **WHEN** l'UI charge les options de filtre
- **THEN** les options sont « foyer », puis un membre par membre (prénom affiché)
