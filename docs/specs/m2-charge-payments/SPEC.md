# M2 — Charges et échéances : séparation des responsabilités

```yaml
spec_id: M2-CHARGE-PAYMENTS-001
version: 1.2.0
title: Séparer les charges et les échéances
status: VALIDATED
author: Codex
created_at: 2026-11-06
updated_at: 2026-11-06
reviewer: Anco91
validated_at: 2026-11-06
related_specs: [M1-POC-001]
project: mbongo
priority: HIGH
estimation: { total_hours: 8, complexity: MEDIUM, confidence: MEDIUM }
```

## Résumé et contexte

Le module `charges` du squelette mélange le CRUD de `Charge`, la génération des échéances, leur lecture, le calcul de la prochaine échéance, les retards et le marquage comme payé. Les routes et le controller des charges exposent également ces opérations. Cette organisation contredit le CDC §8.2 (CRUD filtrable, calculs partagés, services par domaine) et rend les échéances difficiles à réutiliser depuis le budget, le calendrier ou le tableau de bord.

Cette spec définit une refonte ciblée des frontières du module. Elle ne redéfinit pas les règles financières du CDC §3.2 ni le modèle produit des cinq types de charges.

## Objectifs

- Donner à `Charge` et à `Payment` des schémas, contrats HTTP, repositories frontend, services, controllers et routes propres.
- Garder chaque service centré sur le CRUD filtrable de sa ressource.
- Garder les calculs de calendrier et d’agrégats dans `packages/shared` sous forme de fonctions pures réutilisables.
- Faire calculer au frontend « prochaine échéance », « échéances en retard », totaux mensuels et provisions à partir des données chargées et des fonctions partagées.
- Permettre de retrouver les échéances d’une charge par le filtre `chargeId` du CRUD des échéances.

## Périmètre

### Inclus

- Séparer les schémas Zod `charge` et `payment` dans deux fichiers.
- Définir des contrats HTTP partagés par ressource (`findMany`, `findOne`, `create`, `update`, `remove`) et les repositories frontend correspondants.
- Limiter `ChargeService` et `ChargesController` au CRUD des charges et à la validation de leurs entrées.
- Ajouter `PaymentService` et `PaymentsController`, chacun limité au CRUD filtrable des échéances.
- Exposer les routes `/api/charges[/:id]` et `/api/payments[/:id]` selon les contrats CRUD.
- Utiliser les filtres existants (`chargeId`, `status`, `dueDate`, et opérateurs `eq`, `in`, `gte`, `lte`, `not`) pour les lectures ciblées.
- Garder les fonctions pures de génération/calcul dans `packages/shared`; elles ne font aucun accès DB/HTTP et ne sont pas recopiées dans les services.
- Déplacer les appels du frontend vers les repositories dédiés. Les pages RSC peuvent appeler directement les services, conformément au CDC R5.
- Supprimer les routes et méthodes spécifiques de `charges` telles que `payments`, `next`, `overdue`, `regeneratePayments` et `markPaymentAsPaid`. Les usages UI équivalents chargent les ressources CRUD et appliquent les fonctions partagées.
- Mettre à jour la todo M2 et documenter les changements de contrat.

### Hors périmètre

- Modifier la sémantique des cinq types de charges ou les règles de provision du CDC.
- Ajouter un discriminant `scheduled`/autre ou une union de types de paiement sans second cas produit concret.
- Ajouter des méthodes métier de lecture dédiées, des endpoints d’agrégat, une couche repository backend ou une architecture DDD/hexagonale.
- Refaire l’UI, le dashboard ou les données de démonstration.
- Changer les règles de génération lors de la création ou de la mise à jour d’une charge au-delà de la séparation décrite ci-dessous.

## Modèle et responsabilités

- Une `Charge` décrit l’engagement : libellé, type, montant, devise, compte, dates, fréquence et paramètres de provision.
- Un `Payment` représente ici une échéance prévue, avec date et état (`PENDING`, `PAID`, etc.). Il reste lié à une charge par `chargeId`, conformément au CDC, mais possède son propre contrat et ses propres opérations CRUD.
- Une transaction reste le mouvement réellement constaté sur un compte (CDC §3.1) ; elle n’est pas un type de `Payment`.
- Aucun champ `type` ni branche `if`/`switch` n’est ajouté à `Payment` tant qu’aucun second type concret partage ce modèle et son CRUD. Si un tel cas apparaît, une union discriminée sera évaluée dans une spec dédiée.
- Le lien Prisma `Charge.payments` peut être utilisé pour la relation de persistance ; les services et contrôleurs ne prennent pas en charge les deux ressources dans une même API de domaine. Le modèle Prisma s’appelle `Payment` et peut conserver le nom de table physique existant via `@@map("scheduled_payments")` pour éviter une migration de données sans nécessité.
- Les fonctions pures de `packages/shared` reçoivent des données et retournent des échéances ou des agrégats. Le frontend les appelle là où il dispose des charges/échéances.
- Une collection d’échéances utilise des filtres CRUD, par exemple `GET /api/payments?chargeId=eq:<id>&status=eq:PENDING`.

## Contrats attendus

| Ressource | Service / controller | Opérations |
|---|---|---|
| Charges | `ChargeService` / `ChargesController` | `findMany`, `findOne`, `create`, `update`, `remove` |
| Échéances (`Payment`) | `PaymentService` / `PaymentsController` | `findMany`, `findOne`, `create`, `update`, `remove` |

Les routes d’une ressource ne délèguent qu’à son controller. Les types de requête/réponse dérivent des schémas Zod partagés. Les repositories frontend exposent les mêmes opérations et encapsulent les appels HTTP ; les composants et hooks ne construisent pas directement les URLs.

`POST /api/payments` accepte un Payment ou un tableau non vide de Payments. La création groupée est un CRUD batch transactionnel sur une seule ressource ; le frontend l’utilise pour persister le calendrier en une requête.

## Génération et mises à jour

La génération du calendrier est une fonction partagée pure, appelée côté frontend. Le frontend persiste les échéances obtenues via le contrat CRUD des échéances. Les écritures partielles pendant cette séquence sont possibles ; aucune opération métier inter-ressources ni transaction dédiée n’est ajoutée par cette refonte. Modifier une charge ne régénère ni ne supprime implicitement ses échéances : le frontend charge les ressources concernées et applique explicitement les opérations CRUD nécessaires.

Le marquage comme payé est un `update` de l’échéance (statut et date de paiement), sans méthode `markPaymentAsPaid` dédiée. La sélection « prochaine » ou « en retard » est calculée dans le frontend avec les fonctions partagées.

## Critères d’acceptation

- [ ] Aucun controller ou service `charges` n’importe, lit ou écrit `Payment`.
- [ ] Aucun endpoint `/api/charges/:id/payments`, `/next`, `/overdue` ou `/paid` ne subsiste.
- [ ] Le CRUD filtrable de `Payment` couvre les lectures nécessaires via `chargeId`, statut et date.
- [ ] Les services des deux ressources n’exposent que le CRUD, sans calcul de prochaine échéance, retard, provision ou génération.
- [ ] Les calculs concernés restent purs et testés dans `packages/shared`, avec `date-fns` pour les opérations calendaires.
- [ ] Le frontend utilise ses repositories pour les appels navigateur et les fonctions partagées pour les calculs.
- [ ] La suppression d’une charge respecte la relation et la politique de suppression existantes/documentées ; aucune perte de données implicite n’est introduite.
- [ ] Les anciennes routes spécialisées sont retirées et leurs usages frontend migrés dans la même livraison fonctionnelle.
- [ ] Vérifications : tests des fonctions partagées, tests de CRUD/filtrage des échéances, typecheck et build des packages touchés.

## Découpage après validation

1. Séparer schémas et contrats HTTP partagés `Charge` / `Payment`.
2. Extraire le CRUD des échéances dans son service, controller et routes, puis supprimer les opérations dédiées du module charges.
3. Ajouter les repositories frontend et migrer les hooks/UI; garder les calculs dans les fonctions partagées.
4. Retirer les anciens exports/routes inutiles et vérifier les usages restants.

Chaque étape sera une branche et une PR distinctes, reviewables, sans merge avant l’accord explicite du demandeur.

## Cohérence de création retenue

Une charge et ses échéances sont créées par leurs repositories respectifs, à partir de la charge et de la fonction pure partagée de génération. Cette séparation évite que `ChargeService` crée des `Payment`. Si la création des échéances échoue, le frontend conserve l’identifiant de la charge créée, affiche l’erreur et permet de reprendre la création des échéances manquantes. Aucune transaction inter-ressources n’est ajoutée dans cette refonte.

**État après la PR #12 :** la séparation des ressources et la création groupée sont implémentées. Le parcours UI de reprise après un échec partiel est implémenté côté frontend : `useCreateCharge` conserve la charge créée avec l'erreur de persistance, et `useRetryChargePayments` recrée uniquement les échéances manquantes (fonction partagée pure `missingPayments`).

## Historique

| Version | Date | Auteur | Changements | Statut |
|---|---|---|---|---|
| 1.0.0 | 2026-11-06 | Codex | Première proposition de séparation Charges / Échéances | IN_REVIEW |
| 1.1.0 | 2026-11-06 | Codex | Ressource `Payment` unique pour les échéances; pas de discriminant sans second cas concret | VALIDATED |
| 1.2.0 | 2026-11-06 | Codex | Création groupée CRUD des échéances en une transaction propre à Payment | VALIDATED |
