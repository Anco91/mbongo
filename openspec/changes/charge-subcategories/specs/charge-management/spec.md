## ADDED Requirements

### Requirement: Sous-catégorie d'une charge

Une charge SHALL pouvoir porter une sous-catégorie optionnelle. Les catégories connues (Logement, Santé, Impôts & taxes, Assurances, Abonnements, Médias, Divers) SHALL avoir chacune une liste fermée de sous-catégories ; une sous-catégorie SHALL appartenir à la liste de sa catégorie. Une sous-catégorie vide SHALL toujours être valide. Une catégorie hors liste (charges existantes) SHALL rester lisible et modifiable, sans sous-catégorie possible. Le serveur SHALL refuser une sous-catégorie étrangère à la catégorie (422).

#### Scenario: Choisir une sous-catégorie

- **GIVEN** une charge de catégorie « Abonnements »
- **WHEN** l'utilisateur choisit « Mobile »
- **THEN** la charge est enregistrée avec la sous-catégorie « Mobile » et la fiche l'affiche

#### Scenario: Sous-catégorie étrangère

- **GIVEN** une charge de catégorie « Logement »
- **WHEN** une requête fixe la sous-catégorie « Mobile »
- **THEN** le serveur répond 422 et rien n'est écrit

#### Scenario: Charge existante

- **GIVEN** une charge de catégorie « rent » sans sous-catégorie
- **WHEN** l'utilisateur modifie son intitulé
- **THEN** la modification réussit et la sous-catégorie reste vide

### Requirement: Changer de catégorie remet la sous-catégorie à vide

Quand une modification change la catégorie sans préciser de sous-catégorie, la sous-catégorie enregistrée SHALL redevenir vide. Une sous-catégorie précisée dans la même modification SHALL être conservée si elle appartient à la nouvelle catégorie.

#### Scenario: Catégorie seule

- **GIVEN** une charge « Abonnements » / « Mobile »
- **WHEN** l'utilisateur passe la catégorie à « Logement »
- **THEN** la sous-catégorie est vide

#### Scenario: Catégorie et sous-catégorie ensemble

- **GIVEN** une charge « Abonnements » / « Mobile »
- **WHEN** l'utilisateur passe à « Santé » / « LAMal »
- **THEN** la charge est « Santé » / « LAMal »

### Requirement: Sélecteur de sous-catégorie dans les formulaires

Les formulaires de création et d'édition SHALL proposer, sous la catégorie, un sélecteur « Sous-catégorie » listant celles de la catégorie choisie, vide par défaut. Une catégorie sans sous-catégorie SHALL masquer le sélecteur.

#### Scenario: Liste liée à la catégorie

- **WHEN** l'utilisateur choisit « Assurances »
- **THEN** le sélecteur propose Auto, Habitation, Responsabilité civile, Garantie, Vie
