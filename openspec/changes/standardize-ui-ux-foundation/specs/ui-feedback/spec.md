# Spec Delta

## ADDED Requirements

### Requirement: Chargement de navigation avec squelette

Chaque segment de route SHALL afficher immédiatement un squelette au gabarit de sa vue pendant la résolution des données serveur. L'utilisateur ne SHALL jamais rester sur l'écran précédent sans retour visuel après un changement de route.

#### Scenario: Ouverture d'une vue à données

- **WHEN** l'utilisateur touche l'onglet Charges, Transferts, Comptes ou Échéancier
- **THEN** un squelette de la vue cible apparaît immédiatement, puis est remplacé par les données

#### Scenario: Ouverture d'une fiche d'édition

- **WHEN** l'utilisateur touche un compte ou une charge pour le modifier
- **THEN** la page d'édition affiche son squelette avant le formulaire prérempli

#### Scenario: Absence de saut visuel

- **GIVEN** le dashboard vient de s'afficher
- **WHEN** les données des graphes arrivent
- **THEN** les graphes sont remplacés sans décalage de mise en page, via un squelette de même hauteur

### Requirement: Ossature de formulaire standard

Tout formulaire SHALL présenter ses actions dans le même ordre et au même endroit : action principale pleine largeur en bas du formulaire, action d'annulation optionnelle juste en dessous, puis zone destructive séparée par un filet. Les champs SHALL rester dans les sections du kit commun.

#### Scenario: Position identique des actions

- **GIVEN** les formulaires de création de compte, de charge et de transfert
- **WHEN** ils sont comparés
- **THEN** l'action principale occupe la même position et la même largeur dans les trois

#### Scenario: Zone destructive séparée

- **GIVEN** le formulaire d'édition d'un compte ou d'une charge
- **WHEN** le formulaire s'affiche
- **THEN** l'action destructive apparaît après l'action principale, séparée par un filet, jamais au milieu des champs

### Requirement: Attente et issue d'une mutation visibles

Pendant une mutation, l'action SHALL rester désactivée et afficher un indicateur d'attente sans changer la largeur du bouton. L'échec SHALL s'afficher au même endroit pour tous les formulaires ; le succès SHALL être confirmé avant tout retour à la liste.

#### Scenario: Soumission en attente

- **WHEN** l'utilisateur soumet un formulaire
- **THEN** le bouton principal se désactive, conserve son libellé et affiche un indicateur d'attente

#### Scenario: Échec de mutation

- **WHEN** la mutation échoue
- **THEN** un message d'erreur français s'affiche sous les actions, sans perdre la saisie

#### Scenario: Création confirmée

- **WHEN** une création réussit
- **THEN** l'utilisateur voit une confirmation, puis revient à la liste concernée

### Requirement: Mutation terminée avant navigation

Une navigation consécutive à une mutation SHALL attendre la fin de cette mutation. Aucun écran ne SHALL naviguer alors que la suppression ou la clôture est encore en cours.

#### Scenario: Clôture d'un compte

- **WHEN** l'utilisateur confirme la clôture d'un compte
- **THEN** la clôture se termine, la liste est rafraîchie, puis la navigation vers les comptes a lieu

#### Scenario: Suppression d'une charge

- **WHEN** l'utilisateur confirme la suppression d'une charge
- **THEN** la suppression se termine avant le retour à la liste, et un échec laisse l'utilisateur sur place avec le message
