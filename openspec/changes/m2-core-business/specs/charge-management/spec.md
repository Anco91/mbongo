# Spec Delta — charge-management

## MODIFIED Requirements

### Requirement: Génération des échéances à la création

La création d'une charge SHALL être transactionnelle : la charge et ses échéances générées selon le type (récurrentes par période jusqu'à l'horizon, N échéances pour les échelonnées, une seule pour les ponctuelles et les à venir) sont persistées dans une même transaction. En cas d'échec, aucune charge ne SHALL être créée (tout-ou-rien) ; l'utilisateur peut resoumettre le formulaire sans état intermédiaire. Aucune échéance orpheline ne SHALL exister après une création réussie.

#### Scenario: Charge échelonnée en 4 prélèvements

- **WHEN** l'utilisateur crée "Impôt FR", type `INSTALLMENT`, 4 échéances de 312 EUR, première échéance au 25/09
- **THEN** la charge et ses 4 échéances sont créées aux dates consécutives prévues, au statut `PENDING`, dans une seule opération

#### Scenario: Échec de génération récupérable

- **WHEN** la persistance groupée des échéances échoue au cours de la transaction de création
- **THEN** la charge n'est pas créée (tout-ou-rien), la réponse est une erreur lisible, la base ne contient ni charge ni échéance orpheline, et l'utilisateur récupère en resoumettant simplement le formulaire

## ADDED Requirements

### Requirement: Édition du calendrier d'une charge

La modification d'une charge touchant son calendrier (montant, fréquence, dates, nombre d'échéances) SHALL remplacer les futures échéances au statut `PENDING` non rapprochées par le nouveau calendrier, dans une même transaction. Les échéances au statut `PAID` ou rapprochées SHALL rester strictement inchangées (l'historique des paiements est préservé). Une édition ne touchant pas le calendrier SHALL laisser toutes les échéances en l'état.

#### Scenario: Révision du montant d'une charge fixe

- **WHEN** l'utilisateur porte le loyer de 1 850 à 1 900 CHF
- **THEN** toutes les échéances futures `PENDING` non rapprochées affichent 1 900 CHF, et les échéances `PAID` conservent leur montant d'origine

#### Scenario: Édition préservant l'historique

- **WHEN** une charge échelonnée a 2 échéances `PAID` sur 4 et l'utilisateur corrige la date de la 4ᵉ échéance via l'édition de la charge
- **THEN** les 2 échéances payées restent intouchées et seules les échéances futures sont recalculées
