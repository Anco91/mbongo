# transfer-management Specification

## Purpose

Modéliser le transfert CHF→EUR en 2 phases (règle métier § 3.3 du cahier des charges) : création en "estimé" à l'envoi (transaction de débit créée immédiatement), finalisation en "réalisé" au crédit (taux effectif + frais déduits, transaction de crédit créée). Exposé via API (le service existe) et UI dédiée.

## Requirements

### Requirement: Créer un transfert en phase estimé

L'API SHALL exposer `POST /api/transfers` : compte source CHF, compte cible EUR, montant envoyé, taux de référence (daté), date d'envoi. Le transfert est créé au statut `ESTIMATED` avec sa contre-valeur estimée, et une transaction de débit (`-montant`) SHALL être créée immédiatement sur le compte source.

#### Scenario: Transfert estimé créé

- **WHEN** l'utilisateur crée un transfert de 1 500 CHF depuis "UBS Courant" vers "BNP Perso" au taux de référence 1,0634
- **THEN** le transfert est créé au statut `ESTIMATED`, avec contre-valeur estimée ≈ 1 595,10 EUR et une transaction de débit de −1 500 CHF sur le compte source

#### Scenario: Comptes de devises incompatibles rejetés

- **WHEN** la création est soumise avec un compte cible en CHF (ou source en EUR)
- **THEN** la réponse est 422 "le transfert exige une source CHF et une cible EUR"

#### Scenario: Compte inexistant rejeté lisiblement

- **WHEN** la création est soumise avec un identifiant de compte inexistant
- **THEN** la réponse est 404 "compte introuvable" — jamais d'erreur 500

### Requirement: Finaliser un transfert en phase réalisé

L'API SHALL exposer `PATCH /api/transfers/{id}` (montant EUR réellement crédité, date de réception). Le statut passe à `COMPLETED`, le taux effectif réel et les frais totaux SHALL être calculés et persistés, et une transaction de crédit SHALL être créée sur le compte cible. Un transfert déjà complété ou clos (`CLOSED`) SHALL être refusé en 409.

#### Scenario: Phase 2 réussie

- **WHEN** l'utilisateur enregistre 1 403,60 EUR crédités pour un transfert de 1 500 CHF estimé à 1 595,10 EUR
- **THEN** le transfert passe à `COMPLETED`, le taux effectif et les frais (~7 EUR) sont enregistrés, et le compte cible reçoit une transaction de +1 403,60 EUR

#### Scenario: Transfert déjà complété

- **WHEN** la finalisation est soumise sur un transfert déjà `COMPLETED`
- **THEN** la réponse est 409 et aucune transaction supplémentaire n'est créée

#### Scenario: Transfert clos

- **WHEN** la finalisation est soumise sur un transfert `CLOSED`
- **THEN** la réponse est 409 et aucune transaction n'est créée

### Requirement: Lister les transferts

L'API SHALL exposer `GET /api/transfers` (filtres typés, tri par date de création décroissante). L'UI SHALL afficher chaque transfert avec son statut (`Estimé`/`Réalisé`), les deux phases côte à côte : estimé (montant + taux de référence daté) et réalisé (montant crédité + taux effectif + frais, ou mention "en attente du crédit").

#### Scenario: Vue des deux phases

- **WHEN** l'utilisateur ouvre la page Transferts
- **THEN** chaque transfert affiche la phase estimée, et pour les transferts non finalisés, la phase réalisée apparaît en attente

### Requirement: Pagination de la liste des transferts

La liste des transferts SHALL limiter l'affichage initial aux premiers transferts et proposer un bouton « afficher les autres » qui révèle le reste par paquets, adapté à la lecture mobile. Aucune suppression ni réordonnancement ne SHALL résulter de la pagination (liste triée par date, la plus récente d'abord).

#### Scenario: Quelques transferts

- **GIVEN** 2 transferts enregistrés
- **WHEN** la liste se charge
- **THEN** les 2 transferts sont affichés sans bouton « afficher les autres »

#### Scenario: Beaucoup de transferts

- **GIVEN** 12 transferts enregistrés
- **WHEN** la liste se charge
- **THEN** les premiers sont affichés et un bouton « afficher les autres » révèle les suivants par paquets

### Requirement: Clore un transfert

L'API SHALL exposer `POST /api/transfers/{id}/close`. Le statut passe à `CLOSED` depuis `ESTIMATED` ou `COMPLETED`. Aucune transaction ne SHALL être créée, modifiée ni supprimée. Clore un transfert déjà clos SHALL renvoyer le transfert sans écriture. Un identifiant inconnu SHALL donner 404.

#### Scenario: Clore un transfert réalisé

- **GIVEN** un transfert `COMPLETED`
- **WHEN** l'utilisateur le clôt
- **THEN** son statut est `CLOSED` et ses transactions sont inchangées

#### Scenario: Clore un envoi abandonné

- **GIVEN** un transfert `ESTIMATED`
- **WHEN** l'utilisateur le clôt
- **THEN** son statut est `CLOSED` et aucune transaction de crédit n'est créée

#### Scenario: Clore deux fois

- **GIVEN** un transfert `CLOSED`
- **WHEN** la clôture est soumise de nouveau
- **THEN** le transfert est renvoyé inchangé, sans écriture

### Requirement: Transfert clos masqué par défaut

La page Transferts SHALL masquer les transferts `CLOSED` et proposer la case « Afficher les transferts clos » pour les inclure. Un transfert clos SHALL afficher le badge « Clos ». La liste de l'API SHALL rester complète.

#### Scenario: Masqué par défaut

- **GIVEN** un transfert clos et un transfert estimé
- **WHEN** la page se charge
- **THEN** seul le transfert estimé est affiché

#### Scenario: Affichage des clos

- **WHEN** l'utilisateur coche « Afficher les transferts clos »
- **THEN** le transfert clos apparaît avec le badge « Clos »

### Requirement: Taux de repli issu des transferts

Le taux de repli du patrimoine consolidé SHALL traiter un transfert `CLOSED` portant un taux effectif comme un transfert réalisé. Un transfert clos sans taux effectif SHALL retomber sur son taux estimé.

#### Scenario: Clos réalisé

- **GIVEN** un transfert `CLOSED` avec taux effectif 0,95 et un transfert `ESTIMATED` plus récent à 0,93
- **THEN** le taux de repli est 0,95
