# household-members Specification

## Purpose

Identifier les membres du foyer pour rattacher les comptes et charges à une personne. Lecture seule en M1 : le foyer est créé par seed (Anco, Épouse) ; la création/modification de membres est reportée à la vue foyer (F8, M3).

## Requirements

### Requirement: Lister les membres du foyer

L'API SHALL exposer `GET /api/members` qui retourne la liste des membres du foyer (identifiant, prénom, nom optionnel, rôle `PRIMARY`/`PARTNER`), triée par date de création. La liste alimente les filtres, l'attribution des comptes et le badge « qui paie ».

#### Scenario: Le foyer est peuplé par le seed

- **WHEN** un client appelle `GET /api/members` sur une base seedée
- **THEN** la réponse est 200 et contient au moins un membre avec rôle `PRIMARY` et un avec rôle `PARTNER`

#### Scenario: Base vide

- **WHEN** un client appelle `GET /api/members` sur une base sans membre
- **THEN** la réponse est 200 avec une liste vide (pas d'erreur)

### Requirement: Filtrage des vues par membre ou couple

L'UI des vues comptes et charges SHALL proposer un filtre par membre du foyer et par couple (« foyer ») : sélectionner un membre limite la liste à ses éléments (propriétaire du compte, débiteur de la charge) ; « foyer » rétablit la liste complète. Le filtre SHALL être persistant pendant la navigation de la vue en cours.

#### Scenario: Filtre sur un membre

- **GIVEN** des comptes appartenant à Anco, à l'épouse et au couple
- **WHEN** l'utilisateur filtre sur Anco
- **THEN** seuls les comptes d'Anco sont listés

#### Scenario: Retour au foyer

- **GIVEN** un filtre membre actif
- **WHEN** l'utilisateur sélectionne « foyer »
- **THEN** la liste complète réapparaît

### Requirement: Données nécessaires aux filtres

L'API SHALL fournir la liste des membres avec leur identifiant, prénom et rôle pour alimenter les filtres. Aucune information supplémentaire sur les membres SHALL être nécessaire.

#### Scenario: Alimentation du filtre

- **GIVEN** le seed du foyer
- **WHEN** l'UI charge les options de filtre
- **THEN** les options sont « foyer », puis un membre par membre (prénom affiché)

### Requirement: CRUD des membres (vue foyer)

L'UI SHALL exposer une vue foyer (`/household`) qui liste les membres et permet de créer, modifier (nom, prénom, rôle) et supprimer un membre. La suppression SHALL être confirmée explicitement ; un membre supprimé SHALL libérer ses comptes (attribution retirée) sans les supprimer. Aucun membre « Anco / Épouse » codé en dur SHALL subsister dans l'UI.

#### Scenario: Créer un membre

- **WHEN** l'utilisateur crée un membre avec prénom, nom et rôle
- **THEN** le membre apparaît dans la liste et dans les filtres des vues

#### Scenario: Modifier un membre

- **WHEN** l'utilisateur renomme un membre
- **THEN** le nouveau nom s'affiche partout où le prénom était utilisé (filtres, badge qui-paie)

#### Scenario: Supprimer un membre

- **GIVEN** un membre propriétaire d'un compte
- **WHEN** l'utilisateur supprime le membre après confirmation
- **THEN** le compte reste intact et son attribution devient « Foyer »

### Requirement: Badge d'attribution « qui paie »

Les cards des charges, des échéances du dashboard, des comptes et des provisions SHALL afficher un badge d'attribution dérivé de `account.memberId` : le prénom du membre propriétaire, ou « Foyer » quand le compte est null ou que le membre n'existe plus. Le badge SHALL être réutilisé à l'identique sur toutes les vues (une seule source d'affichage).

#### Scenario: Compte attribué

- **GIVEN** une charge débitée sur un compte attribué à un membre
- **WHEN** la card s'affiche
- **THEN** le badge porte le prénom du membre

#### Scenario: Compte commun

- **GIVEN** une charge débitée sur un compte sans membre
- **WHEN** la card s'affiche
- **THEN** le badge porte « Foyer »
