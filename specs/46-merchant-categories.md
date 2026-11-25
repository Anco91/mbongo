---
id: 46-merchant-categories
status: done
branch: spec/46-merchant-categories
tier: medium
locked_at: none
locked_tests: []
---

# 46 — Correspondance commerçant → catégorie en base

Master: `specs/SPEC_MASTER.md` · Needs: 45 · Rules: WF-3, TEST-1..3

## Summary

- Pourquoi : la correspondance apprise sur `/import` vivait dans le navigateur (localStorage) et ne suivait pas d'un appareil à l'autre.
- Ce qui change : elle est enregistrée en base (`MerchantCategory`), lue et modifiée par `GET`/`PUT /api/merchant-categories`. L'écran se comporte à l'identique.
- Changement de comportement visible : non, hors persistance partagée. `specs/current/bank-import/spec.md` mis à jour.

## Decisions (PM)

- Une ligne par commerçant (`merchant` clé), `category` texte. Une catégorie vide ou « À catégoriser » supprime la ligne (jamais devinée, jamais stockée).
- Migration additive `merchant_categories`, porte GIT-7 levée par le PM (objectif utilisateur).
- Pas d'import des entrées localStorage existantes (elles n'ont pas été utilisées en production). `parseMerchantMapping`/`serializeMerchantMapping` restent dans `@mbongo/shared` (testés), plus appelés par l'app.
- Tests : service (upsert, clear) et schéma, écrits avec le code (PM, pas de ligne verrouillée).

## Acceptance criteria

1. `PUT` d'une catégorie puis `GET` la renvoient ; `PUT` avec `''` ou « À catégoriser » la supprime.
2. `/import` lit le mapping depuis `ImportGuard` (préchargé) et écrit via `useSetMerchantCategory`.
3. Suite complète, typecheck, lint, `arch-check.sh` verts.
