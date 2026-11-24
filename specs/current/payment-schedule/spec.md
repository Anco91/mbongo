# payment-schedule Specification

## Purpose

Donner à l'utilisateur une vue unique des échéances à venir de toutes ses charges, avec leur statut (à venir, dû, payé) et le rapprochement de chaque échéance avec la transaction réelle correspondante — le point où l'engagement prévu rencontre le mouvement bancaire constaté.

## Requirements

### Requirement: Vue échéancier des 60 prochains jours

L'UI SHALL exposer une page échéancier listant les échéances à venir (statut `PENDING`) de toutes les charges, triées par date, avec un filtre par défaut sur les 60 prochains jours. Chaque ligne SHALL afficher : intitulé de la charge, montant et devise, date d'échéance, compte débité et statut visible (à venir ou dû). La vue SHALL distinguer visuellement les échéances dont la date est passée (dû) de celles à venir.

#### Scenario: Liste des échéances à venir

- **WHEN** l'utilisateur ouvre la page échéancier
- **THEN** toutes les échéances `PENDING` des 60 prochains jours sont listées, triées par date croissante, avec charge, montant, devise, date, compte et statut

#### Scenario: Échéance en retard visible comme « dû »

- **WHEN** une échéance `PENDING` a une date d'échéance antérieure ou égale à aujourd'hui
- **THEN** elle apparaît dans la liste avec le statut « dû », sans modification de son statut stocké

### Requirement: Statut « dû » dérivé, jamais stocké

Le système SHALL dériver l'état « dû » à l'affichage et dans les calculs : une échéance est « dû » si et seulement si son statut stocké est `PENDING` et sa date d'échéance est passée ou égale au jour même. Aucun statut intermédiaire ne SHALL être ajouté en base ; les états stockés restent `PENDING`, `PAID`, `CANCELLED`, `FAILED`.

#### Scenario: Passage à dû sans écriture

- **WHEN** la date du jour atteint la date d'échéance d'un paiement `PENDING`
- **THEN** l'échéance est affichée « dû » sans aucune écriture en base, et elle redevient « à venir » si la date est repoussée

### Requirement: Rapprochement manuel échéance ↔ transaction

Le système SHALL permettre de rapprocher une échéance d'une transaction existante. La liaison est unique dans les deux sens (une échéance au plus une transaction, une transaction au plus une échéance). Rapprocher une échéance `PENDING` SHALL la passer au statut `PAID` avec sa date de paiement effective. Le rapprochement d'une échéance déjà `PAID` (cochée manuellement) SHALL rester possible. Toute tentative de liaison déjà prise SHALL être rejetée lisiblement.

#### Scenario: Rapprochement réussi

- **WHEN** l'utilisateur rapproche l'échéance « Loyer GE » de la transaction de −1 850 CHF du 01/11 sur UBS Courant
- **THEN** l'échéance passe au statut `PAID`, porte la référence de la transaction et une date de paiement effective

#### Scenario: Transaction déjà rapprochée refusée

- **WHEN** l'utilisateur tente de rapprocher une échéance avec une transaction déjà liée à une autre échéance
- **THEN** l'opération est refusée avec un message lisible et aucun statut n'est modifié

#### Scenario: Rapprochement après coche manuelle

- **WHEN** l'utilisateur rapproche une transaction d'une échéance au statut `PAID` cochée manuellement
- **THEN** la liaison est créée et la date de paiement est actualisée, sans changer le statut

### Requirement: Suggestion de transactions candidates

L'UI de rapprochement SHALL proposer une liste de transactions candidates pour une échéance donnée : même compte que la charge, montant à ± 0,01 du montant de l'échéance, date dans une fenêtre de ± 7 jours autour de la date d'échéance. L'utilisateur SHALL toujours choisir explicitement dans cette liste ; aucune liaison n'est créée automatiquement.

#### Scenario: Liste filtrée des candidates

- **WHEN** l'utilisateur ouvre le rapprochement d'une échéance de 312,00 EUR due le 28/12 sur BNP Perso
- **THEN** seules les transactions de BNP Perso entre le 21/12 et le 04/01, de 311,99 à 312,01 EUR, sont proposées, à sélectionner manuellement

### Requirement: Coche manuelle sans transaction

Le système SHALL permettre de marquer une échéance comme payée sans la rapprocher d'une transaction (paiement espèces, transaction non encore saisie). La coche SHALL passer l'échéance au statut `PAID` avec sa date de paiement, sans liaison. Le rapprochement SHALL rester possible après la coche.

#### Scenario: Échéance cochée sans transaction

- **WHEN** l'utilisateur coche l'échéance « Cadeau anniversaire » comme payée sans choisir de transaction
- **THEN** l'échéance passe au statut `PAID` avec une date de paiement et aucune transaction liée

### Requirement: Dérapprochement automatique et cohérence

La suppression d'une transaction rapprochée SHALL dérapprocher l'échéance correspondante : la liaison est retirée et l'échéance revient au statut `PENDING`, sans date de paiement. Aucune échéance ne SHALL rester `PAID` en référence à une transaction inexistante. Délier une échéance (sans supprimer la transaction) SHALL aussi la ramener au statut `PENDING`.

#### Scenario: Transaction rapprochée supprimée

- **WHEN** la transaction rapprochée de l'échéance « Loyer GE » est supprimée
- **THEN** la liaison disparaît et l'échéance revient au statut `PENDING`, sans date de paiement

#### Scenario: Dérapprochement volontaire

- **WHEN** l'utilisateur délie l'échéance de sa transaction (erreur de rapprochement)
- **THEN** l'échéance revient au statut `PENDING` et peut être rapprochée d'une autre transaction
