# Proposal — fix-budget-charts-alerts-dueday

## Why

Pendant l'onboarding du mois et la préparation du budget, le rituel mensuel est trompeur : le récapitulatif affiche 0 CHF de charges alors que des charges ont été créées, le Sankey et le donut ne reflètent jamais le mois préparé (échéances à venir exclues + requêtes tronquées), le badge de la cloche d'alertes ne disparaît pas après consultation, et les échéances des charges fixes tombent en fin de mois sans pouvoir choisir le jour. La préparation du mois devient inexploitable et la confiance dans les chiffres s'effondre.

## What Changes

- Récapitulatif branché sur les vraies sources : échéances du mois (via une requête fenêtrée) + transactions positives du mois hors transferts, à la place du tableau de payments vide et des revenus déduits des sources de revenus.
- Requêtes des échéances fenêtrées par mois (borne `dueDate` sur le mois choisi) : supprime la troncature à 100 lignes et l'incohérence entre prefetch serveur et refetch client ; les guards et le client partagent la même requête.
- Sankey et donut incluent les échéances à venir (`PENDING`) du mois choisi comme flux « prévu », rendus distincts (opacité réduite), en plus du réalisé : les charts sont vivants dès l'onboarding.
- État lu des alertes partagé entre toutes les vues montées (store externe par appareil) : le badge de la cloche disparaît sans rechargement après consultation.
- Champ « jour de prélèvement » (`dueDay`, 1–31) sur les charges fixes mensuelles, défaut = début du mois (1) ; la 1ʳᵉ échéance est ancrée sur le mois de départ (ou le mois courant si postérieur) et générée même si le jour est passé (statut « dû » dérivé) ; jour clampé à la longueur du mois ; `dueDay` absent = comportement legacy (jour de la date de début).

## Capabilities

### New Capabilities

(aucune)

### Modified Capabilities

- `monthly-budget` : « Récapitulatif du mois préparé » — sources explicites (échéances du mois, transactions), décomposition échéances/provisions affichée, scénario « charges créées pendant le parcours visibles au récapitulatif ».
- `dashboard` : « Sankey des flux du mois » et « Donut des dépenses par catégorie » incluent le prévu (`PENDING`) ; « Navigation mensuelle » — requêtes fenêtrées du mois choisi pour guards et client.
- `alerts` : « État lu des alertes » — état lu partagé entre vues montées, badge effacé sans rechargement.
- `charge-management` : « Formulaire de charge adapté au type » (jour de prélèvement, défaut 1), « Génération des échéances à la création » (`dueDay` stocké, mois d'ancrage toujours généré), « Édition du calendrier d'une charge » (`dueDay` touche le calendrier).

## Impact

- **packages/shared** : `schemas/charge.ts` (`dueDaySchema`), `domain/schedule.ts` (`resolveDueDay`, ancrage mensuel — la boucle de saut des échéances antérieures est retirée pour le mensuel, changement de comportement assumé), `lib/calculation/sankey.ts` et `donut.ts` (inclusion du prévu, champ `planned`).
- **apps/web server** : `charges/charge.service.ts` (persistance `dueDay`, régénération via champs touchant le calendrier) ; migration Prisma additive `Charge.dueDay Int?` (nullable, aucune migration de données, charges existantes préservées).
- **apps/web hooks/composants** : `use-schedule.ts` (requête fenêtrée), `use-alerts.ts` (store partagé + fenêtre alertes), `use-charges.ts` (invalidation préfixe `payments`), `recap-step.tsx`, `use-dashboard-data.ts`, guards dashboard/alertes/budget, formulaires de charge (create/edit), renderers Sankey/donut.
- **OpenSpec** : deltas sur les 4 capabilities listées ci-dessus ; `payment-schedule` et `provisions` consultés, aucun delta (statut « dû » dérivé et anti-double-comptage inchangés).
