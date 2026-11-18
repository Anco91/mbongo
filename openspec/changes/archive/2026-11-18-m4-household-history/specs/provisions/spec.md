# provisions Specification (delta)

## ADDED Requirements

### Requirement: Pagination des provisions du dashboard

La carte « Provisions · lissage mensuel » du dashboard SHALL limiter l'affichage initial aux 3 premières charges provisionnées du mois choisi et proposer « afficher les autres » qui révèle le reste par paquets de 5 (geste mobile natif). Le total provisionné SHALL rester visible quelle que soit la pagination. Chaque provision SHALL porter le badge « qui paie » de son compte débité.

#### Scenario: Quelques provisions

- **GIVEN** 2 charges provisionnées
- **WHEN** la carte s'affiche
- **THEN** les 2 provisions sont visibles sans bouton « afficher les autres »

#### Scenario: Beaucoup de provisions

- **GIVEN** 7 charges provisionnées sur le mois choisi
- **WHEN** la carte s'affiche
- **THEN** 3 provisions sont visibles et « afficher les autres » révèle le reste, le total provisionné restant affiché
