# deferred-card Specification

## Purpose

Modéliser la carte à débit différé (BNP) et la carte de crédit (UBS) avec un mécanisme unique : l'encours du mois est calculé, l'échéance de facturation est virtuelle (calculée, jamais persistée), et le débit réel reste une transaction ordinaire sur le compte de règlement.

## Requirements

### Requirement: Lien carte → compte de règlement

Un compte de type `CREDIT_CARD` SHALL référencer un compte de règlement (`linkedAccountId`) parmi les comptes actifs existants ; ce champ SHALL être requis à la création d'une carte de crédit. Un compte d'un autre type SHALL refuser toute valeur de `linkedAccountId`. Un compte à débit différé (`deferredCard`) SHALL être son propre compte de règlement, sans champ dédié.

#### Scenario: Carte de crédit avec compte de règlement

- **WHEN** l'utilisateur crée la carte « Carte UBS (crédit) » en CHF avec le compte de règlement « UBS Courant »
- **THEN** la carte est créée avec le lien vers UBS Courant et visible dans la liste des comptes

#### Scenario: Carte de crédit sans compte de règlement refusée

- **WHEN** la création d'une carte de crédit est soumise sans compte de règlement
- **THEN** la réponse est une erreur de validation lisible et la carte n'est pas créée

#### Scenario: Compte non-carte avec lien refusé

- **WHEN** la création d'un compte courant est soumise avec un `linkedAccountId` renseigné
- **THEN** la réponse est une erreur de validation lisible et le champ est ignoré (non persisté)

### Requirement: Encours carte calculé

Le système SHALL calculer l'encours d'un compte carte (carte de crédit ou débit différé) à la demande : somme des achats du cycle en cours, depuis la dernière facturation. L'encours SHALL être affiché sur la vue du compte carte. L'encours est un calcul, jamais une donnée stockée.

#### Scenario: Encours affiché en cours de mois

- **WHEN** le compte carte porte 640,20 CHF d'achats depuis la dernière facturation et l'utilisateur ouvre la vue comptes
- **THEN** l'encours 640,20 CHF est affiché sur le compte carte, dérivé des transactions

#### Scenario: Encours remis à zéro après facturation

- **WHEN** la facturation du cycle est débitée (transaction de règlement enregistrée) et qu'un nouvel achat est saisi
- **THEN** l'encours du nouveau cycle ne compte que le nouvel achat

### Requirement: Échéance de facturation virtuelle

Le système SHALL présenter pour chaque compte carte une échéance de facturation **calculée à la volée** : montant = encours du cycle, date = prochaine échéance de facturation (jour de facturation du compte, ou fin de mois pour un débit différé), compte débité = compte de règlement. Cette échéance SHALL apparaître dans l'échéancier comme « à venir » sans être persistée. Elle SHALL disparaître dès que l'encours est nul.

#### Scenario: Facture carte UBS dans l'échéancier

- **WHEN** le compte carte UBS porte 640,20 CHF d'encours, facturé le 28 du mois, réglé sur UBS Courant
- **THEN** l'échéancier affiche « Facture carte UBS — 640,20 CHF — 28/11 — à venir — prélèvement sur UBS Courant », sans enregistrement en base

#### Scenario: Mois sans achats

- **WHEN** aucun achat n'a été fait sur la carte depuis la dernière facturation
- **THEN** aucune échéance de facturation n'apparaît dans l'échéancier pour cette carte

### Requirement: Le débit réel reste une transaction ordinaire

Le règlement de la facture carte SHALL toujours être enregistré comme une transaction ordinaire : sur le compte de règlement pour une carte de crédit, sur le compte carte lui-même pour un débit différé. Le système SHALL ne jamais générer automatiquement une transaction de règlement.

#### Scenario: Règlement saisi par l'utilisateur

- **WHEN** l'utilisateur saisit la transaction de −640,20 CHF sur UBS Courant correspondant à la facture carte du 28/11
- **THEN** le solde du compte courant est mis à jour et l'encours du cycle suivant repart de zéro

### Requirement: Convention anti-double-compte débit différé

Sur un compte à débit différé, les achats SHALL être saisis comme transactions ordinaires à leur date d'achat, et le prélèvement groupé de fin de mois SHALL ne jamais être saisi comme transaction supplémentaire (les achats déjà enregistrés font le travail). La documentation de la vue compte à débit différé SHALL expliciter cette convention.

#### Scenario: Fin de mois débit différé sans double compte

- **WHEN** 420 EUR d'achats ont été saisis en novembre sur le compte joint à débit différé et que le prélèvement groupé arrive fin novembre
- **THEN** aucune transaction supplémentaire n'est saisie ; le solde du compte reflète déjà les 420 EUR et le snapshot de fin de mois est cohérent
