# charge-management Specification (delta)

## ADDED Requirements

### Requirement: Texte légende des charges

Chaque card de charge SHALL porter un texte légende qui la rend lisible sans ouvrir le détail : la note libre de la charge (`note` optionnelle ajoutée au modèle, saisie dans le formulaire) quand elle existe, sinon un texte dérivé des données (type · catégorie · compte débité · fréquence ou échéancier). Le badge « qui paie » du compte débité SHALL accompagner la légende.

#### Scenario: Charge avec note

- **GIVEN** une charge « Loyer GE » avec la note « Prélevé le 1ᵉʳ du mois, révisable à chaque échéance de bail »
- **WHEN** la card s'affiche
- **THEN** cette note est visible sous le montant

#### Scenario: Charge sans note

- **GIVEN** une charge sans note
- **WHEN** la card s'affiche
- **THEN** une légende dérivée s'affiche (ex. « Fixe récurrente · Logement · prélèvement mensuel sur UBS Courant »)

### Requirement: Pagination de la liste des charges

La liste des charges SHALL limiter l'affichage initial aux 3 premières charges et proposer « afficher les autres » qui révèle le reste par paquets de 5 (geste mobile natif, pas une barre de pages web). Les filtres (membre, type) SHALL s'appliquer avant la pagination ; changer de filtre SHALL réinitialiser la pagination au début de la liste filtrée.

#### Scenario: Quelques charges

- **GIVEN** 3 charges filtrées
- **WHEN** la liste se charge
- **THEN** les 3 charges sont affichées sans bouton « afficher les autres »

#### Scenario: Beaucoup de charges

- **GIVEN** 10 charges après filtres
- **WHEN** la liste se charge
- **THEN** 3 charges sont visibles et « afficher les autres » révèle le reste par paquets de 5
