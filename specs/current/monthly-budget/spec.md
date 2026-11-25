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

L'étape Comptes SHALL lister les comptes actifs et permettre d'ajouter un compte ou d'ajuster le solde de départ du mois préparé d'un compte existant (voir « Solde de départ du mois »). Les comptes clos SHALL ne pas être proposés à l'ajustement. L'étape Comptes du wizard SHALL exposer : bouton "Ajouter un compte" ouvrant le formulaire `AccountCreateForm` inline, boutons "Modifier" et "Supprimer" sur chaque ligne de compte actif. La modification SHALL permettre d'ajuster le solde de départ du mois, sans toucher au solde d'ouverture du compte. La suppression SHALL suivre les règles de `account-management` (compte vierge supprimé, compte avec données cloturé).

#### Scenario: Compte oublié

- **WHEN** l'utilisateur crée un compte depuis l'étape Comptes
- **THEN** le compte est disponible immédiatement dans le reste du parcours et sur le dashboard

#### Scenario: Correction du solde de départ

- **WHEN** l'utilisateur corrige le solde de départ d'un compte actif pour le mois préparé
- **THEN** la valeur est enregistrée pour ce mois et ce compte, et le solde d'ouverture du compte reste inchangé

#### Scenario: Création de compte depuis le wizard

- **GIVEN** l'utilisateur est dans l'étape Comptes du wizard
- **WHEN** il clique sur "Ajouter un compte", remplit le formulaire, et confirme
- **THEN** le compte est créé et apparaît immédiatement dans la liste avec les boutons "Modifier" et "Supprimer"

#### Scenario: Ajustement du solde de départ

- **GIVEN** un compte "UBS Courant" dont le solde de départ suggéré du mois est 1 500 CHF
- **WHEN** l'utilisateur clique sur "Ajuster", change le solde à 1 800 CHF, et confirme
- **THEN** 1 800 CHF est enregistré comme solde de départ de ce mois pour ce compte et le solde d'ouverture reste inchangé

#### Scenario: Suppression d'un compte vierge

- **GIVEN** un compte créé par erreur sans transactions
- **WHEN** l'utilisateur clique sur "Supprimer" et confirme
- **THEN** le compte est supprimé définitivement

#### Scenario: Layout correct des boutons

- **GIVEN** l'étape Comptes affiche une liste de comptes
- **WHEN** la liste est rendue
- **THEN** les boutons "Modifier" et "Supprimer" restent dans leur container sans déborder, même sur mobile (390px)

### Requirement: Solde de départ du mois

Le système SHALL pouvoir enregistrer, pour un couple (mois `AAAA-MM`, compte), un solde de départ. L'enregistrement SHALL être idempotent : enregistrer deux fois le même couple laisse une seule valeur. L'étape Comptes SHALL afficher pour chaque compte actif la valeur enregistrée si elle existe, sinon la suggestion (fin du mois précédent, découvert de carte à débit différé non reporté). Rien SHALL être enregistré à l'ouverture de l'étape ni à la lecture ; seule une confirmation de l'utilisateur écrit. Le solde est exprimé avec au plus deux décimales et peut être négatif. Le solde d'ouverture du compte SHALL ne pas être modifié par la préparation.

#### Scenario: Valeur enregistrée prioritaire

- **GIVEN** un solde de départ de 1 800 CHF enregistré pour `2026-12` et un compte dont la suggestion est 1 500 CHF
- **WHEN** l'utilisateur ouvre l'étape Comptes de `2026-12`
- **THEN** 1 800 CHF est affiché

#### Scenario: Suggestion par défaut

- **GIVEN** aucun solde de départ enregistré pour `2026-12`
- **WHEN** l'utilisateur ouvre l'étape Comptes de `2026-12`
- **THEN** la suggestion est affichée et rien n'est enregistré

#### Scenario: Solde d'ouverture intact

- **WHEN** l'utilisateur ajuste le solde de départ d'un mois
- **THEN** le solde d'ouverture du compte et les autres mois sont inchangés

#### Scenario: Mois sans valeur

- **WHEN** les soldes de départ d'un mois sans enregistrement sont lus
- **THEN** le résultat est une liste vide, pas une erreur

#### Scenario: Compte inconnu

- **WHEN** l'enregistrement cible un compte inexistant
- **THEN** il est refusé avec une erreur « introuvable » et rien n'est écrit

### Requirement: Solde de départ et projection du dashboard

Pour un mois courant ou futur, le solde projeté d'un compte actif qui a un solde de départ enregistré SHALL être égal à ce solde de départ plus les flux datés dans ce mois (transactions, revenus attendus non confirmés, échéances en attente, jambe cible manquante d'un virement estimé, facturation de carte). Les flux des mois précédents SHALL ne pas être comptés : ils sont déjà dans le solde de départ saisi. Un compte sans solde de départ enregistré, un mois passé, un compte clos ou inconnu SHALL garder le calcul réel actuel. La suggestion de départ du mois suivant SHALL tenir compte du départ enregistré du mois précédent.

#### Scenario: Compte ancré

- **GIVEN** un solde de départ de 1 000 CHF enregistré en novembre pour un compte avec 30 CHF et 1 200 CHF d'échéances en attente ce mois
- **WHEN** le dashboard projette la fin de novembre
- **THEN** le solde projeté du compte est −230 CHF

#### Scenario: Retards déjà dans le départ

- **GIVEN** un loyer en retard d'octobre et un solde de départ enregistré en novembre
- **WHEN** le dashboard projette la fin de novembre
- **THEN** le loyer d'octobre n'est pas déduit une seconde fois

#### Scenario: Sans solde de départ

- **WHEN** aucun solde de départ n'est enregistré pour le compte
- **THEN** la projection part du solde réel du jour, comme avant

#### Scenario: Mois passé

- **WHEN** le dashboard affiche un mois passé
- **THEN** le solde réel en fin de mois est affiché, le solde de départ enregistré est ignoré

### Requirement: Récapitulatif du mois préparé

Le récapitulatif SHALL afficher les revenus du mois, le total des échéances du mois hors provisions, le total des provisions, le total des charges du mois et le « Reste à vivre (budget) » (revenus − charges ; distinct du « Reste à vivre (comptes) » du dashboard). Les revenus SHALL être les revenus attendus du mois : pour chaque source de revenu active due dans le mois, le montant confirmé pour ce mois s'il existe, sinon le montant prévu de la source (jamais les deux). Les transactions positives sans lien à une source ne SHALL pas être comptées. La tuile se nomme « Revenus prévus ». Les échéances du mois SHALL être requêtées à la source pour le mois préparé. Le total des charges SHALL réutiliser le calcul de budget mensuel existant, sans double comptage des provisions. Les paiements annulés (`CANCELLED`) ou échoués (`FAILED`) SHALL ne pas compter dans les charges. Une provision SHALL ne compter que dans les mois compris entre le début et la fin de sa charge (mois de la date de fin inclus), et SHALL être convertie en EUR au taux du foyer quand la charge est en CHF. Pour un même mois, le total des charges du budget, du Sankey et du donut SHALL être identique.

#### Scenario: Calcul du reste à vivre

- **GIVEN** 4 400 CHF de revenus, 1 850 CHF d'échéances et 27,92 CHF de provisions sur le mois
- **WHEN** l'utilisateur atteint le récapitulatif
- **THEN** les charges affichées sont 1 877,92 CHF et le reste à vivre est 2 522,08 CHF

#### Scenario: Revenu non confirmé

- **GIVEN** une source de revenu active de 6 600 CHF due en novembre, sans confirmation
- **WHEN** l'utilisateur atteint le récapitulatif
- **THEN** « Revenus prévus » affiche 6 600,00 et le reste à vivre est calculé sur ce montant

#### Scenario: Aucun revenu attendu

- **GIVEN** aucune source de revenu active due sur le mois
- **WHEN** l'utilisateur atteint le récapitulatif
- **THEN** les revenus affichent 0,00 et le parcours invite à revenir à l'étape Revenus sans bloquer la sortie

#### Scenario: Provision non doublée

- **GIVEN** une charge annuelle provisionnée dont la facture tombe hors du mois préparé
- **WHEN** le récapitulatif est calculé
- **THEN** seule la provision mensuelle est comptée dans les charges

#### Scenario: Provision bornée par les dates de la charge

- **GIVEN** une charge provisionnée qui débute en septembre 2026 et se termine le 31 décembre 2026
- **WHEN** le budget d'août 2026, de décembre 2026 puis de janvier 2027 est calculé
- **THEN** la provision est absente en août 2026 et en janvier 2027, et présente en décembre 2026

#### Scenario: Provision en CHF convertie

- **GIVEN** une charge provisionnée de 335 CHF
- **WHEN** le budget est calculé avec un taux de change
- **THEN** la provision mensuelle est la somme convertie en EUR divisée par 12 et arrondie au centime (29,31 pour 351,75 EUR)

#### Scenario: Paiement annulé

- **GIVEN** un paiement `CANCELLED` ou `FAILED` dans le mois
- **WHEN** le budget du mois est calculé
- **THEN** ce paiement n'entre pas dans le total des charges

#### Scenario: Charges créées pendant le parcours

- **GIVEN** une charge fixe créée à l'étape Charges du parcours
- **WHEN** l'utilisateur atteint le récapitulatif
- **THEN** le total des charges du mois inclut l'échéance de cette charge et affiche un total supérieur à 0

#### Scenario: Revenu confirmé à un autre montant

- **GIVEN** une source de 6 600 CHF confirmée pour le mois à 6 700 CHF
- **WHEN** l'utilisateur atteint le récapitulatif
- **THEN** le revenu du mois est 6 700 CHF, jamais 13 300 CHF

#### Scenario: Source ignorée

- **GIVEN** une source inactive, une source non due ce mois, ou une confirmation d'un autre mois
- **WHEN** le récapitulatif est calculé
- **THEN** ces éléments ne comptent pas dans les revenus prévus

#### Scenario: Mois déjà préparé

- **WHEN** l'utilisateur rouvre le récapitulatif d'un mois préparé
- **THEN** les mêmes revenus prévus sont affichés (jamais 0 faute de transaction)

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

### Requirement: Plan d'un mois préparé en début de mois

Le système SHALL calculer le plan d'un mois à partir des échéances attendues : les charges fixes sans date de fin sont reprises chaque mois, une charge ponctuelle n'apparaît que dans son mois, une charge terminée est absente. Une échéance déjà enregistrée SHALL être rapprochée par sa date (`AAAA-MM-JJ`) et ne SHALL pas être comptée deux fois. Le solde logique de départ d'un compte SHALL reporter un découvert ordinaire, mais un compte à débit différé qui finit le mois en négatif SHALL repartir à 0 le mois suivant.

#### Scenario: Fixe sans fin repris

- **WHEN** un mois sans échéance enregistrée est préparé et une charge fixe n'a pas de date de fin
- **THEN** cette charge figure dans les échéances attendues du mois

#### Scenario: Échéance enregistrée non doublée

- **WHEN** une échéance du mois existe déjà en base à la même date que celle attendue
- **THEN** elle est comptée une seule fois dans le total

#### Scenario: Débit différé négatif

- **WHEN** un compte à débit différé termine le mois en négatif
- **THEN** son solde logique de départ du mois suivant est 0 ; un compte ordinaire à découvert garde son solde négatif

### Requirement: Budget d'un mois futur sans report
Un mois futur affiche uniquement les revenus et charges de ce mois ; aucun solde de compte n'y est reporté. Un solde de départ enregistré ne change pas cet affichage.

#### Scenario: Pas de report d'un mois à l'autre
- **GIVEN** des revenus et charges identiques en décembre et en janvier
- **WHEN** le curseur passe de décembre à janvier
- **THEN** le reste à vivre est identique et aucun patrimoine n'augmente

