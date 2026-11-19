# Spec Delta

## MODIFIED Requirements

### Requirement: Lister les membres du foyer

L'API SHALL exposer `GET /api/members` qui retourne la liste des membres du foyer (identifiant, prénom, nom optionnel), triée par date de création. La liste alimente les filtres, l'attribution des comptes et le badge « qui paie ».

#### Scenario: Le foyer est peuplé par le seed

- **WHEN** un client appelle `GET /api/members` sur une base seedée
- **THEN** la réponse est 200 et contient les membres du foyer avec leur prénom, sans champ de rôle

#### Scenario: Base vide

- **WHEN** un client appelle `GET /api/members` sur une base sans membre
- **THEN** la réponse est 200 avec une liste vide (pas d'erreur)

### Requirement: Données nécessaires aux filtres

L'API SHALL fournir la liste des membres avec leur identifiant et leur prénom pour alimenter les filtres. Aucune information supplémentaire sur les membres SHALL être nécessaire.

#### Scenario: Alimentation du filtre

- **GIVEN** le seed du foyer
- **WHEN** l'UI charge les options de filtre
- **THEN** les options sont « foyer », puis un membre par membre (prénom affiché)

### Requirement: CRUD des membres (vue foyer)

L'UI SHALL exposer une vue foyer (`/household`) qui liste les membres et permet de créer, modifier (prénom, nom) et supprimer un membre. La suppression SHALL être confirmée explicitement ; un membre supprimé SHALL libérer ses comptes (attribution retirée) sans les supprimer. Aucun membre « Anco / Épouse » codé en dur SHALL subsister dans l'UI.

#### Scenario: Créer un membre

- **WHEN** l'utilisateur crée un membre avec prénom et nom
- **THEN** le membre apparaît dans la liste et dans les filtres des vues

#### Scenario: Modifier un membre

- **WHEN** l'utilisateur renomme un membre
- **THEN** le nouveau nom s'affiche partout où le prénom était utilisé (filtres, badge qui-paie)

#### Scenario: Supprimer un membre

- **GIVEN** un membre propriétaire d'un compte
- **WHEN** l'utilisateur supprime le membre après confirmation
- **THEN** le compte reste intact et son attribution devient « Foyer »

## ADDED Requirements

### Requirement: Membres du foyer égaux dans l'interface

L'interface SHALL traiter tous les membres du foyer sur le même plan : aucun rôle, statut de titulaire ou de partenaire ne SHALL être demandé, stocké ou affiché. Le prénom et le nom SHALL suffire à identifier un membre.

#### Scenario: Formulaire sans rôle

- **WHEN** l'utilisateur crée ou modifie un membre
- **THEN** le formulaire ne propose que prénom et nom, sans sélecteur de rôle

#### Scenario: Liste sans étiquette de rôle

- **GIVEN** plusieurs membres du foyer
- **WHEN** la vue foyer s'affiche
- **THEN** chaque membre est présenté par son prénom et son nom, sans mention « Titulaire » ni « Partenaire »

#### Scenario: Contrat API sans rôle

- **WHEN** un client lit ou écrit un membre via l'API
- **THEN** aucun champ `role` n'est attendu, retourné ni validé
