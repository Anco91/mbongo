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

Le formulaire de création SHALL adapter ses champs au type de charge choisi : récurrence + jour de prélèvement pour les fixes ; N échéances + première date pour les échelonnées ; fin d'engagement pour les temporaires ; date pour les ponctuelles ; date prévue + option provision pour les à venir. Le jour de prélèvement (1–31) SHALL être proposé pour les charges fixes récurrentes mensuelles, avec le début du mois (1) comme valeur par défaut, et SHALL être masqué pour les autres fréquences. La date de début SHALL proposer par défaut le premier jour du mois courant.

#### Scenario: Champs conditionnels par type

- **WHEN** l'utilisateur choisit le type `INSTALLMENT`
- **THEN** le formulaire affiche les champs "nombre d'échéances" et "première échéance", et masque les champs des autres types (récurrence, fin d'engagement…)

#### Scenario: Choix du jour de prélèvement

- **GIVEN** le type `FIXED_RECURRING` choisi
- **WHEN** le formulaire s'affiche
- **THEN** le jour de prélèvement est proposé, positionné par défaut sur le début du mois, et modifiable au jour 5

#### Scenario: Jour masqué hors mensuel

- **GIVEN** le type `INSTALLMENT` choisi
- **WHEN** le formulaire s'affiche
- **THEN** le jour de prélèvement n'est pas proposé

### Requirement: Génération des échéances à la création

La création d'une charge SHALL être transactionnelle : la charge et ses échéances générées selon le type (récurrentes par période jusqu'à l'horizon, N échéances pour les échelonnées, une seule pour les ponctuelles et les à venir) sont persistées dans une même transaction. En cas d'échec, aucune charge ne SHALL être créée (tout-ou-rien) ; l'utilisateur peut resoumettre le formulaire sans état intermédiaire. Aucune échéance orpheline ne SHALL exister après une création réussie. La génération mensuelle SHALL ancrer la récurrence sur le jour de prélèvement choisi (ou, à défaut, le jour de la date de début) et SHALL inclure le mois d'ancrage même si le jour est déjà passé : l'échéance du mois courant est créée et le statut « dû » en est dérivé. Le jour choisi SHALL être adapté à la longueur du mois (le 31 tombe le 28, ou le 29 en année bissextile, pour février).

#### Scenario: Charge échelonnée en 4 prélèvements

- **WHEN** l'utilisateur crée "Impôt FR", type `INSTALLMENT`, 4 échéances de 312 EUR, première échéance au 25/09
- **THEN** la charge et ses 4 échéances sont créées aux dates consécutives prévues, au statut `PENDING`, dans une seule opération

#### Scenario: Échec de génération récupérable

- **WHEN** la persistance groupée des échéances échoue au cours de la transaction de création
- **THEN** la charge n'est pas créée (tout-ou-rien), la réponse est une erreur lisible, la base ne contient ni charge ni échéance orpheline, et l'utilisateur récupère en resoumettant simplement le formulaire

#### Scenario: Échéance au jour choisi, mois courant inclus

- **GIVEN** une charge fixe mensuelle créée le 23 du mois avec le jour de prélèvement 5
- **WHEN** les échéances sont générées
- **THEN** une échéance existe le 5 du mois courant (statut « dû » dérivé) puis le 5 de chaque mois suivant

#### Scenario: Jour 31 en mois court

- **WHEN** le jour de prélèvement 31 est choisi et le mois comporte 28 jours
- **THEN** l'échéance tombe le 28 (le 29 en année bissextile)

### Requirement: Édition du calendrier d'une charge

La modification d'une charge touchant son calendrier (montant, fréquence, dates, jour de prélèvement, nombre d'échéances) SHALL remplacer les futures échéances au statut `PENDING` non rapprochées par le nouveau calendrier, dans une même transaction. Les échéances au statut `PAID` ou rapprochées SHALL rester strictement inchangées (l'historique des paiements est préservé). Une édition ne touchant pas le calendrier SHALL laisser toutes les échéances en l'état. Les charges existantes sans jour de prélèvement SHALL être conservées en l'état, sans migration de données.

#### Scenario: Révision du montant d'une charge fixe

- **WHEN** l'utilisateur porte le loyer de 1 850 à 1 900 CHF
- **THEN** toutes les échéances futures `PENDING` non rapprochées affichent 1 900 CHF, et les échéances `PAID` conservent leur montant d'origine

#### Scenario: Édition préservant l'historique

- **WHEN** une charge échelonnée a 2 échéances `PAID` sur 4 et l'utilisateur corrige la date de la 4ᵉ échéance via l'édition de la charge
- **THEN** les 2 échéances payées restent intouchées et seules les échéances futures sont recalculées

#### Scenario: Changement du jour de prélèvement

- **GIVEN** une charge fixe mensuelle avec des échéances futures `PENDING`
- **WHEN** l'utilisateur porte le jour de prélèvement au 5
- **THEN** les échéances futures `PENDING` non rapprochées sont recalculées au 5 de chaque mois, et les échéances payées ou rapprochées restent inchangées

### Requirement: Lister et supprimer des charges

L'API SHALL exposer `GET /api/charges` (filtres typés) et `DELETE /api/charges/{id}`. La suppression SHALL retirer la charge et ses échéances à venir ; l'utilisateur SHALL confirmer avant toute suppression.

#### Scenario: Suppression confirmée

- **WHEN** l'utilisateur confirme la suppression d'une charge sans paiements rapprochés
- **THEN** la charge et ses échéances à venir sont retirées de la liste

#### Scenario: Suppression inexistante

- **WHEN** `DELETE /api/charges/{id}` est appelé avec un identifiant inexistant
- **THEN** la réponse est 404 lisible

### Requirement: Capital restant dû sur charge échelonnée

L'UI de détail d'une charge échelonnée SHALL afficher l'échéancier complet des échéances (dates, montants, statuts) et le capital restant dû : somme des montants des échéances non payées à date. Le restant dû SHALL diminuer au fil du rapprochement des échéances.

#### Scenario: Impôt FR en 4 prélèvements

- **GIVEN** une charge échelonnée de 4 × 312 EUR dont 2 échéances sont payées
- **WHEN** la feuille de détail s'ouvre
- **THEN** l'échéancier complet (4 lignes) est affiché
- **AND** le capital restant dû affiché est 624,00 EUR

#### Scenario: Tout payé

- **GIVEN** toutes les échéances payées
- **THEN** le restant dû affiché est 0,00

### Requirement: Pagination de la liste des charges

La liste des charges SHALL limiter l'affichage initial aux 3 premières charges et proposer « afficher les autres » qui révèle le reste par paquets de 5 (geste mobile natif, pas une barre de pages web). Les filtres (membre, type) SHALL s'appliquer avant la pagination ; changer de filtre SHALL réinitialiser la pagination au début de la liste filtrée.

#### Scenario: Quelques charges

- **GIVEN** 3 charges filtrées
- **WHEN** la liste se charge
- **THEN** les 3 charges sont affichées sans bouton « afficher les autres »

#### Scenario: Beaucoup de charges

- **GIVEN** 10 charges après filtres
- **WHEN** la liste se charge
- **THEN** 3 charges sont visibles et « afficher les autres » révèle le reste par paquets de 5

### Requirement: Sous-catégorie d'une charge

Une charge SHALL pouvoir porter une sous-catégorie optionnelle. Les catégories connues (Logement, Santé, Impôts & taxes, Assurances, Abonnements, Médias, Crédits & prêts, Transports, Alimentation, Enfants & famille, Loisirs & voyages, Épargne & prévoyance, Frais bancaires, Divers) SHALL avoir chacune une liste fermée de sous-catégories ; une sous-catégorie SHALL appartenir à la liste de sa catégorie. Une sous-catégorie vide SHALL toujours être valide. Une catégorie hors liste (charges existantes) SHALL rester lisible et modifiable, sans sous-catégorie possible. Le serveur SHALL refuser une sous-catégorie étrangère à la catégorie (422).

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
