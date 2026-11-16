# Tasks

## 1. Coquille — routes, navigation, design system

- [x] 1.1 Routes anglaises : renommer `(dashboard)` pages en `dashboard` (nouveau `/`), `charges`, `schedule` (ex-échéancier), `transfers`, `accounts` (+ `/new` ex-`/nouveau`) ; ajouter les redirections temporaires FR → EN dans `next.config.ts`
- [x] 1.2 Ajouter `nucleo-sharp` aux dépendances si absent ; installer les icônes utilisées par la maquette
- [x] 1.3 Créer les primitives de présentation dans `components/common/` : `StatusBadge`, `TypeBadge`, `AccountChip`, `SectionTitle`, `ExpandButton`, `DetailSheet` (bottom sheet), `DetailRow`, classes Tailwind reprises de la maquette
- [x] 1.4 Créer `ChartFullscreen` (zoom boutons/molette, pan par drag, réinitialisation, fermeture) et l'intégrer aux cartes charts
- [x] 1.5 Layout : navigation basse 4 onglets (Tableau de bord, Charges, Transferts, Comptes) avec icônes nucleo-sharp, masquée pendant les sous-vues formulaire ; en-tête standard (titre + sélecteur de mois/devise selon maquette)
- [x] 1.6 `CONVENTIONS.md` : pattern vue/guard (`page → XxxView → XxxGuard(children) → XxxContent`), kit de formulaire, conventions de nommage des routes, hooks en `src/hooks/`

## 2. Coquille — kit de formulaire et migrations de vues

- [x] 2.1 Créer les primitives de formulaire `components/common/` : `FormField`, `TextInput`, `SelectInput`, `ToggleInput`, `AmountInput` (CHF/EUR), styles uniques dans les primitives, validation via zodResolver sur les schémas shared
- [x] 2.2 Créer `<Form>` composé (RHF) : sections déclaratives, boutons, gestion du retour (`onBack`) conforme à la maquette
- [x] 2.3 Migrer le formulaire de création/modification de charge vers le kit : blocs conditionnels par type de charge (récurrence, échéancier N échéances, récurrence bornée, paiement unique, prévision & provision) avec les hints de la maquette
- [x] 2.4 Migrer le formulaire de création/modification de compte : blocs conditionnels découvert (EUR seulement), carte (jour de facturation), épargne (plafond + progress), message « pas de découvert en Suisse »
- [x] 2.5 Migrer les formulaires transaction et transfert vers le kit
- [x] 2.6 Consolider les hooks de domaine dans `src/hooks/` ; supprimer `components/*/hooks/` ; réutiliser systématiquement les types zod de `packages/shared` (aucun type redéclaré)
- [x] 2.7 Appliquer le pattern vue/guard à toutes les vues existantes (charges, échéancier, transferts, comptes) ; retirer les redondances et la logique inline des composants
- [x] 2.8 Vérification : `pnpm lint && pnpm build`, parcours manuel des 4 onglets + formulaires, redirections FR → EN testées

## 3. Socle back — traducteur where générique et services minces

- [x] 3.1 Créer `server/common/where-translator.ts` : noyau `createWhereTranslator(fieldMap)` portable (opérateurs génériques → conditions Prisma, transform optionnel), testé unitairement sans entité Mbongo
- [x] 3.2 Field maps par service (account, charge, payment, transaction, transfer, snapshot, member) dérivées des `xxxQuerySchema` existants ; remplacer la traduction inline ; supprimer `filter-to-where.ts`
- [x] 3.3 Audit des services : extraire vers `packages/shared` toute logique de calcul/présentation (objectif < 80 lignes, CRUD + méthodes transactionnelles seulement)
- [x] 3.4 Vérification : tests des services et contrats API au vert ; `pnpm lint && pnpm build`

## 4. Libs partagées M3

- [x] 4.1 `packages/shared/src/lib/calculation/sankey.ts` : construire nœuds/liens du mois depuis transactions (revenus → comptes), transferts (compte → compte) et échéances payées (comptes → catégories) ; montants consolidés au taux courant pour les liens inter-devises, natifs en tooltip ; cas vides et comptes clos testés
- [x] 4.2 `packages/shared/src/lib/calculation/donut.ts` : dépenses du mois par catégorie (montants natifs + consolidés)
- [x] 4.3 `packages/shared/src/lib/calculation/consolidated.ts` : total consolidé EUR au dernier taux connu (taux effectif du dernier transfert réalisé, sinon dernier taux de référence) + date du taux ; aucun taux → indisponible
- [x] 4.4 `packages/shared/src/domain/alerts.ts` : `computeAlerts` — due ≤ 7 j (J+0 inclus), approche du découvert (≤ −70 %), dépassement, trésorerie prévisionnelle négative (forecast 30 j) ; tri par gravité ; seuils et cas limites testés
- [x] 4.5 Provisions : réutiliser `monthlyProvision` ; règle anti-double comptage (échéances réelles d'une charge provisionnée exclues du lot mensuel, remplacées par la provision) ; tests
- [x] 4.6 Capital restant dû : réutiliser `remainingBalance` (somme des échéances non payées) ; tests
- [x] 4.7 Vérification : suite de tests `packages/shared` au vert

## 5. Features M3

- [x] 5.1 Dashboard `/` : patrimoine consolidé (total EUR daté + total CHF parallèle), guard chargant comptes/soldes, échéances, charges provisionnées, transferts, taux
- [x] 5.2 Dashboard : carte Sankey « Flux du mois » (agrégation client via sankey.ts) + plein écran zoom/pan
- [x] 5.3 Dashboard : carte donut « Dépenses par catégorie » (donut.ts) avec légende chiffrée + plein écran
- [x] 5.4 Dashboard : liste « Échéances du mois » (due, montant/devise, compte, statut, sheet de détail, bouton « afficher les autres »)
- [x] 5.5 Dashboard : carte « Provisions · lissage mensuel » (charges provisionnées, total foyer) + bandeau d'alertes en tête (computeAlerts, trié par gravité, rien si aucune)
- [x] 5.6 Charge échelonnée : sheet de détail avec échéancier complet + capital restant dû (remainingBalance)
- [x] 5.7 Vue foyer : filtre membre/couple sur les vues comptes et charges (chips, alimenté par `/api/members`, persistant dans la vue en cours)
- [x] 5.8 Vérification : `pnpm lint && pnpm build` + suite de tests complète ; parcours manuel dashboard (données réelles seedées), alertes et provisions vérifiées sur le seed

## 6. Clôture

- [x] 6.1 Retirer les redirections temporaires si aucune URL FR n'est plus utilisée (ou les garder documentées)
- [x] 6.2 Mettre à jour `CONVENTIONS.md` (socle validé) et référencer la maquette comme direction UI
