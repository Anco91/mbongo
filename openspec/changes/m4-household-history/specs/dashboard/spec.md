# dashboard Specification (delta)

## MODIFIED Requirements

### Requirement: Échéances du mois

L'UI du dashboard SHALL afficher les échéances du mois choisi (navigation mensuelle) : 3 visibles par défaut, les autres révélées par paquets (« afficher les autres ») avec le geste mobile natif, sans barre de pagination web. Chaque échéance SHALL porter le badge « qui paie » de son compte débité.

#### Scenario: Échéances d'un mois passé

- **GIVEN** l'utilisateur navigue sur un mois passé
- **WHEN** le dashboard se charge
- **THEN** les échéances de ce mois s'affichent (payées, en retard, à venir)

#### Scenario: Beaucoup d'échéances

- **GIVEN** 10 échéances sur le mois choisi
- **WHEN** la liste se charge
- **THEN** 3 échéances sont visibles et « afficher les autres » révèle le reste par paquets de 5

#### Scenario: Liste tronquée

- **GIVEN** plus de 3 échéances au mois
- **THEN** les premières sont affichées et un bouton révèle les suivantes

### Requirement: Sankey des flux du mois

L'UI du dashboard SHALL afficher le Sankey des flux du mois choisi, coloré par type (revenus, comptes, dépenses). Chaque nœud SHALL porter son nom ET son montant agrégé, en carte comme en plein écran — le graphe se lit sans survol.

#### Scenario: Flux avec données

- **GIVEN** des transactions, transferts et échéances payées sur le mois choisi
- **WHEN** le dashboard se charge
- **THEN** chaque nœud affiche son nom et son montant (ex. « Salaire · 3 000 € »)

#### Scenario: Mois sans données

- **GIVEN** aucune donnée sur le mois choisi
- **WHEN** le dashboard se charge
- **THEN** le Sankey affiche un état vide lisible, sans erreur

### Requirement: Donut des dépenses par catégorie

L'UI du dashboard SHALL afficher le donut des dépenses du mois choisi avec le total au centre de l'anneau. En plein écran, chaque segment SHALL porter son nom de catégorie ET son pourcentage posés sur le bandeau coloré, lisibles sans survol — pas de texte à côté du graphe (pas de légende séparée).

#### Scenario: Total au centre

- **GIVEN** 4 905 € de dépenses catégorisées sur le mois
- **WHEN** le donut s'affiche
- **THEN** « 4 905 € » (devise d'affichage courante) apparaît au centre de l'anneau

#### Scenario: Plein écran

- **WHEN** l'utilisateur ouvre le donut en plein écran
- **THEN** chaque segment porte son nom de catégorie et son pourcentage dans l'anneau, sans survol ni légende séparée

#### Scenario: Répartition affichée

- **GIVEN** des dépenses catégorisées sur le mois
- **WHEN** le dashboard se charge
- **THEN** chaque catégorie occupe une part proportionnelle du donut avec son montant

### Requirement: Sélecteur de devise d'affichage

Le sélecteur EUR/CHF du header SHALL être visible uniquement sur le dashboard (`/`) : il pilote l'affichage consolidé et les charts du dashboard, avec la sélection conservée pendant la navigation et au rechargement. Les autres vues SHALL le masquer (il n'y reformate rien).

#### Scenario: Bascule depuis le dashboard

- **GIVEN** le dashboard affiché en EUR
- **WHEN** l'utilisateur bascule sur CHF
- **THEN** patrimoine consolidé et charts s'affichent en CHF sans rechargement

#### Scenario: Masqué ailleurs

- **GIVEN** l'utilisateur navigue vers /charges, /transfers ou /accounts
- **WHEN** le header s'affiche
- **THEN** le sélecteur EUR/CHF n'y apparaît pas

## ADDED Requirements

### Requirement: Navigation mensuelle

Le dashboard SHALL permettre de consulter les mois passés et futurs : un curseur « ‹ mois › » dans la carte, et un swipe horizontal (geste tactile natif PWA) pour changer de mois. Sankey, donut, échéances, provisions et totaux du mois SHALL se recalculer pour le mois choisi ; le patrimoine consolidé et les alertes restent l'état du jour. Le curseur SHALL démarrer sur le mois courant.

#### Scenario: Mois précédent

- **GIVEN** le dashboard sur le mois courant
- **WHEN** l'utilisateur touche « ‹ » ou swipe vers la droite
- **THEN** le mois précédent s'affiche avec ses flux et ses échéances

#### Scenario: Swipe

- **GIVEN** le dashboard ouvert sur mobile
- **WHEN** l'utilisateur swipe horizontalement sur la zone des charts
- **THEN** le mois change (avancer/reculer selon la direction)
