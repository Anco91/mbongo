# Spec Delta

## Purpose

Définir la coque applicative mobile : installabilité PWA, viewport et zones sûres, navigation par onglets toujours accessible, visibilité des routes et repli hors-ligne.

## ADDED Requirements

### Requirement: Application installable

L'application SHALL être installable comme PWA : un manifeste expose le nom, les icônes (192 px, 512 px et une variante maskable), `display: standalone`, la couleur de thème et le point de départ `/`. Le document SHALL déclarer un viewport `width=device-width, initial-scale=1` avec `viewport-fit=cover`, la couleur de thème, et les métadonnées iOS (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon`).

#### Scenario: Installation sur mobile

- **GIVEN** l'app ouverte dans un navigateur mobile compatible
- **WHEN** l'utilisateur choisit « Ajouter à l'écran d'accueil »
- **THEN** l'icône, le nom et la couleur de thème sont ceux du manifeste et l'app s'ouvre en mode standalone, sans barre d'adresse

#### Scenario: Manifeste incomplet refusé

- **GIVEN** une icône 512 px ou le nom absent du manifeste
- **WHEN** le build est publié
- **THEN** le contrôle de manifeste échoue avant mise en production

### Requirement: Coque à hauteur d'écran

La coque SHALL occuper exactement la hauteur visible de l'appareil : header et navigation ancrés, contenu central seul scrollable. La navigation SHALL rester visible sans défilement de page, y compris quand le contenu est long. Les marges basses SHALL respecter la zone sûre de l'appareil (encoche et barre d'accueil).

#### Scenario: Contenu long sur mobile

- **GIVEN** une vue dont le contenu dépasse la hauteur de l'écran
- **WHEN** l'utilisateur fait défiler le contenu
- **THEN** la barre d'onglets reste visible en bas et seul le contenu central défile

#### Scenario: Appareil à zone sûre

- **GIVEN** un iPhone avec barre d'accueil
- **WHEN** l'app s'affiche en standalone
- **THEN** la barre d'onglets et le contenu ne sont pas masqués par l'indicateur d'accueil

### Requirement: Navigation par onglets accessible

Les quatre destinations principales (dashboard, charges, transferts, comptes) SHALL être accessibles à tout moment depuis la barre d'onglets. L'onglet actif SHALL être signalé visuellement. Les sous-vues de création, d'édition et de détail SHALL masquer la barre d'onglets et proposer un retour explicite vers la vue parente.

#### Scenario: Onglet actif

- **GIVEN** l'utilisateur est sur `/charges`
- **WHEN** la barre d'onglets s'affiche
- **THEN** l'onglet Charges est signalé comme actif et les trois autres restent atteignables en un tap

#### Scenario: Sous-vue sans barre d'onglets

- **GIVEN** l'utilisateur ouvre `/charges/<id>/edit` ou `/schedule/<id>`
- **WHEN** la page s'affiche
- **THEN** la barre d'onglets est masquée et un bouton retour est visible

#### Scenario: Titre de route

- **GIVEN** l'utilisateur ouvre `/alerts`, `/household` ou `/schedule`
- **WHEN** l'en-tête s'affiche
- **THEN** le titre correspond à la vue (jamais un titre générique de secours)

### Requirement: Repli hors-ligne

L'application SHALL enregistrer un service worker qui précache la coque et sert une page de repli lisible quand le réseau est indisponible. Une requête API échouée hors-ligne SHALL produire un état d'erreur avec action de reprise, jamais un écran blanc.

#### Scenario: Navigation hors-ligne

- **GIVEN** l'utilisateur a déjà ouvert l'app en ligne
- **WHEN** il recharge une route principale sans réseau
- **THEN** la coque et une page de repli s'affichent, avec la mention hors-ligne

#### Scenario: Retour en ligne

- **GIVEN** l'app affichée hors-ligne
- **WHEN** le réseau revient et l'utilisateur relance la requête
- **THEN** les données se chargent normalement sans redémarrage de l'app
