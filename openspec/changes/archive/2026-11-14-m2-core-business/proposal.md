# Proposal — M2 Cœur métier

## Why

Le jalon M2 du cahier des charges (§ 10) exige que le cœur métier devienne réel : une charge échelonnée (impôt FR en 4 prélèvements) et la SERAFE doivent être modélisées correctement, avec un échéancier exploitable et le mécanisme carte à débit différé (BNP + carte de crédit UBS — même implémentation). Aujourd'hui les échéances se génèrent mais l'utilisateur n'a ni vue d'ensemble, ni rapprochement, ni suivi d'encours carte : l'app ne peut pas encore remplacer un suivi manuel.

## What Changes

- **Génération des échéances au service (R4)** : la création d'une charge devient transactionnelle dans `chargeService.create` (`$transaction` : charge + échéances, tout-ou-rien). La génération côté client et la reprise UI (`useRetryChargePayments`) sont supprimées. **BREAKING** pour le flux de création (1 appel au lieu de 2) ; le scénario « Échec de génération récupérable » de la spec `charge-management` est révisé.
- **Règle d'édition** : toute modification du calendrier (montant, fréquence, dates, N échéances) remplace les futures échéances `PENDING` non rapprochées ; les échéances `PAID` ou rapprochées restent intouchées.
- **Échéancier (F4)** : vue dédiée des échéances à venir (60 jours), statut « dû » dérivé à l'affichage, rapprochement manuel échéance ↔ transaction et coche manuelle.
- **Rapprochement** : `Payment.transactionId` (nullable, unique) ; liaison = `PAID` + `paidAt` ; déliaison = retour `PENDING` ; suppression d'une transaction rapprochée → échéance dérapprochée automatiquement.
- **Carte à débit différé (F7)** : mécanisme unifié — encours calculé, échéance de facturation **virtuelle** (calc pur en domaine partagé, jamais persistée), compte de règlement lié via `Account.linkedAccountId`. La carte ne génère jamais de transaction ; le débit réel est une transaction ordinaire.
- **UI** : page échéancier, affichage de l'encours sur les comptes carte, sélecteur « Prélèvement sur » au formulaire de carte de crédit.

## Capabilities

### New Capabilities

- `payment-schedule` : vue échéancier (60 jours), statuts à venir/dû/payé (le « dû » étant dérivé), rapprochement manuel échéance ↔ transaction et coche manuelle sans transaction.
- `deferred-card` : encours carte et échéance de facturation virtuelle pour les comptes à débit différé et les cartes de crédit — un mécanisme, deux habillages ; lien carte → compte de règlement.

### Modified Capabilities

- `charge-management` : la création devient transactionnelle au service (génération + persistance des échéances dans `$transaction`), le scénario d'échec récupérable est remplacé par tout-ou-rien, et une règle d'édition du calendrier est ajoutée (futures `PENDING` remplacées, payées intouchées).
- `account-management` : nouveau champ `linkedAccountId` (carte de crédit → compte de règlement) avec ses invariants : requis pour `CREDIT_CARD`, interdit pour les autres types ; un compte `deferredCard` se règle sur lui-même.

## Impact

- **Schéma Prisma** : `Account.linkedAccountId` (nullable), `Payment.transactionId` (nullable + `@@unique`). Deux migrations.
- **Backend** : `chargeService.create` / `update` (transaction + remplacement des futures échéances), `paymentService` (rapprochement / dérapprochement), validation zod étendue (`chargeSchema`, `accountSchema`, `paymentSchema` — source unique `packages/shared/schemas`).
- **Domaine partagé** : nouvelle fonction pure `cardBilling(account, transactions, today)` dans `packages/shared/domain/` (encours, prochaine facture, compte de règlement) ; `missingPayments` conservé en lib pour la règle d'édition.
- **Front** : suppression de `useRetryChargePayments`, `useCreateCharge` simplifié (1 appel), nouvelle page échéancier, encours sur la vue comptes, formulaire carte étendu.
- **API** : `/api/charges` (création, mise à jour), `/api/payments` (rapprochement), `/api/accounts` (linkedAccountId) — contrats inchangés dans leur forme, payloads étendus.
- **Hors périmètre M2** : provisions (F10, M3), alertes (F11, M3), import CSV (F9, M3), capital restant dû (F13, M3), révision annuelle LaMaL en tant que rappel (l'édition de charge couvre déjà le changement de montant).
