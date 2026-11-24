# monthly-budget Specification

## Purpose
Donner au foyer un rituel mensuel unique pour préparer le budget du mois : revenus, charges, comptes, puis récapitulatif, avec un état « préparé » qui déclenche l'invitation au premier lancement et à chaque nouveau mois.

## Requirements

### Requirement: État de préparation d'un mois

Le système SHALL retenir, pour chaque mois calendaire, s'il a été préparé par le foyer. Un mois sans état préparé SHALL être considéré comme « à préparer ». L'état SHALL être porté par une clé mensuelle stable (`AAAA-MM`) et être idempotent : préparer deux fois le même mois ne SHALL pas créer de doublon.

#### Scenario: Mois jamais préparé

- **WHEN** le foyer ouvre l'application en novembre 2026 et qu'aucun état n'existe pour `2026-11`
- **THEN** le mois de novembre est présenté comme « à préparer »

#### Scenario: Marquage idempotent

- **WHEN** l'utilisateur termine la préparation de novembre 2026 deux fois
- **THEN** un seul état préparé existe pour `2026-11`, avec la date de la dernière préparation

### Requirement: Invitation à préparer le mois courant

L'UI SHALL afficher sur le dashboard une invitation à préparer le mois courant tant que ce mois n'est pas marqué préparé. L'invitation SHALL nommer le mois (« Budget de novembre ») et proposer une action principale « Préparer le mois ». Une fois le mois préparé, l'invitation SHALL disparaître et laisser place à un accès discret à la modification.

#### Scenario: Invitation visible

- **WHEN** le dashboard s'ouvre sur un mois non préparé
- **THEN** la carte « Budget de novembre — à préparer » est visible avec le bouton « Préparer le mois »

#### Scenario: Invitation retirée après préparation

- **WHEN** l'utilisateur termine la préparation du mois courant
- **THEN** la carte d'invitation disparaît du dashboard et un lien « Modifier » reste accessible

#### Scenario: Mois passé non préparé

- **WHEN** l'utilisateur consulte un mois passé qui n'a pas été préparé
- **THEN** l'invitation ne s'affiche pas sur le dashboard du mois courant ; le mois passé reste consultable

### Requirement: Premier lancement sans compte

Lorsque le foyer ne possède aucun compte actif, le système SHALL orienter l'utilisateur vers la création du foyer et du premier compte avant d'ouvrir le parcours de budget. Le parcours de budget SHALL rester accessible dès qu'au moins un compte actif existe.

#### Scenario: Foyer vide

- **WHEN** l'application s'ouvre sur une base sans compte
- **THEN** l'écran propose de créer le premier compte et n'ouvre pas directement les étapes du budget

#### Scenario: Foyer avec un compte

- **WHEN** l'application s'ouvre avec au moins un compte actif
- **THEN** le parcours « Préparer le mois » est disponible

### Requirement: Parcours guidé en quatre étapes

Le parcours SHALL présenter quatre étapes ordonnées : Revenus, Charges, Comptes, Récapitulatif. L'utilisateur SHALL pouvoir avancer, revenir et quitter à tout moment ; la reprise SHALL conserver les données déjà enregistrées. Chaque étape SHALL écrire directement dans les données du foyer, sans brouillon séparé à appliquer.

#### Scenario: Progression complète

- **WHEN** l'utilisateur ouvre « Préparer le mois » pour novembre 2026
- **THEN** les étapes Revenus, Charges, Comptes et Récapitulatif sont proposées dans cet ordre

#### Scenario: Reprise après sortie

- **WHEN** l'utilisateur quitte après avoir modifié un revenu et revient sur le parcours du même mois
- **THEN** le revenu modifié est toujours présent et l'étape reprend sur les données à jour

#### Scenario: Aucune étape obligatoire

- **WHEN** l'utilisateur traverse les étapes sans rien modifier
- **THEN** il peut atteindre le récapitulatif et terminer la préparation

### Requirement: Revue des charges non expirées

L'étape Charges SHALL lister les charges du foyer qui ne sont pas expirées à la date du mois préparé, y compris les charges fixes sans date de fin. Pour chaque charge, l'utilisateur SHALL pouvoir ajuster le montant, supprimer la charge, ou en ajouter une nouvelle. Un ajustement de montant SHALL recalculer les échéances futures non payées et préserver les échéances payées.

#### Scenario: Charge fixe sans date de fin

- **GIVEN** une charge fixe récurrente de 1 850 CHF sans date de fin
- **WHEN** l'utilisateur prépare un mois futur
- **THEN** la charge apparaît dans l'étape Charges

#### Scenario: Charge expirée masquée

- **GIVEN** une charge temporaire dont la date de fin précède le mois préparé
- **WHEN** l'utilisateur ouvre l'étape Charges
- **THEN** la charge n'apparaît pas dans la liste à revoir

#### Scenario: Ajustement du loyer

- **WHEN** l'utilisateur porte une charge fixe de 1 850 à 1 900 CHF depuis l'étape Charges
- **THEN** les échéances futures non payées passent à 1 900 CHF et les échéances payées restent inchangées

#### Scenario: Suppression depuis le parcours

- **WHEN** l'utilisateur supprime une charge depuis l'étape Charges et confirme
- **THEN** la charge et ses échéances à venir sont retirées, et le récapitulatif du mois est recalculé

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

### Requirement: Récapitulatif du mois préparé

Le récapitulatif SHALL afficher les revenus du mois, le total des échéances du mois hors provisions, le total des provisions, le total des charges du mois et le reste à vivre (revenus − charges). Les revenus SHALL être calculés depuis les transactions positives du mois hors transferts. Les échéances du mois SHALL être requêtées à la source pour le mois préparé. Le total des charges SHALL réutiliser le calcul de budget mensuel existant, sans double comptage des provisions.

#### Scenario: Calcul du reste à vivre

- **GIVEN** 4 400 CHF de revenus, 1 850 CHF d'échéances et 27,92 CHF de provisions sur le mois
- **WHEN** l'utilisateur atteint le récapitulatif
- **THEN** les charges affichées sont 1 877,92 CHF et le reste à vivre est 2 522,08 CHF

#### Scenario: Revenu non saisi

- **GIVEN** aucune transaction positive sur le mois
- **WHEN** l'utilisateur atteint le récapitulatif
- **THEN** les revenus affichent 0,00 et le parcours invite à revenir à l'étape Revenus sans bloquer la sortie

#### Scenario: Provision non doublée

- **GIVEN** une charge annuelle provisionnée dont la facture tombe hors du mois préparé
- **WHEN** le récapitulatif est calculé
- **THEN** seule la provision mensuelle est comptée dans les charges

#### Scenario: Charges créées pendant le parcours

- **GIVEN** une charge fixe créée à l'étape Charges du parcours
- **WHEN** l'utilisateur atteint le récapitulatif
- **THEN** le total des charges du mois inclut l'échéance de cette charge et affiche un total supérieur à 0

#### Scenario: Revenu d'une source démarrée un mois précédent

- **GIVEN** un revenu dont la source a démarré le mois précédent et une transaction positive confirmée ce mois
- **WHEN** l'utilisateur atteint le récapitulatif
- **THEN** le revenu du mois est affiché depuis la transaction du mois

#### Scenario: Décomposition échéances et provisions

- **WHEN** le récapitulatif est calculé
- **THEN** le total des échéances hors provisions et le total des provisions sont affichés séparément

### Requirement: Terminer et rouvrir la préparation

Le récapitulatif SHALL proposer l'action principale « Terminer ». Terminer SHALL marquer le mois préparé puis ramener l'utilisateur au dashboard. L'utilisateur SHALL pouvoir rouvrir un mois préparé pour le modifier sans perdre son état ni dupliquer ses revenus.

#### Scenario: Fin de préparation

- **WHEN** l'utilisateur appuie sur « Terminer » au récapitulatif
- **THEN** le mois est marqué préparé et le dashboard affiche le budget du mois sans invitation

#### Scenario: Réouverture

- **WHEN** l'utilisateur rouvre un mois déjà préparé
- **THEN** les étapes s'ouvrent sur les données existantes et terminer à nouveau ne crée aucun doublon
