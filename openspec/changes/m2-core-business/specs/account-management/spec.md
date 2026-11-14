# Spec Delta — account-management

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Invariants du compte de règlement

Le champ `linkedAccountId` SHALL être refusé pour tout type de compte autre que `CREDIT_CARD` (400). Pour une carte de crédit, un `linkedAccountId` inexistant SHALL être rejeté en 422 lisible ("compte de règlement inconnu"). Un compte à débit différé (`deferredCard`) SHALL être traité comme son propre compte de règlement sans champ dédié.

#### Scenario: Lien sur compte courant refusé

- **WHEN** la création d'un compte `CURRENT` est soumise avec un `linkedAccountId` renseigné
- **THEN** la réponse est 400 et aucune valeur n'est persistée

#### Scenario: Compte de règlement inconnu rejeté lisiblement

- **WHEN** la création d'une carte de crédit est soumise avec un identifiant de compte de règlement inexistant
- **THEN** la réponse est 422 avec un message "compte de règlement inconnu" — pas d'erreur 500
