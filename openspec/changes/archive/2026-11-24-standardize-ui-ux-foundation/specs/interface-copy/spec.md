# Spec Delta

## Purpose

Définir le vocabulaire visible de l'application et la manière dont une action se présente à l'utilisateur, pour que chaque écran parle la langue du foyer plutôt que celle du développement.

## ADDED Requirements

### Requirement: Vocabulaire utilisateur unique

L'interface SHALL employer un vocabulaire unique, orienté foyer, pour désigner les mêmes objets sur tous les écrans. Les termes du glossaire de référence SHALL remplacer le jargon bancaire ou technique dans les libellés visibles.

#### Scenario: Objet nommé partout pareil

- **GIVEN** une échéance liée à une transaction bancaire
- **WHEN** l'utilisateur ouvre son détail
- **THEN** l'interface dit « Lié au débit du … » et l'action de retrait s'appelle « Détacher », jamais « Rapprochement » ni « Dérapprocher »

#### Scenario: Titre de section orienté usage

- **GIVEN** le dashboard affiche la carte des provisions
- **WHEN** la carte s'affiche
- **THEN** son titre décrit l'usage (« Charges lissées chaque mois ») et non le mécanisme comptable (« Provisions · lissage mensuel »)

#### Scenario: Aucun libellé de développeur

- **GIVEN** n'importe quel écran
- **WHEN** l'utilisateur le parcourt
- **THEN** aucun libellé ne mentionne une notion d'implémentation (vue, état, hydratation, server state) ni un identifiant technique

### Requirement: Actions visuellement identifiables

Tout élément qui déclenche une navigation ou une opération SHALL se présenter comme une action : bouton, ou ligne cliquable portant une icône directionnelle. Un texte seul, sans icône ni forme de bouton, ne SHALL pas servir de point d'entrée.

#### Scenario: Accès à la gestion du foyer

- **GIVEN** l'utilisateur consulte la liste des comptes
- **WHEN** il veut gérer les membres du foyer
- **THEN** une ligne d'action libellée « Gérer les membres » avec chevron est proposée, et non un texte souligné ambigu

#### Scenario: Absence d'affordance interdite

- **GIVEN** un écran proposant une navigation secondaire
- **WHEN** l'écran est relu
- **THEN** chaque navigation secondaire porte une icône ou une forme de bouton explicite

### Requirement: Glossaire de référence maintenu

Le projet SHALL maintenir un glossaire unique des libellés visibles dans `docs/LEXIQUE.md`. Tout nouveau libellé visible SHALL y être ajouté avec le terme qu'il remplace ; un libellé déjà listé SHALL être employé à l'identique dans tous les écrans.

#### Scenario: Nouveau libellé documenté

- **WHEN** un écran introduit un nouveau terme visible
- **THEN** le glossaire contient ce terme et son usage avant la revue

#### Scenario: Divergence détectée

- **GIVEN** deux écrans désignent le même objet par deux termes différents
- **WHEN** la revue compare les libellés au glossaire
- **THEN** la divergence est corrigée au profit du terme du glossaire
