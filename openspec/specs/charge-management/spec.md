# charge-management Specification

## Purpose

Gérer les charges typées (fixe récurrente, échelonnée, temporaire, ponctuelle, à venir) attachées à un compte réel existant — corrige l'erreur FK P2003 (500 à toute création) et remplace le bouton placeholder par une page de création dédiée conforme aux 5 types.

## Requirements

### Requirement: Créer une charge sur un compte réel

La création d'une charge SHALL référencer un compte existant. L'UI SHALL proposer une page de création dédiée avec : intitulé, type de charge, catégorie, devise (CHF/EUR), montant et compte débité — le sélecteur de compte étant alimenté par les comptes actifs réels.

#### Scenario: Création réussie

- **WHEN** l'utilisateur crée la charge "Loyer GE", type `FIXED_RECURRING`, 1 850 CHF, compte "UBS Courant" existant
- **THEN** la charge est créée (201), visible dans la liste, et ses échéances futures sont générées

#### Scenario: Compte inexistant rejeté lisiblement

- **WHEN** une charge est soumise avec un identifiant de compte inexistant (cas actuel du bug P2003)
- **THEN** la réponse est 422 avec un message "compte inconnu" — jamais d'erreur 500

### Requirement: Formulaire de charge adapté au type

Le formulaire de création SHALL adapter ses champs au type de charge choisi : récurrence + jour de prélèvement pour les fixes ; N échéances + première date pour les échelonnées ; fin d'engagement pour les temporaires ; date pour les ponctuelles ; date prévue + option provision pour les à venir.

#### Scenario: Champs conditionnels par type

- **WHEN** l'utilisateur choisit le type `INSTALLMENT`
- **THEN** le formulaire affiche les champs "nombre d'échéances" et "première échéance", et masque les champs des autres types (récurrence, fin d'engagement…)

### Requirement: Génération des échéances à la création

La création d'une charge SHALL être transactionnelle : la charge et ses échéances générées selon le type (récurrentes par période jusqu'à l'horizon, N échéances pour les échelonnées, une seule pour les ponctuelles et les à venir) sont persistées dans une même transaction. En cas d'échec, aucune charge ne SHALL être créée (tout-ou-rien) ; l'utilisateur peut resoumettre le formulaire sans état intermédiaire. Aucune échéance orpheline ne SHALL exister après une création réussie.

#### Scenario: Charge échelonnée en 4 prélèvements

- **WHEN** l'utilisateur crée "Impôt FR", type `INSTALLMENT`, 4 échéances de 312 EUR, première échéance au 25/09
- **THEN** la charge et ses 4 échéances sont créées aux dates consécutives prévues, au statut `PENDING`, dans une seule opération

#### Scenario: Échec de génération récupérable

- **WHEN** la persistance groupée des échéances échoue au cours de la transaction de création
- **THEN** la charge n'est pas créée (tout-ou-rien), la réponse est une erreur lisible, la base ne contient ni charge ni échéance orpheline, et l'utilisateur récupère en resoumettant simplement le formulaire

### Requirement: Édition du calendrier d'une charge

La modification d'une charge touchant son calendrier (montant, fréquence, dates, nombre d'échéances) SHALL remplacer les futures échéances au statut `PENDING` non rapprochées par le nouveau calendrier, dans une même transaction. Les échéances au statut `PAID` ou rapprochées SHALL rester strictement inchangées (l'historique des paiements est préservé). Une édition ne touchant pas le calendrier SHALL laisser toutes les échéances en l'état.

#### Scenario: Révision du montant d'une charge fixe

- **WHEN** l'utilisateur porte le loyer de 1 850 à 1 900 CHF
- **THEN** toutes les échéances futures `PENDING` non rapprochées affichent 1 900 CHF, et les échéances `PAID` conservent leur montant d'origine

#### Scenario: Édition préservant l'historique

- **WHEN** une charge échelonnée a 2 échéances `PAID` sur 4 et l'utilisateur corrige la date de la 4ᵉ échéance via l'édition de la charge
- **THEN** les 2 échéances payées restent intouchées et seules les échéances futures sont recalculées

### Requirement: Lister et supprimer des charges

L'API SHALL exposer `GET /api/charges` (filtres typés) et `DELETE /api/charges/{id}`. La suppression SHALL retirer la charge et ses échéances à venir ; l'utilisateur SHALL confirmer avant toute suppression.

#### Scenario: Suppression confirmée

- **WHEN** l'utilisateur confirme la suppression d'une charge sans paiements rapprochés
- **THEN** la charge et ses échéances à venir sont retirées de la liste

#### Scenario: Suppression inexistante

- **WHEN** `DELETE /api/charges/{id}` est appelé avec un identifiant inexistant
- **THEN** la réponse est 404 lisible
