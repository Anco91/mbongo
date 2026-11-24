## Why

Les charges n'ont qu'une catégorie plate : « Abonnements » ou « Assurances » ne disent pas ce qu'elles contiennent (mobile, internet, sport ; auto, garantie…). Le foyer veut voir où va l'argent à l'intérieur d'une catégorie.

## What Changes

- Une charge porte une sous-catégorie optionnelle, choisie dans une liste liée à sa catégorie (Abonnements → Mobile, Internet, Sport…).
- La liste des catégories et sous-catégories vit en un seul endroit partagé (aujourd'hui dupliquée dans les deux formulaires).
- Formulaires de création et d'édition : un second sélecteur « Sous-catégorie », vide par défaut.
- Fiche d'une charge : ligne « Sous-catégorie » quand elle existe.
- Le serveur refuse une sous-catégorie qui n'appartient pas à la catégorie ; changer la catégorie d'une charge sans préciser la sous-catégorie remet celle-ci à vide.
- Migration : une colonne `charges.subcategory` (texte, nullable). **Préparée, non appliquée à `dev.db`** (porte GIT-7).

## Out of scope

- Reflet dans le donut (ligne 10b, tranche suivante).
- Sous-catégories des transactions et du Sankey.
- Table de catégories, sous-catégories éditables par l'utilisateur.
- Migration des charges existantes (elles gardent une sous-catégorie vide).
- Tests d'UI (glue).

## Capabilities

### Modified Capabilities
- `charge-management`: sous-catégorie optionnelle, liste fermée par catégorie, refus serveur, remise à vide au changement de catégorie.
