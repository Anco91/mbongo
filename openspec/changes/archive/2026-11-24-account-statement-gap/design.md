## Decisions

- **Écart à la date du relevé**, pas au solde courant: un relevé du 15 comparé au solde du 24 donnerait un faux écart. Rejeté: comparer au solde courant.
- **Jour calendaire**: une transaction compte si son jour (10 premiers caractères ISO) ≤ jour du relevé. Évite les pièges d'heure/fuseau.
- **Dernier relevé seul** (date max; à égalité, `createdAt` max). Historique des relevés hors périmètre.
- **Arrondi** au centime; |écart| < 0,005 → 0 (flottants).
- **Réutilisation**: `computeBalance`, `computeSnapshotGap` (inutilisée jusqu'ici), `snapshotsRepository`, `buildAccountCards`. Fonction composée ajoutée dans `balance.ts`, pas de nouveau fichier.
- **Pas de saisie** dans ce change: sans formulaire, seuls les 2 relevés de `dev.db` s'affichent. Ligne suivante au master.
- **Pas de schéma, pas de migration, pas de route.**

## Kickoff

**Product**: plus petite tranche visible = lecture seule sur la carte. Hors périmètre: saisie, ajustement. Débloque: formulaire de relevé.
**Architect**: composer `computeBalance` + `computeSnapshotGap` en une fonction pure testable. Frame = 1 domaine, 2 data, 3 UI: medium. Risque: date/fuseau.
**Skeptic**: pin des tests sur jour du relevé, transaction postérieure, 2 relevés, flottants (0,1+0,2), compte sans relevé, relevé d'un autre compte. Ne pas toucher `useBalances` ni les alertes.
**Decisions**:
- Decision: calcul à la date du relevé because comparaison correcte; rejected solde courant.
- Decision: lecture seule because plus petite tranche; rejected formulaire de saisie dans ce change.
