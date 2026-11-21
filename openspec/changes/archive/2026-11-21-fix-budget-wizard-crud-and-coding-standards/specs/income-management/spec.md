# Spec Delta

## MODIFIED Requirements

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
