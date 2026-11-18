# household-members Specification (delta)

## MODIFIED Requirements

### Requirement: Lister les membres du foyer

L'API SHALL exposer `GET /api/members` qui retourne la liste des membres du foyer (identifiant, prénom, nom optionnel, rôle `PRIMARY`/`PARTNER`), triée par date de création. La liste alimente les filtres, l'attribution des comptes et le badge « qui paie ».

#### Scenario: Le foyer est peuplé par le seed

- **WHEN** un client appelle `GET /api/members` sur une base seedée
- **THEN** la réponse est 200 et contient au moins un membre avec rôle `PRIMARY` et un avec rôle `PARTNER`

#### Scenario: Base vide

- **WHEN** un client appelle `GET /api/members` sur une base sans membre
- **THEN** la réponse est 200 avec une liste vide (pas d'erreur)

## ADDED Requirements

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
