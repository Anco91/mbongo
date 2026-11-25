# Lexique de l'interface

Source de vérité du vocabulaire visible. Tout nouveau libellé visible est ajouté
ici avec le terme qu'il remplace. Un libellé déjà listé est employé à
l'identique dans tous les écrans.

## Termes retenus

| Terme retenu | Ancien terme | Usage | Écrans |
|---|---|---|---|
| Reste à vivre (comptes) | — | Soldes des comptes hors épargne (cartes incluses) moins les charges dues du mois ; différent du « Reste à vivre » du récapitulatif budget (revenus moins charges) | Dashboard (carte patrimoine) |
| dont charges dues | — | Échéances en attente du mois courant, hors charges provisionnées | Dashboard (carte patrimoine) |
| Patrimoine net | — | Patrimoine consolidé moins les charges dues | Dashboard (carte patrimoine) |
| Charges lissées chaque mois | Provisions · lissage mensuel | Le mécanisme de provision mensuelle d'une charge annuelle | Dashboard (carte des provisions) |
| Provisionner (réparti chaque mois) | Provisionner (lissage mensuel) | Case à cocher d'une charge à venir | Création et édition de charge |
| Échéances à venir | Échéancier | La vue des prochaines échéances | En-tête `/schedule`, action depuis Charges |
| Échéances | Échéancier | La liste des paiements d'une charge échelonnée | Détail de charge |
| Membres du foyer | Vue foyer | La vue de gestion des membres | En-tête `/household` |
| Gérer les membres | Vue foyer — gérer les membres | L'action d'ouverture de la vue foyer | Bas de la vue Comptes |
| Lié au débit du … | Rapprochée de la transaction du … | Une échéance reliée à une transaction bancaire | Détail d'échéance |
| Détacher | Dérapprocher | Retirer le lien entre une échéance et une transaction | Détail d'échéance |
| Lier au débit | Rapprocher | Relier une échéance à une transaction candidate | Détail d'échéance |
| Marquer payée sans transaction | Marquer payée sans transaction | Régler une échéance sans pièce bancaire | Détail d'échéance |
| Rapprochement | — | Le fait de relier une échéance à un débit | Réservé au code, jamais affiché |
| Aucune échéance à venir | — | État vide de la vue échéances | `/schedule` |
| Lier | — | Bouton qui rattache une entrée d'argent à une source de revenu | Revenus à lier |
| Revenus à lier | — | Titre de l'écran des entrées d'argent sans source | `/incomes/unmatched` |
| N revenus à lier | — | Bandeau du tableau de bord : nombre d'entrées d'argent sans source (« 1 revenu à lier » au singulier) | Dashboard (bandeau), lien « Lier » |
| Aucun revenu à lier | — | État vide de l'écran Revenus à lier | `/incomes/unmatched` |
| Afficher plus | — | Charger la page suivante d'une liste | Revenus à lier |
| Montant conforme | — | Écart nul entre le montant prévu et reçu | Revenus à lier |
| Impossible de charger … | Erreur lors du chargement de … | Échec de récupération de données | Panneaux d'erreur |
| Réessayer | Réessayer | Relancer une requête en échec | Panneaux d'erreur |

## Règles

- Aucun libellé visible ne nomme une notion d'implémentation : pas de « vue »,
  « état », « hydratation », « server state », ni d'identifiant technique.
- Aucun libellé visible ne décrit un mécanisme comptable quand un usage du
  foyer dit la même chose.
- Une navigation secondaire porte une icône ou une forme de bouton ; un texte
  seul ne sert jamais de point d'entrée.
- Les messages d'échec suivent le gabarit « Impossible de … » suivi du contexte.
- Les montants gardent la devise native ; seule la présentation est convertie.
