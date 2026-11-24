# Spec Delta — alerts

## MODIFIED Requirements

### Requirement: État lu des alertes

Chaque alerte SHALL être marquée comme lue quand l'utilisateur la consulte (vue dédiée ouverte) ou la rejette explicitement. L'état lu SHALL être conservé par appareil et partagé entre toutes les vues montées : le badge SHALL faire disparaître le compteur dès que toutes les alertes actives sont lues, sans rechargement de la page. Une alerte dont la condition se déclenche à nouveau SHALL réapparaître comme non lue.

#### Scenario: Badge décrémenté

- **GIVEN** 3 alertes actives non lues
- **WHEN** l'utilisateur ouvre la vue dédiée
- **THEN** le badge disparaît (alertes marquées lues) tant que les conditions ne se redéclenchent pas

#### Scenario: Redéclenchement

- **GIVEN** une alerte lue
- **WHEN** sa condition se déclenche à nouveau (nouvelle échéance proche, nouveau dépassement)
- **THEN** le badge réapparaît avec cette alerte comptée comme non lue

#### Scenario: Badge effacé sans rechargement

- **GIVEN** 2 alertes actives non lues et le header affiché
- **WHEN** l'utilisateur ouvre la vue dédiée puis revient au dashboard
- **THEN** le badge de la cloche est effacé sans rechargement de la page
