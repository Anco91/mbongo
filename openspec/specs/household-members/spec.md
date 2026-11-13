# household-members Specification

## Purpose

Identifier les membres du foyer pour rattacher les comptes et charges à une personne. Lecture seule en M1 : le foyer est créé par seed (Anco, Épouse) ; la création/modification de membres est reportée à la vue foyer (F8, M3).

## Requirements

### Requirement: Lister les membres du foyer

L'API SHALL exposer `GET /api/members` qui retourne la liste des membres du foyer (identifiant, prénom, rôle `PRIMARY`/`PARTNER`), triée par date de création. La liste est requise par l'UI de création de compte pour rattacher un compte à son propriétaire.

#### Scenario: Le foyer est peuplé par le seed

- **WHEN** un client appelle `GET /api/members` sur une base seedée
- **THEN** la réponse est 200 et contient au moins un membre avec rôle `PRIMARY` et un avec rôle `PARTNER`

#### Scenario: Base vide

- **WHEN** un client appelle `GET /api/members` sur une base sans membre
- **THEN** la réponse est 200 avec une liste vide (pas d'erreur)
