# bank-import Specification

## Purpose
Lire un export CSV BNP dans le navigateur pour analyser les dépenses d'un mois et ancrer le solde d'un compte. Aucune transaction n'est écrite.

## Requirements

### Requirement: Lecture locale du relevé
L'écran `/import` SHALL lire le fichier CSV déposé dans le navigateur, sans l'envoyer ni journaliser son contenu.

#### Scenario: Fichier valide
- **WHEN** l'utilisateur dépose un export BNP valide
- **THEN** le mois le plus récent ayant des dépenses est sélectionné et le sélecteur liste les mois ayant des dépenses, du plus récent au plus ancien

#### Scenario: Fichier invalide
- **WHEN** le fichier n'a pas de bandeau ou contient un montant illisible
- **THEN** un message d'erreur indique le numéro de ligne, sans le libellé, et l'écran reste utilisable

### Requirement: Analyse du mois
L'écran SHALL afficher les dépenses du mois par catégorie puis par commerçant, du plus élevé au plus bas ; un commerçant sans correspondance est `À catégoriser`.

### Requirement: Correspondance commerçant → catégorie
Chaque commerçant SHALL pouvoir être associé à une catégorie de charge ; le choix est mémorisé dans le navigateur (`localStorage`, par appareil) et réutilisé. Choisir « À catégoriser » efface l'association. Une catégorie n'est jamais devinée.

#### Scenario: Rechargement
- **WHEN** l'utilisateur associe un commerçant puis recharge la page et redépose le fichier
- **THEN** l'association est conservée

### Requirement: Ancrer le solde du relevé
Le bouton « Enregistrer le solde du relevé » SHALL créer un relevé de solde (date et solde du bandeau) sur le compte choisi par l'utilisateur, puis afficher l'écart avec le solde calculé du compte. Aucune transaction ni virement n'est créé.

### Requirement: Suppression d'un relevé de solde
Un relevé de solde enregistré par erreur peut être supprimé par son identifiant ; seul ce relevé est supprimé.

#### Scenario: Suppression
- **WHEN** `DELETE /api/snapshots/{id}` est appelé avec un identifiant connu
- **THEN** ce seul relevé est supprimé et la réponse est sans contenu

#### Scenario: Identifiant inconnu
- **WHEN** l'identifiant n'existe pas
- **THEN** la réponse est 404 et rien n'est supprimé
