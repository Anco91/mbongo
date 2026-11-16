# dashboard Specification (delta)

## MODIFIED Requirements

### Requirement: Patrimoine consolidé

L'UI du dashboard SHALL afficher le total consolidé en EUR au taux courant (taux officiel récupéré au chargement, fallback dernier taux connu — voir capability `exchange-rate`), toujours accompagné de la date du taux (« au taux du JJ/MM/AAAA ») et de la source. Le total CHF natif SHALL rester affiché en parallèle. Le sélecteur de devise du header reformate le montant principal selon la devise choisie (EUR ou CHF) — les données natives ne sont jamais réécrites.

#### Scenario: Consolidation datée

- **GIVEN** un taux courant disponible (officiel ou fallback)
- **WHEN** le dashboard se charge
- **THEN** le total consolidé EUR est affiché avec la mention de la date et de la source du taux
- **AND** le total CHF est affiché en parallèle

#### Scenario: Aucun taux

- **GIVEN** aucun taux disponible (API hors ligne, aucun transfert)
- **WHEN** le dashboard se charge
- **THEN** le total consolidé EUR est indiqué indisponible, sans erreur

#### Scenario: Sélecteur en CHF

- **GIVEN** le sélecteur de devise du header est sur CHF
- **WHEN** le dashboard se charge avec un taux disponible
- **THEN** le montant principal est affiché en CHF et le contre-total en EUR en parallèle

### Requirement: Sankey des flux du mois

L'UI du dashboard SHALL afficher le diagramme de Sankey des flux du mois : revenus (transactions d'entrée) → comptes → catégories de charges/épargne, agrégé depuis les transactions et transferts du mois. Le Sankey SHALL être lisible : nœuds et liens colorés par type (revenus, comptes, dépenses) avec une palette cohérente, en carte comme en plein écran avec zoom et déplacement.

#### Scenario: Flux avec données

- **GIVEN** des transactions, transferts et échéances payées sur le mois
- **WHEN** le dashboard se charge
- **THEN** le Sankey montre des nœuds revenus/comptes/dépenses colorés par type avec des flux proportionnels

#### Scenario: Mois sans données

- **GIVEN** aucune donnée sur le mois
- **WHEN** le dashboard se charge
- **THEN** le Sankey est vide ou affiche un état « aucune donnée », sans erreur

## ADDED Requirements

### Requirement: Sélecteur de devise d'affichage

Le sélecteur EUR/CHF du header SHALL piloter la devise d'affichage de toutes les vues principales (dashboard, charges, transferts, comptes) via un contexte partagé : la sélection est conservée pendant la navigation et au rechargement de la session. La sélection reformate l'affichage (conversion des montants au taux courant) ; les données enregistrées restent dans leur devise native.

#### Scenario: Changement de devise

- **GIVEN** le dashboard affiché en EUR
- **WHEN** l'utilisateur bascule sur CHF dans le header
- **THEN** les montants consolidés et les charts du dashboard s'affichent en CHF sans rechargement de page

#### Scenario: Persistance de la sélection

- **GIVEN** la devise CHF sélectionnée
- **WHEN** l'utilisateur navigue vers une autre vue ou recharge l'app
- **THEN** la devise CHF reste sélectionnée
