# Design — M2 Cœur métier

## Context

Le socle M1 est en place (comptes, transactions, transferts 2 phases, snapshots) et la génération des échéances existe déjà : `generatePayments` / `missingPayments` en domaine pur (`packages/shared/src/domain/schedule.ts`), CRUD `Payment` complet, création de charge pilotée **côté client** dans le hook `useCreateCharge` (2 appels réseau : charge, puis `createMany` des échéances) avec reprise UI. Trois écarts à combler : pas de vue échéancier, pas de rapprochement échéance ↔ transaction, mécanisme carte à débit différé absent. Le cadre anti-chaos (CONVENTIONS/cdc § 8.2) impose : logique dans les services (`$transaction` pour les opérations transactionnelles), calculs en lib partagée, `app → server → shared` unidirectionnel.

## Goals / Non-Goals

**Goals:**
- Rapprocher l'implémentation du cadre écrit dans le repo (R4) : création de charge transactionnelle côté service.
- Donner à l'utilisateur une vue échéancier avec rapprochement réel (pas une simple coche).
- Couvrir le mécanisme carte unifié : encours + facturation mensuelle, BNP (débit différé) et UBS (carte de crédit) avec le même code.

**Non-Goals:**
- Provisions (F10), alertes (F11), import CSV (F9), capital restant dû (F13) — M3.
- Rappel annuel de révision LaMaL — l'édition de charge couvre déjà le changement de montant.
- Génération de transactions automatiques par l'app — jamais (le débit réel reste une saisie/import).
- Rapprochement automatique (matching sans validation humaine) — hors périmètre, seul le filtrage de la liste des candidates est fourni.

## Decisions

### D1 — Échéance carte virtuelle, jamais persistée
Le montant de la facture carte évolue à chaque achat du mois : une échéance persistée serait obsolète ou sans cesse mise à jour (upsert, annulation, états intermédiaires). Décision : encours + échéance de facturation sont **calculés à la volée** par une fonction pure `cardBilling(account, transactions, today)` en domaine partagé, conformément à R9 (calculs en lib, exécutés là où la donnée se trouve — ici le front). L'échéancier affiche la fusion : échéances persistées (requête) + échéances virtuelles carte (calcul).
Alternative écartée : `Payment` système persisté avec `chargeId` nullable — plus d'états, montants figés, rapprochement inutile puisque le débit réel EST la transaction.

### D2 — Le débit réel reste une transaction ordinaire
UBS : la transaction de prélèvement est saisie sur le compte courant lié. BNP : les achats sont saisis à leur date d'achat sur le compte (qui EST la carte), le prélèvement groupé de fin de mois ne se saisit jamais. La distinction budget/trésorerie du cdc (§ 2.3.2) reste dérivable des dates de transaction. Convention documentée dans l'UI du compte concerné ; le snapshot de solde valide la cohérence sans y penser.
Alternative écartée : générer la transaction de règlement — contredit le principe « l'app ne modifie jamais les données bancaires réelles » et double-compte.

### D3 — Lien carte → compte de règlement
`Account.linkedAccountId` (nullable, self-relation Prisma). Invariants portés par la validation zod à la frontière + service : requis pour `CREDIT_CARD`, refusé pour tout autre type. Pour `deferredCard`, le compte de règlement est le compte lui-même (pas de champ). Le sélecteur « Prélèvement sur » liste les comptes actifs.
Alternative écartée : pas de lien, règlement implicite « le courant du même propriétaire » — ambigu dès deux courants par personne.

### D4 — Rapprochement : liaison explicite, statut dérivé
`Payment.transactionId` (nullable, `@@unique`) : 1↔1 dans les deux sens, rejet lisible d'une double liaison. Deux portes de fermeture : rapprochement (liaison + `PAID` + `paidAt`) et coche manuelle sans transaction ; le rapprochement reste possible après coche. L'état « dû » n'est **pas stocké** : dérivé (`PENDING && dueDate <= today`, jour même inclus) à l'affichage et dans les calculs — aucune transition à maintenir, aucune corruption possible. La suppression d'une transaction rapprochée dérapproche l'échéance (retour `PENDING`, sans date de paiement) — logique dans le service, pas de cascade SQL.
La base n'impose pas que la transaction rapprochée soit du compte de l'échéance ; c'est l'UI qui filtre (même compte, ± 0,01, ± 7 j). Le service valide l'unicité, l'UI valide la pertinence.

### D5 — Création de charge transactionnelle (alignement R4)
`chargeService.create` : `$transaction` (création charge + `createMany` échéances). Le hook client revient à un seul appel ; `useRetryChargePayments` est supprimé ; le scénario « échec récupérable » disparaît au profit du tout-ou-rien (échec ⇒ rien créé ⇒ resoumission). Horizon de génération inchangé (5 ans, comportement existant de `generatePayments`) — pas de génération glissante à maintenir.
Alternative écartée : conserver la génération client — deux appels non atomiques, logique métier hors service (écart au cadre), état intermédiaire à comprendre.

### D6 — Édition = remplacement des futures échéances non rapprochées
`chargeService.update` touchant le calendrier (montant, fréquence, dates, `installments`) : dans une transaction, supprimer les échéances futures `PENDING` **sans rapprochement**, recréer selon le nouveau calendrier. Les `PAID` et rapprochées sont intouchées. Une édition sans impact calendrier ne touche rien. `missingPayments` reste en lib partagée pour les besoins futurs ; le remplacement simple (delete + recreate) est préféré au diff pour la clarté.

### D7 — Schéma : deux ajouts, zéro rupture
- `Account.linkedAccountId String?` + relation self.
- `Payment.transactionId String?` + relation + `@@unique([transactionId])`.
Index sur `transactionId` (par l'unique). Les deux migrations sont additives (nullable), aucun backfill nécessaire.

## Risks / Trade-offs

- [5 ans d'échéances persistées par charge récurrente] → volumes modestes (SQLite, quelques centaines de lignes) ; l'échéancier filtre par date. Le montant figé des futures échéances est volontaire : la révision passe par D6, ce qui couvre LaMaL/loyer à chaque réédition.
- [Double-compte débit différé si la convention D2 n'est pas respectée] → convention explicite dans l'UI du compte + snapshot de solde mensuel comme filet ; l'import CSV (M3) dédoublonnera selon la même règle.
- [Journée comptable] : `makePayment` stocke des dates UTC à minuit ; la comparaison « dû » dépend de la date locale de l'appareil → le calc « dû » utilise la date locale du jour (cohérent avec l'affichage), tests sur le passage de minuit.
- [Rapprochement multi-compte possible au niveau base] → UI filtre strictement (même compte) ; le service ne bloque que l'unicité. Risque résiduel faible, corrigible par dérapprochement.
- [Échéance virtuelle absente des données brutes] → tout consommateur futur (alertes F11, trésorerie M3) doit appeler `cardBilling` ; documenté dans le domaine partagé.

## Migration Plan

1. Migrations Prisma D7 (`linkedAccountId`, `transactionId`) — additives, déployables sans fenêtre.
2. Service : `chargeService.create` transactionnel, `chargeService.update` règle D6, `paymentService` rapprochement/dérapprochement.
3. Front : hook création simplifié, suppression `useRetryChargePayments`, page échéancier, encours carte, formulaire carte.
4. Rollback : chaque étape est réversible ; les migrations étant additives, un retour arrière ne perd aucune donnée (champs restants nullables, ignorés).
