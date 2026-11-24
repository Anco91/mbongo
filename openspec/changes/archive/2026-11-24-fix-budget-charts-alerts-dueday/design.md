# Design — fix-budget-charts-alerts-dueday

## Context

Voir proposal.md. Les 4 défauts ont été diagnostiqués dans le code (références fichier:ligne des causes racines) :

1. **Recap à 0 CHF** — `recap-step.tsx:45-49` passe un tableau de payments vide en dur à `computeMonthlyBudget` (`packages/shared/src/domain/schedule.ts`), qui ne compte donc que les provisions ; les revenus sont déduits des sources de revenus (`Income.startDate`) au lieu des transactions du mois, contrairement à la spec (design D8 archivé du change `monthly-budget-preparation`).
2. **Charts figés** — aucun mock : `sankey.ts` et `donut.ts` ne comptent que les échéances `PAID` (`if (p.status !== 'PAID') continue`) ; la requête globale des échéances est tronquée à 100 lignes par défaut (`paymentQuerySchema` → `limit: 100`) alors que l'horizon de génération est de 5 ans, et les guards prefetchent sans limite sous la même clé de cache que le client (écrasement au refetch). `useMarkPaymentAsPaid` n'invalide que `['payments', { chargeId }]`.
3. **Badge cloche** — `useAlertsRead` garde son `Set` dans un `useState` local à chaque instance : l'instance du header (`app-header.tsx`) et celle de la vue alertes (`alerts-content.tsx`) ne partagent rien ; écrire localStorage n'informe pas l'autre instance (pas d'événement `storage` intra-onglet).
4. **Échéances en fin de mois** — aucun champ de jour : ancrage sur le jour de création (`startDate` défaut = aujourd'hui, `schedule.ts` ancre la récurrence sur `startDate.getDate()`) ; la boucle de saut des échéances antérieures à la date de création peut même supprimer tout le mois courant. La spec `charge-management` exigeait déjà un « jour de prélèvement » jamais implémenté.

Contraintes : Next.js BFF, logique métier pure dans `packages/shared`, TanStack Query sans state miroir, Zod à la frontière, KISS/YAGNI.

## Goals / Non-Goals

**Goals:**

- Récapitulatif fiable dès la création des charges (vraies sources, zéro valeur en dur).
- Charts vivants pendant l'onboarding : prévu (`PENDING`) + réalisé, données requêtées par mois.
- Badge d'alertes cohérent entre header et vue dédiée, sans rechargement.
- Jour de prélèvement choisi par l'utilisateur pour les charges fixes mensuelles, défaut début du mois.

**Non-Goals:**

- Rétro-migration des échéances existantes (charges sans `dueDay` gardées en legacy).
- Correction du décalage de fuseau `dueDate` minuit UTC vs fenêtres locales (documenté, YAGNI — contexte CH UTC+1).
- Suppression du hook `useMarkPaymentAsPaid` (correction d'invalidation conservée, API préservée).
- Nouveau système de persistence pour les alertes (l'état lu reste localStorage par appareil).

## Decisions

**D1 — Recap sur les vraies sources (aucun calcul nouveau).** `RecapStep` consomme les échéances du mois via une requête fenêtrée, les transactions du mois (filtrées par les utilitaires de mois partagés), la devise d'affichage (conversion), et appelle `computeMonthlyBudget(charges, paymentsDuMois, mois, convert)` + `computeMonthIncome` sur les transactions. Alternatives écartées : recalculer le total charges côté wizard (duplication du calcul partagé) ; déduire les revenus des sources (cause du bug, viole D8).

**D2 — Sankey/donut incluent le prévu (décision produit actée).** `computeSankeyFlows` et `computeDonutExpenses` comptent les échéances `PENDING` du mois choisi en plus des transactions réalisées, marquées `planned: true` (`SankeyLink.planned?`, `CategoryExpense.planned?`) ; rendu distinct par opacité réduite (donut) / lien pointillé (Sankey). Totaux = prévu + réalisé. Pas de double comptage : la déduplication par `transactionId` rapprochée existe déjà, et une échéance `PENDING` n'a jamais de transaction rapprochée. Alternative écartée : réalisé seul avec état vide reformulé (ne répond pas au problème rapporté).

**D3 — État lu des alertes dans un store externe partagé.** Nouveau module `apps/web/src/lib/alerts-read-store.ts` : store module-level (Set immuable), `subscribe`/`getSnapshot`/`markAllRead`, helpers purs `parseReadIds`/`serializeReadIds`, lecture paresseuse de localStorage au premier subscribe (guard SSR). `useAlertsRead` devient `useSyncExternalStore` — contrat `{ readIds, markAllRead }` inchangé, header et vue alertes partagent l'état. Alternatives écartées : Context (interdit sauf justification forte), TanStack Query (état d'appareil, pas état serveur), événement `storage` (ne fire pas intra-onglet).

**D4 — `dueDay` stocké, nullable.** Colonne additive `Charge.dueDay Int?` (1–31, validé Zod) ; `null` = legacy (jour de `startDate`), aucune migration de données. Stockage plutôt que dérivation : l'intention de l'utilisateur doit survivre aux éditions de `startDate` et aux régénérations. Génération mensuelle : ancrage sur le mois de `startDate` (ou le mois courant si postérieur), 1ʳᵉ échéance au jour choisi — **le mois d'ancrage est toujours généré même si le jour est passé** (statut « dû » dérivé, retard déjà géré par les alertes) ; la boucle de saut est retirée pour le mensuel. Jour clampé à la longueur du mois (`resolveDueDay`). `dueDay` interdit hors fréquence mensuelle (superRefine Zod → 422). Édition de `dueDay` ajoutée aux champs touchant le calendrier → régénération D6 existante (futures `PENDING` non rapprochées ; `PAID`/rapprochées intouchées).

**D5 — Requêtes échéances fenêtrées par mois.** `useMonthPayments(monthKey)` : `queryKey: ['payments', { dueDate: { gte, lte } }]` avec bornes dérivées de la chaîne du mois (stable), `limit: 500`. Guards serveur et client utilisent la même requête typée (même clé) → plus d'écrasement au refetch. Les alertes requêtent `PENDING` à `dueDate ≤ J+30, limit: 500` (bornes dérivées d'une chaîne jour `YYYY-MM-DD` pour garder la clé stable dans la journée) — couvre le retard + le forecast 30 jours de `computeAlerts`. L'invalidation par préfixe `['payments']` couvre toutes les fenêtres ; `useMarkPaymentAsPaid` corrigée vers le préfixe.

## Risks / Trade-offs

- [Comportement d'ancrage changeant (mois d'ancrage toujours généré)] → changement assumé, figé dans le delta `charge-management` ; statut « dû » dérivé et alertes de retard existants absorbent les échéances passées créées.
- [Fenêtre `limit: 500` peut tronquer à terme] → suffisant à l'échelle du foyer (60 échéances/charge mensuelle sur 5 ans) ; le filtre `dueDate` reste le mécanisme d'extension si besoin.
- [Prévu dans les charts peut surprendre en mois hybride] → rendu visuellement distinct (opacité/pointillé) ; le delta `dashboard` fixe le contrat.
- [Store externe et tests] → helpers purs testables sans DOM ; le test d'intégration du badge utilise le store réel (non mocké).
- [Prisma migration additive] → nullable, aucun rewrite ; rollback = déploiement précédent, le code tolère `dueDay` null.

## Migration Plan

1. Migration Prisma additive `ALTER TABLE charges ADD COLUMN dueDay INTEGER` (nullable).
2. Déploiement du code tolérant `dueDay` null (comportement legacy préservé).
3. Rollback : redeployer l'image précédente ; la colonne restante est inerte.

## Open Questions

(aucune — D2, seule décision produit, est actée dans ce design)
