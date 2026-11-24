---
id: richer-category-taxonomy
status: ready
branch: feat/richer-category-taxonomy
tier: small
locked_at: b637325
locked_tests:
  - apps/web/__tests__/charge-category.test.ts
---

# Frame — richer-category-taxonomy (master row 26)

## Summary

Les catégories et sous-catégories de charges s'enrichissent sur le modèle des applis bancaires (crédits et prêts, transports, alimentation, famille, loisirs, épargne, frais bancaires...). Les catégories et sous-catégories existantes restent; rien à migrer.

## Research (from memory of bank-app category lists: Bankin'/Linxo, Boursorama, Revolut, UBS/PostFinance budget tools; no network tool in this role)

Common top-level groups across them: housing, health, taxes, insurance, subscriptions/telecom, media, loans/credit, transport, food, kids/family, leisure/travel, savings/pension, bank fees, misc. The app only had the first six + Divers; loans and credits were the explicit gap.

## Design decisions

- Decision: additive only, existing keys and sub-categories untouched (DB rows keep validating); new categories inserted before Divers. Rejected renaming.
- Decision: no donut colour table change; unknown categories already fall back to the palette.

## Frame

Modify: `packages/shared/src/domain/charge-category.ts` — `CHARGE_CATEGORIES` becomes exactly this (key order is locked by the test):

- Logement: Loyer, Charges, Énergie, Eau, Travaux & entretien, Mobilier & équipement
- Santé: LAMal, Complémentaire, Soins, Pharmacie, Dentiste, Optique
- Impôts & taxes: Impôts, Redevances, Taxe foncière
- Assurances: Auto, Habitation, Responsabilité civile, Garantie, Vie, Protection juridique, Voyage
- Abonnements: Mobile, Internet, Sport, Logiciels & cloud
- Médias: Streaming, Presse, Musique, Jeux
- Crédits & prêts: Crédit immobilier, Crédit consommation, Crédit auto, Leasing, Carte de crédit
- Transports: Carburant, Transports publics, Parking, Entretien véhicule
- Alimentation: Courses, Restaurants
- Enfants & famille: Garde, Scolarité, Activités
- Loisirs & voyages: Vacances, Sorties, Culture
- Épargne & prévoyance: Épargne, Prévoyance 3a, Investissement
- Frais bancaires: Frais de compte, Cartes
- Divers: (none)

Also `ARCHITECTURE.md` registry line mention. Advisor only: `specs/current/charge-management/spec.md`.
Forbidden: any other file, locked test. Checks: npm run test, typecheck, lint, build.
