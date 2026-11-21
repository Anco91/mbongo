# Spec Delta

## MODIFIED Requirements

### Requirement: Ajustement des comptes

L'étape Comptes SHALL lister les comptes actifs et permettre d'ajouter un compte ou d'ajuster le solde d'ouverture et le découvert autorisé d'un compte existant. Les comptes clos SHALL ne pas être proposés à l'ajustement. L'étape Comptes du wizard SHALL exposer : bouton "Ajouter un compte" ouvrant le formulaire `AccountCreateForm` inline, boutons "Modifier" et "Supprimer" sur chaque ligne de compte actif. La modification SHALL permettre d'ajuster le solde d'ouverture et le découvert autorisé. La suppression SHALL suivre les règles de `account-management` (compte vierge supprimé, compte avec données cloturé).

#### Scenario: Compte oublié

- **WHEN** l'utilisateur crée un compte depuis l'étape Comptes
- **THEN** le compte est disponible immédiatement dans le reste du parcours et sur le dashboard

#### Scenario: Correction du solde d'ouverture

- **WHEN** l'utilisateur corrige le solde d'ouverture d'un compte actif
- **THEN** le patrimoine consolidé et le récapitulatif reflètent la correction

#### Scenario: Création de compte depuis le wizard

- **GIVEN** l'utilisateur est dans l'étape Comptes du wizard
- **WHEN** il clique sur "Ajouter un compte", remplit le formulaire, et confirme
- **THEN** le compte est créé et apparaît immédiatement dans la liste avec les boutons "Modifier" et "Supprimer"

#### Scenario: Ajustement du solde d'ouverture

- **GIVEN** un compte "UBS Courant" avec solde 1 500 CHF
- **WHEN** l'utilisateur clique sur "Modifier", change le solde à 1 800 CHF, et confirme
- **THEN** le solde d'ouverture est mis à jour et le patrimoine consolidé reflète la correction

#### Scenario: Suppression d'un compte vierge

- **GIVEN** un compte créé par erreur sans transactions
- **WHEN** l'utilisateur clique sur "Supprimer" et confirme
- **THEN** le compte est supprimé définitivement

#### Scenario: Layout correct des boutons

- **GIVEN** l'étape Comptes affiche une liste de comptes
- **WHEN** la liste est rendue
- **THEN** les boutons "Modifier" et "Supprimer" restent dans leur container sans déborder, même sur mobile (390px)
