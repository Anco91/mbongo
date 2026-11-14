# Tasks — M2 Cœur métier

## 1. Schéma et validation

- [x] 1.1 Ajouter `Account.linkedAccountId` (nullable + relation self) et `Payment.transactionId` (nullable + relation + `@@unique`) à `apps/web/prisma/schema.prisma`, générer le client Prisma et vérifier la migration `prisma migrate dev` s'applique sans erreur
- [x] 1.2 Étendre les schémas zod (`packages/shared/src/schemas/account.ts`, `payment.ts`) : `linkedAccountId` (optionnel, refusé hors `CREDIT_CARD`), `transactionId` (optionnel) — vérifier par un test unitaire de validation par type de compte et par payload de rapprochement
- [x] 1.3 Étendre `updateChargeSchema` : aucun nouveau champ, mais vérifier par test que l'édition accepte les champs calendrier (montant, fréquence, dates, `installments`) utilisés par la tâche 3.2

## 2. Domaine partagé — carte et échéancier

- [x] 2.1 Implémenter `cardBilling(account, transactions, today)` dans `packages/shared/src/domain/` (encours du cycle, prochaine date de facturation selon `billingDay`/fin de mois, compte de règlement via `linkedAccountId` ou self si `deferredCard`) et vérifier par tests unitaires : carte de crédit UBS (billingDay, compte lié), débit différé BNP (fin de mois, self), encours nul, changement de cycle après facturation
- [x] 2.2 Implémenter le calcul du statut « dû » (`PENDING && dueDate <= today`, jour même inclus) comme fonction pure du domaine et vérifier par tests sur le passage de minuit et le repoussage de date
- [x] 2.3 Implémenter le filtrage des candidates de rapprochement (même compte, montant ± 0,01, date ± 7 j) comme fonction pure et vérifier par tests : candidates multiples, candidate unique, liste vide

## 3. Services (backend)

- [x] 3.1 Rendre `chargeService.create` transactionnel (`$transaction` : charge + `createMany` des échéances) et vérifier par test d'intégration : création réussie avec échéances, échec groupé ⇒ ni charge ni échéance orpheline (toute-ou-rien)
- [x] 3.2 Implémenter la règle d'édition dans `chargeService.update` (champs calendrier ⇒ `$transaction` : remplacement des futures `PENDING` sans rapprochement, `PAID`/rapprochées intouchées) et vérifier par tests d'intégration : révision de montant, échéances payées préservées, édition sans impact calendrier
- [x] 3.3 Implémenter le rapprochement dans `paymentService` (liaison unique + `PAID` + `paidAt`, rapprochement après coche, dérapprochement volontaire ⇒ `PENDING`) et vérifier par tests d'intégration : double liaison refusée avec message lisible, rapprochement d'une échéance déjà `PAID`
- [x] 3.4 Implémenter la dérapprochement automatique à la suppression d'une transaction rapprochée (dans le service de suppression de transaction) et vérifier par test d'intégration : transaction supprimée ⇒ échéance `PENDING` sans date de paiement, aucune échéance `PAID` orpheline
- [ ] 3.5 Étendre `accountService.create`/`update` : `linkedAccountId` requis pour `CREDIT_CARD`, refusé (400) pour les autres types, 422 "compte de règlement inconnu" si inexistant — vérifier par tests d'intégration des quatre scénarios de la spec account-management
- [x] 3.6 Exposer le rapprochement dans `/api/payments` (et la suppression de transaction via `/api/transactions`) avec validation zod à la frontière — vérifier par appel HTTP de test que les réponses suivent les codes de spec (200/400/409/422)

## 4. UI — échéancier et rapprochement

- [x] 4.1 Créer la page échéancier (`(dashboard)/echeancier`) : gardes RSC + `<Suspense>` + `error.tsx`, liste des échéances `PENDING` des 60 prochains jours triées par date, statut visible (à venir / dû dérivé) — vérifier le rendu RSC et le merge des échéances virtuelles carte (tâche 5.2)
- [x] 4.2 Ajouter le rapprochement au détail d'échéance : liste des candidates (fonction pure 2.3), sélection manuelle, coche manuelle sans transaction, dérapprochement — vérifier le parcours complet au clic sur une échéance due
- [x] 4.3 Simplifier `useCreateCharge` (un seul appel) et supprimer `useRetryChargePayments` — vérifier que la création depuis le formulaire passe et que l'invalidation du cache reste correcte

## 5. UI — carte à débit différé

- [x] 5.1 Étendre le formulaire de compte : sélecteur « Prélèvement sur » visible et requis uniquement pour `CREDIT_CARD`, alimenté par les comptes actifs — vérifier la validation côté formulaire (refus sans compte de règlement)
- [x] 5.2 Afficher l'encours et l'échéance de facturation virtuelle sur la vue comptes (compte carte : encours calculé + « prélèvement sur {compte lié} ») et injecter l'échéance virtuelle dans la liste de la page échéancier — vérifier avec des transactions de test que l'encours suit les achats et disparaît après facturation
- [x] 5.3 Documenter la convention anti-double-compte dans l'UI du compte à débit différé (note explicative : le prélèvement de fin de mois ne se saisit jamais) — vérifier l'affichage sur un compte `deferredCard`

## 6. Vérification d'intégration M2

- [x] 6.1 Parcours de bout en bout sur données réelles de test : créer « Impôt FR » (4 × 312 EUR) et la SERAFE (charge à venir), vérifier l'échéancier, rapprocher un prélèvement, éditer un montant — vérifier chaque critère de sortie du jalon M2 du cahier des charges (§ 10)
- [x] 6.2 Vérifier le mécanisme carte complet : achats sur la carte UBS ⇒ encours + échéance virtuelle, saisie du prélèvement sur UBS Courant ⇒ nouveau cycle, et BNP débit différé ⇒ pas de double compte — vérifier les soldes après snapshot de fin de mois
- [x] 6.3 Lancer la suite complète (`npm run lint`, `npm run test`, `npm run build`) et corriger toute régression — vérifier zéro erreur, zéro warning
