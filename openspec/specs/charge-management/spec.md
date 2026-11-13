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

La création d'une charge SHALL générer ses échéances selon le type : récurrentes par période jusqu'au cas échéant, N échéances pour les échelonnées, une seule pour les ponctuelles, une échéance à la date prévue pour les à venir. Si la génération groupée échoue, la charge créée SHALL rester récupérable (les échéances peuvent être recréées) et l'utilisateur en SHALL être informé.

#### Scenario: Charge échelonnée en 4 prélèvements

- **WHEN** l'utilisateur crée "Impôt FR", type `INSTALLMENT`, 4 échéances de 312 EUR, première échéance au 25/09
- **THEN** 4 échéances sont créées aux dates consécutives prévues, au statut `PENDING`

#### Scenario: Échec de génération récupérable

- **WHEN** la charge est créée mais la génération groupée des échéances échoue
- **THEN** la charge existe, l'UI affiche un avertissement et propose de relaire la création des échéances

### Requirement: Lister et supprimer des charges

L'API SHALL exposer `GET /api/charges` (filtres typés) et `DELETE /api/charges/{id}`. La suppression SHALL retirer la charge et ses échéances à venir ; l'utilisateur SHALL confirmer avant toute suppression.

#### Scenario: Suppression confirmée

- **WHEN** l'utilisateur confirme la suppression d'une charge sans paiements rapprochés
- **THEN** la charge et ses échéances à venir sont retirées de la liste

#### Scenario: Suppression inexistante

- **WHEN** `DELETE /api/charges/{id}` est appelé avec un identifiant inexistant
- **THEN** la réponse est 404 lisible
