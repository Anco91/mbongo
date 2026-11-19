# Spec Delta

## ADDED Requirements

### Requirement: Accès explicite aux vues secondaires

Toute vue secondaire servie par l'application SHALL être atteignable depuis une action visible de la coque ou d'une vue principale. Aucune route ne SHALL rester orpheline, sans point d'entrée dans l'interface.

#### Scenario: Échéancier accessible

- **GIVEN** l'application expose la vue échéancier
- **WHEN** l'utilisateur parcourt la vue Charges
- **THEN** une action libellée « Échéances à venir » ouvre l'échéancier

#### Scenario: Gestion du foyer accessible

- **GIVEN** l'utilisateur consulte la vue Comptes
- **WHEN** il atteint le bas de la liste
- **THEN** une ligne d'action « Gérer les membres » avec chevron ouvre la vue foyer

#### Scenario: Alertes accessibles

- **GIVEN** une vue principale affichée
- **WHEN** l'utilisateur touche la cloche de l'en-tête
- **THEN** la vue alertes s'ouvre et le compteur de non-lues reste lisible

### Requirement: Titres de vues secondaires orientés utilisateur

Le titre d'une vue secondaire SHALL décrire la tâche de l'utilisateur, sans terme d'implémentation. Les titres SHALL rester uniques et cohérents avec le glossaire de l'interface.

#### Scenario: Titre du foyer

- **WHEN** l'utilisateur ouvre la vue foyer
- **THEN** l'en-tête affiche « Membres du foyer » et non « Vue foyer »

#### Scenario: Titre de l'échéancier

- **WHEN** l'utilisateur ouvre la vue échéancier
- **THEN** l'en-tête affiche « Échéances à venir »
