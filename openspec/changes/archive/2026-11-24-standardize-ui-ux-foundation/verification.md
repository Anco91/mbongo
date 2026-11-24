# Vérification — standardize-ui-ux-foundation

Preuves de la revue visuelle (tâche 4.4) et du parcours manuel (tâche 7.2),
relevées sur l'application locale seedée, viewport 390 × 844 (Chrome headless,
deviceScaleFactor 2).

## Revue visuelle 390 px (4.4)

| Écran | Constat |
|---|---|
| Dashboard, carte | Sankey et donut sans libellé de nœud/segment ; aucun texte superposé. |
| Dashboard, Sankey plein écran | Chaque nœud affiche « nom · montant » ; un libellé qui entrerait en collision descend d'une ligne. Aucun chevauchement ni texte coupé. |
| Dashboard, donut plein écran | Total au centre, légende complète sous l'anneau (3 catégories et montants). |
| Charges | Filtres, cartes et actions lisibles ; « Échéances à venir » accessible avec icône. |
| Échéances à venir | Liste lisible, badges et montants alignés. |
| Comptes | Cartes lisibles ; « Gérer les membres » avec chevron ; pourcentage d'épargne sur une seule ligne. |
| Membres du foyer | Prénom/nom seuls, aucun rôle affiché. |
| Transferts | Deux phases lisibles, aucun débordement. |
| Création de charge / édition de compte | Un seul titre (chrome de route), actions de formulaire en bas, « Clôturer le compte » sous l'enregistrement. |

Correctifs issus de la revue :

- libellés du Sankey mesurés après layout, décalés en cas de collision ;
- pourcentage d'épargne des cartes compte protégé du retour à la ligne ;
- titres dupliqués retirés des pages de création.

## Parcours manuel (7.2)

Parcours vérifié : dashboard → charges → échéances → comptes → édition →
retour → membres du foyer, plus les pages de création compte/charge/transfert.

- Chaque segment possède son `loading.tsx` et affiche un squelette au gabarit
  (couvert par `__tests__/schedule-page.test.tsx` et
  `__tests__/dashboard-content.test.tsx`).
- L'attente de mutation et les retours sont couverts par
  `__tests__/form-actions.test.tsx`, `__tests__/delete-button.test.tsx`,
  `__tests__/account-edit-form.test.tsx` et `__tests__/charge-forms.test.tsx`.

## Commandes

```
npm run quality        # lint, format, typecheck, tests
# 56 suites, 393 tests, 0 échec
openspec validate standardize-ui-ux-foundation --strict
# Change 'standardize-ui-ux-foundation' is valid
```
