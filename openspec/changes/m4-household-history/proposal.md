# Proposal

## Why

La vue foyer est réductrice (membres « Anco / Épouse » codés par le seed, lecture seule M1), aucune card n'indique « qui paie » (Carla / Anco / Foyer), et le dashboard est figé sur le mois courant. Par ailleurs la revue UI de M4 demande d'enrichir des écrans qui font « vide et fade » : cards de charges sans texte légende, donut et Sankey sans texte ni chiffres dans les anneaux/nœuds, aucune pagination mobile (PWA) sur les comptes, les charges, les échéances et les provisions, et un sélecteur EUR/CHF qui ne sert à rien hors dashboard.

## What Changes

- **Vue foyer (CRUD membres complet)** : nouvelle vue `/household` — liste des membres, création, modification (nom, prénom, rôle), suppression. `lastName` ajouté au modèle Member (optionnel, seed inchangé). La vue remplace le foyer figé « Anco / épouse ».
- **Badge « qui paie » sur toutes les cards** : charge, échéances du dashboard, comptes, provisions — dérivé de `account.memberId` (prénom du membre, « Foyer » si null ou membre supprimé). Composant réutilisable `OwnerBadge`.
- **Dashboard par mois** : curseur « ‹ mois › » + swipe horizontal — Sankey, donut, échéances, provisions et le calcul du patrimoine du mois s'affichent pour le mois choisi. Les alertes restent l'état du jour (conditions de solde, pas un historique).
- **Texte dans les anneaux du donut** : total du mois au centre de l'anneau ; pourcentages par segment dans l'anneau (plein écran) — plus lisible qu'une légende seule.
- **Texte et chiffres dans le Sankey** : chaque nœud porte son nom ET son montant, en carte comme en plein écran.
- **Texte légende des charges** : champ `note` (optionnel) sur le modèle Charge + formulaire, et un texte légende dérivé des données quand la note est absente (type · catégorie · compte débité · fréquence).
- **Pagination révélation PWA** : composant réutilisable (3 visibles, « afficher les autres » +5, geste natif mobile, pas une barre de pages web) appliqué aux comptes, aux charges, aux échéances du mois et aux provisions du dashboard ; la liste transferts est refactorée sur ce composant.
- **Sélecteur EUR/CHF visible uniquement sur le dashboard** : le header l'affiche seulement sur `/` — il ne sert qu'à l'affichage consolidé.

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

- `household-members` : MODIFIED « Lister les membres du foyer » (nom ajouté) ; ADDED « CRUD des membres » (vue foyer : créer, modifier, supprimer) ; ADDED « Badge d'attribution qui-paie ».
- `account-management` : ADDED « Pagination de la liste des comptes ».
- `charge-management` : ADDED « Texte légende des charges » (note + légende dérivée) ; ADDED « Pagination de la liste des charges ».
- `dashboard` : ADDED « Navigation mensuelle » (curseur + swipe) ; MODIFIED « Échéances du mois » (mois choisi + pagination) ; MODIFIED « Sankey des flux du mois » (labels + montants sur nœuds) ; MODIFIED « Donut des dépenses par catégorie » (total au centre + % dans l'anneau) ; MODIFIED « Sélecteur de devise d'affichage » (visible sur le dashboard uniquement) — via le delta m4-ui-fixes amendé avant archive.
- `provisions` : ADDED « Pagination des provisions du dashboard ».

## Impact

- `packages/shared` : `memberSchema` (+`lastName` optionnel) ; `chargeSchema` (+`note` optionnelle) ; `computeSankeyFlows`/`computeDonutExpenses` filtrés par mois ; `paymentsInMonth` déjà paramétrable.
- Prisma : migration `members.lastName` + `charges.note` (colonnes nullables, seed inchangé).
- API : `POST/PATCH/DELETE /api/members` (service + controller + routes + repository + hooks).
- UI : `components/household/` (vue foyer), `OwnerBadge`, `ShowMoreList`, donut centre + %, Sankey labels+montants, AppHeader (switch dashboard-only), `dashboard-content` (curseur + swipe), charges (note + légende + pagination), accounts (pagination).
- Specs m4-ui-fixes : delta dashboard amendé (sélecteur dashboard-only) avant archive.
- Tests : CRUD membres, OwnerBadge, ShowMoreList, sankey/donut par mois, légende charges.
