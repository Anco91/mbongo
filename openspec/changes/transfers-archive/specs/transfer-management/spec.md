## ADDED Requirements

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

### Requirement: Finalisation refusée sur un transfert clos

`PATCH /api/transfers/{id}` SHALL refuser en 409 un transfert `CLOSED`, sans créer de transaction. Au review, cette règle rejoint l'exigence « Finaliser un transfert en phase réalisé » de `specs/current/transfer-management/spec.md`.

#### Scenario: Transfert clos

- **WHEN** la finalisation est soumise sur un transfert `CLOSED`
- **THEN** la réponse est 409 et aucune transaction n'est créée

### Requirement: Taux de repli issu des transferts

Le taux de repli du patrimoine consolidé SHALL traiter un transfert `CLOSED` portant un taux effectif comme un transfert réalisé. Un transfert clos sans taux effectif SHALL retomber sur son taux estimé.

#### Scenario: Clos réalisé

- **GIVEN** un transfert `CLOSED` avec taux effectif 0,95 et un transfert `ESTIMATED` plus récent à 0,93
- **THEN** le taux de repli est 0,95
