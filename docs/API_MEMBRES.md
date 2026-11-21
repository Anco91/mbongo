# Contrat de l’API des membres

Le contrat des membres ne contient plus de champ `role`. Les membres sont
identifiés par leur prénom et, si renseigné, leur nom.

- `GET /api/members` retourne les membres triés par date de création, avec
  `id`, `firstName` et `lastName`.
- `POST /api/members` attend `firstName` et accepte `lastName` facultatif.
- `PATCH /api/members/:id` accepte la mise à jour partielle de ces mêmes noms.

Les clients doivent retirer `role` des données envoyées et ne plus attendre ce
champ dans les réponses. Cette modification est incompatible avec les clients
qui dépendaient de l’ancien champ.
