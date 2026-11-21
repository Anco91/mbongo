# Spec Delta

## ADDED Requirements

### Requirement: Invitation à préparer le mois courant

Le dashboard SHALL afficher une carte « Budget de <mois> — à préparer » lorsque le mois courant n'a pas été préparé. La carte SHALL nommer le mois en toutes lettres, rappeler le total des charges du mois et proposer l'action principale « Préparer le mois » vers le parcours guidé. La carte SHALL disparaître une fois le mois préparé.

#### Scenario: Mois courant non préparé

- **WHEN** le dashboard s'ouvre en novembre 2026 et que novembre n'est pas préparé
- **THEN** la carte « Budget de novembre — à préparer » est affichée avec le bouton « Préparer le mois »

#### Scenario: Mois courant préparé

- **WHEN** novembre 2026 est marqué préparé
- **THEN** la carte d'invitation n'est plus affichée

### Requirement: Accès à la modification d'un mois préparé

Une fois le mois courant préparé, le dashboard SHALL conserver un accès discret à la réouverture du budget du mois, sans réafficher l'invitation. L'accès SHALL ouvrir le parcours sur les données existantes du mois.

#### Scenario: Réouverture depuis le dashboard

- **WHEN** l'utilisateur appuie sur « Modifier » depuis le budget du mois préparé
- **THEN** le parcours s'ouvre sur le mois courant avec ses revenus, charges et comptes déjà renseignés

### Requirement: Invitation limitée au mois courant

L'invitation au budget SHALL concerner uniquement le mois courant. La navigation mensuelle du dashboard SHALL continuer d'afficher les flux, échéances et provisions des mois passés ou futurs sans proposer de préparation pour ces mois.

#### Scenario: Consultation d'un mois passé

- **WHEN** l'utilisateur fait reculer le curseur mensuel sur octobre 2026
- **THEN** les cartes du mois s'affichent normalement et aucune invitation à préparer octobre n'apparaît
