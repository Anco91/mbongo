# account-management Specification

## Purpose

Gérer les comptes bancaires du foyer (CHF/EUR, courant/épargne/carte de crédit, actif/clos) et les rendre visibles : API complète (le service existe) et UI de liste/création. Socle de la consolidation F1 du cahier des charges.

## Requirements

### Requirement: Lister les comptes

L'API SHALL exposer `GET /api/accounts` (filtre validé par zod : devise, statut, type, propriétaire). L'UI comptes SHALL afficher chaque compte avec son nom, sa banque, sa devise, son type et son solde calculé (solde d'ouverture + somme des transactions signées) — les comptes clos n'apparaissent pas dans la vue courante.

#### Scenario: Liste des comptes actifs

- **WHEN** l'utilisateur ouvre la page Comptes
- **THEN** tous les comptes au statut `ACTIVE` sont affichés avec leur solde calculé et leur devise d'origine

#### Scenario: Compte clos masqué de la vue courante

- **WHEN** un compte a le statut `CLOSED`
- **THEN** il n'apparaît plus dans la liste des comptes de l'UI (l'historique reste conservé en base)

#### Scenario: Requête invalide rejetée

- **WHEN** `GET /api/accounts?currency=USD` est appelé (devise hors CHF/EUR)
- **THEN** la réponse est 400 avec un message de validation lisible

### Requirement: Créer un compte

L'API SHALL exposer `POST /api/accounts` acceptant : nom (requis), banque (optionnel), devise `CHF`/`EUR`, type (`CURRENT`/`CREDIT_CARD`/`JOINT`/`SAVINGS`), propriétaire (id de membre optionnel), découvert autorisé (défaut 0), carte à débit différé (défaut false), jour de facturation (optionnel), compte de règlement (`linkedAccountId`, requis uniquement pour `CREDIT_CARD`), solde d'ouverture (défaut 0). L'UI SHALL proposer une page de création dédiée avec ces champs, le sélecteur de propriétaire alimenté par la liste des membres et, pour une carte de crédit, le sélecteur « Prélèvement sur » alimenté par les comptes actifs.

#### Scenario: Création d'un compte courant CHF

- **WHEN** l'utilisateur crée un compte "UBS Courant", devise CHF, type `CURRENT`, propriétaire Anco
- **THEN** le compte est créé au statut `ACTIVE`, visible immédiatement dans la liste avec son solde d'ouverture

#### Scenario: Compte en devise inconnue rejeté

- **WHEN** la création est soumise avec une devise hors CHF/EUR
- **THEN** la réponse est 400 (validation zod) et le compte n'est pas créé

#### Scenario: Propriétaire inconnu rejeté lisiblement

- **WHEN** la création est soumise avec un identifiant de membre inexistant
- **THEN** la réponse est 422 avec un message "membre inconnu" — pas d'erreur 500

#### Scenario: Carte de crédit avec compte de règlement

- **WHEN** l'utilisateur crée "Carte UBS (crédit)", type `CREDIT_CARD`, avec le compte de règlement "UBS Courant"
- **THEN** la carte est créée avec le lien de règlement vers UBS Courant

### Requirement: Invariants du compte de règlement

Le champ `linkedAccountId` SHALL être refusé pour tout type de compte autre que `CREDIT_CARD` (400). Pour une carte de crédit, un `linkedAccountId` inexistant SHALL être rejeté en 422 lisible ("compte de règlement inconnu"). Un compte à débit différé (`deferredCard`) SHALL être traité comme son propre compte de règlement sans champ dédié.

#### Scenario: Lien sur compte courant refusé

- **WHEN** la création d'un compte `CURRENT` est soumise avec un `linkedAccountId` renseigné
- **THEN** la réponse est 400 et aucune valeur n'est persistée

#### Scenario: Compte de règlement inconnu rejeté lisiblement

- **WHEN** la création d'une carte de crédit est soumise avec un identifiant de compte de règlement inexistant
- **THEN** la réponse est 422 avec un message "compte de règlement inconnu" — pas d'erreur 500

### Requirement: Ancre de solde manuelle (snapshot)

L'API SHALL exposer `POST /api/snapshots` enregistrant le solde réel déclaré d'un compte à une date t (compte, date, solde, note optionnelle). Un compte inconnu SHALL être rejeté en 422 lisible.

#### Scenario: Ancre un solde réel

- **WHEN** l'utilisateur enregistre "solde UBS Courant = 4 230,50 CHF au 12/11"
- **THEN** le snapshot est créé et rattaché au compte avec sa date

#### Scenario: Compte inconnu rejeté

- **WHEN** un snapshot est créé pour un identifiant de compte inexistant
- **THEN** la réponse est 422 lisible (pas de 500)

### Requirement: Clôture et suppression d'un compte

Un compte SHALL pouvoir être clos (statut `CLOSED` + date de clôture) sans suppression de données. Un compte vierge (aucune transaction, snapshot, transfert, charge) SHALL pouvoir être supprimé définitivement ; un compte avec données SHALL être refusé en 409 avec l'invitation à le clôturer.

#### Scenario: Clôture d'un compte avec historique

- **WHEN** l'utilisateur clôture le compte BNP Joint (avec transactions)
- **THEN** le compte passe au statut `CLOSED` avec une date de clôture et toutes ses données sont conservées

#### Scenario: Suppression d'un compte vierge

- **WHEN** l'utilisateur supprime un compte créé par erreur, sans aucune donnée liée
- **THEN** le compte est supprimé définitivement

#### Scenario: Suppression refusée si données existantes

- **WHEN** l'utilisateur tente de supprimer un compte ayant des transactions
- **THEN** la réponse est 409 et aucune donnée n'est effacée
