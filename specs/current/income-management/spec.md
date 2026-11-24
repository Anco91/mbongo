# income-management Specification

## Purpose
Permettre au foyer de déclarer ses sources de revenu récurrentes et de confirmer, chaque mois, le revenu réellement perçu, sans ressaisir le salaire de zéro et sans perdre l'historique.

## Requirements

### Requirement: Déclarer une source de revenu récurrente

Le système SHALL permettre de créer, modifier et désactiver une source de revenu composée au minimum de : intitulé, montant, devise (CHF ou EUR), compte de réception, fréquence (mensuelle ou annuelle), date de début et date de fin optionnelle. Une source sans date de fin SHALL rester active indéfiniment. Une source SHALL pouvoir être désactivée sans supprimer son historique. L'étape Revenus du wizard de préparation mensuelle SHALL exposer le CRUD complet : bouton "Ajouter un revenu" ouvrant un formulaire inline, boutons "Modifier" et "Supprimer" sur chaque ligne de source existante.

#### Scenario: Salaire mensuel

- **WHEN** l'utilisateur crée la source « Salaire » de 4 400 CHF, mensuelle, sur UBS Courant, sans date de fin
- **THEN** la source est enregistrée et proposée pour chaque mois à partir de sa date de début

#### Scenario: Source désactivée

- **WHEN** l'utilisateur désactive une source de revenu
- **THEN** elle n'est plus proposée pour les mois suivants et ses revenus déjà confirmés restent visibles

#### Scenario: Devise non supportée

- **WHEN** une source est soumise avec une devise autre que CHF ou EUR
- **THEN** la création est rejetée avec un message lisible

#### Scenario: CRUD complet dans le wizard

- **GIVEN** l'utilisateur est dans l'étape Revenus du wizard pour novembre 2026
- **WHEN** il clique sur "Ajouter un revenu", remplit le formulaire (label, montant, devise, compte, fréquence), et confirme
- **THEN** la source est créée et apparaît immédiatement dans la liste avec les boutons "Modifier" et "Supprimer"

#### Scenario: Modification d'une source existante

- **GIVEN** une source "Salaire" de 4 400 CHF existe
- **WHEN** l'utilisateur clique sur "Modifier", change le montant à 4 500 CHF, et confirme
- **THEN** la source est mise à jour et le nouveau montant est reflété dans la liste

#### Scenario: Suppression d'une source

- **GIVEN** une source "Bonus" existe avec des transactions confirmées
- **WHEN** l'utilisateur clique sur "Supprimer" et confirme
- **THEN** la source est supprimée, les transactions confirmées restent avec incomeId null

### Requirement: Sources actives pour un mois donné

L'étape Revenus SHALL proposer les sources dont la période d'activité couvre le mois préparé. Une source démarrée après le mois ou terminée avant le mois SHALL ne pas être proposée.

#### Scenario: Source démarrée plus tard

- **GIVEN** une source « Allocation » qui démarre en janvier 2027
- **WHEN** l'utilisateur prépare novembre 2026
- **THEN** la source n'apparaît pas dans l'étape Revenus de novembre

#### Scenario: Source terminée

- **GIVEN** une source « Mission » terminée en octobre 2026
- **WHEN** l'utilisateur prépare novembre 2026
- **THEN** la source n'apparaît pas dans l'étape Revenus de novembre

### Requirement: Confirmer le revenu du mois

Pour chaque source active, l'étape Revenus SHALL afficher le montant attendu et permettre de confirmer ou d'ajuster le montant réellement perçu. La confirmation SHALL enregistrer une transaction positive sur le compte de réception, à une date du mois préparé, rattachée à la source. Le montant confirmé SHALL pouvoir différer du montant de la source sans modifier celle-ci.

#### Scenario: Salaire conforme

- **WHEN** l'utilisateur confirme 4 400 CHF pour la source « Salaire » de novembre 2026
- **THEN** une transaction positive de 4 400 CHF est enregistrée sur UBS Courant, rattachée à la source

#### Scenario: Salaire ajusté

- **GIVEN** une source « Salaire » attendue à 4 400 CHF
- **WHEN** l'utilisateur confirme 4 350 CHF pour novembre
- **THEN** la transaction enregistrée vaut 4 350 CHF et la source reste à 4 400 CHF pour les mois suivants

#### Scenario: Revenu ponctuel sans source

- **WHEN** l'utilisateur saisit un revenu qui n'a pas de source récurrente
- **THEN** il peut l'enregistrer comme transaction positive non rattachée

### Requirement: Pas de doublon de revenu mensuel

Le système SHALL garantir qu'une source de revenu produit au plus une transaction confirmée par mois. Rejouer la confirmation d'un même mois SHALL mettre à jour la transaction existante, jamais en créer une seconde.

#### Scenario: Double confirmation

- **WHEN** l'utilisateur confirme deux fois « Salaire » pour novembre 2026
- **THEN** une seule transaction rattachée existe pour ce couple source/mois, avec le dernier montant confirmé

#### Scenario: Reprise du parcours

- **WHEN** l'utilisateur quitte le parcours après avoir confirmé un revenu puis le rouvre
- **THEN** le revenu apparaît confirmé et aucune nouvelle transaction n'est proposée

### Requirement: Historique et suppression

La suppression d'une transaction de revenu SHALL laisser la source intacte. La suppression d'une source SHALL laisser les transactions déjà confirmées, en retirant seulement leur rattachement. L'historique du mois SHALL rester consultable dans les totaux et le Sankey.

#### Scenario: Suppression d'une source

- **GIVEN** une source « Salaire » avec trois mois confirmés
- **WHEN** l'utilisateur supprime la source
- **THEN** les trois transactions restent présentes comme revenus non rattachés

#### Scenario: Suppression d'un revenu confirmé

- **WHEN** l'utilisateur supprime une transaction de revenu rattachée
- **THEN** la source reste active et le revenu du mois est considéré comme non confirmé

### Requirement: Revenus à lier

L'écran `/incomes/unmatched` SHALL lister chaque entrée d'argent positive sans source de revenu, avec ses sources possibles dans l'ordre du calcul de rapprochement, le montant prévu et l'écart (« Montant conforme » si nul). Le bouton « Lier » SHALL rattacher la transaction à la source pour le mois proposé, puis retirer la ligne et actualiser le tableau de bord. En cas de refus du serveur, la ligne SHALL rester et afficher le message.

#### Scenario: Lien réussi

- **GIVEN** un salaire reçu sans source et une proposition « Salaire »
- **WHEN** l'utilisateur clique sur « Lier »
- **THEN** la ligne disparaît et le revenu du mois est confirmé

#### Scenario: Aucune source possible

- **WHEN** une entrée n'a aucune proposition
- **THEN** la ligne affiche « Aucune source de revenu possible »

#### Scenario: Rien à lier

- **WHEN** aucune entrée n'est sans source
- **THEN** l'écran affiche « Aucun revenu à lier »
