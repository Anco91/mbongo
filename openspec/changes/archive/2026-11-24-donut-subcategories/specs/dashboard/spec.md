## ADDED Requirements

### Requirement: Ventilation du donut par sous-catégorie

Le donut SHALL conserver un segment par catégorie. La légende du plein écran SHALL lister, sous chaque catégorie qui porte au moins une sous-catégorie renseignée, ces sous-catégories avec leur montant, par montant décroissant. Les dépenses de la catégorie sans sous-catégorie (charge sans sous-catégorie, transaction) SHALL apparaître sur une ligne « Autres ». Une catégorie sans aucune sous-catégorie renseignée SHALL n'avoir aucune ligne de détail. La part prévue et la part réalisée SHALL fusionner dans la ventilation.

#### Scenario: Catégorie ventilée

- **GIVEN** en Abonnements un forfait Mobile à 30 € et un Internet à 50 €, payés
- **WHEN** l'utilisateur ouvre le donut en plein écran
- **THEN** la légende montre « Abonnements 80 € » puis « Internet 50 € » et « Mobile 30 € »

#### Scenario: Reste de la catégorie

- **GIVEN** en Abonnements un Mobile à 30 € et une charge sans sous-catégorie à 20 €
- **WHEN** la légende s'affiche
- **THEN** elle montre « Mobile 30 € » et « Autres 20 € »

#### Scenario: Aucune sous-catégorie

- **GIVEN** une catégorie dont aucune charge n'a de sous-catégorie
- **WHEN** la légende s'affiche
- **THEN** la catégorie n'a pas de ligne de détail
