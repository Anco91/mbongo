# alerts Specification (delta)

## MODIFIED Requirements

### Requirement: Présentation des alertes

L'UI SHALL présenter les alertes via une icône cloche dans le header, accompagnée d'un badge du nombre d'alertes actives non lues. La consultation se fait dans une vue dédiée listant toutes les alertes actives triées par gravité (forte d'abord). Le dashboard SHALL rester épuré : aucune alerte ne SHALL y être affichée en bandeau. Aucune alerte SHALL être émise pour une information non déclenchée.

#### Scenario: Accès aux alertes

- **GIVEN** 3 alertes actives non lues
- **WHEN** l'utilisateur touche la cloche du header
- **THEN** la vue dédiée affiche les 3 alertes triées par gravité

#### Scenario: Bandeau vide

- **GIVEN** aucune condition d'alerte
- **THEN** le badge de la cloche n'est pas affiché et la vue dédiée montre un état vide lisible

## ADDED Requirements

### Requirement: État lu des alertes

Chaque alerte SHALL être marquée comme lue quand l'utilisateur la consulte (vue dédiée ouverte) ou la rejette explicitement. L'état lu SHALL être conservé par appareil et Shall faire disparaître le badge quand toutes les alertes actives sont lues. Une alerte dont la condition se déclenche à nouveau SHALL réapparaître comme non lue.

#### Scenario: Badge décrémenté

- **GIVEN** 3 alertes actives non lues
- **WHEN** l'utilisateur ouvre la vue dédiée
- **THEN** le badge disparaît (alertes marquées lues) tant que les conditions ne se redéclenchent pas

#### Scenario: Redéclenchement

- **GIVEN** une alerte lue
- **WHEN** sa condition se déclenche à nouveau (nouvelle échéance proche, nouveau dépassement)
- **THEN** le badge réapparaît avec cette alerte comptée comme non lue
