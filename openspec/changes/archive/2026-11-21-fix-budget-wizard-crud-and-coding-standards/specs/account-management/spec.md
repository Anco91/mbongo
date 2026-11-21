# Spec Delta

## MODIFIED Requirements

### Requirement: Créer un compte

L'API SHALL exposer `POST /api/accounts` acceptant : nom (requis), banque (optionnel), devise `CHF`/`EUR`, type (`CURRENT`/`CREDIT_CARD`/`JOINT`/`SAVINGS`), propriétaire (id de membre optionnel), découvert autorisé (défaut 0), carte à débit différé (défaut false), jour de facturation (optionnel), compte de règlement (`linkedAccountId`, requis uniquement pour `CREDIT_CARD`), solde d'ouverture (défaut 0). L'UI SHALL proposer une page de création dédiée avec ces champs, le sélecteur de propriétaire alimenté par la liste des membres et, pour une carte de crédit, le sélecteur « Prélèvement sur » alimenté par les comptes actifs. Le composant `AccountCreateForm` SHALL accepter une prop optionnelle `onSaved?: (account: Account) => void` pour permettre son intégration inline dans le wizard de préparation mensuelle (mode "inline" vs mode "page dédiée").

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

#### Scenario: Intégration inline dans le wizard

- **GIVEN** le wizard de préparation mensuelle affiche l'étape Comptes
- **WHEN** l'utilisateur clique sur "Ajouter un compte"
- **THEN** le formulaire `AccountCreateForm` s'affiche inline (pas de navigation) avec la prop `onSaved` qui ferme le panneau et rafraîchit la liste

#### Scenario: Mode page dédiée inchangé

- **GIVEN** l'utilisateur est sur la page `/accounts/new`
- **WHEN** il crée un compte
- **THEN** le comportement est inchangé (redirect vers la liste après succès)
