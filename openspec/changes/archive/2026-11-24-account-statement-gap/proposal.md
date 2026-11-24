## Why

Un relevé de banque doit pouvoir être comparé au solde calculé par l'app. Aujourd'hui `BalanceSnapshot` (API `GET/POST /api/snapshots`) et `computeSnapshotGap` existent mais rien ne les affiche : un oubli de transaction ou un doublon reste invisible.

## What Changes

- Une fonction pure calcule, par compte, l'écart entre le dernier relevé (snapshot) et le solde calculé **à la date du relevé** (pas le solde du jour).
- La carte de chaque compte affiche cet écart quand un relevé existe : « Relevé du JJ.MM.AAAA : écart +X » ou « Relevé conforme ».
- Aucun changement de schéma ni d'API : les snapshots existants sont lus.

## Out of scope

- Saisie d'un relevé (formulaire) : prochaine ligne du master.
- Correction automatique, transaction d'ajustement (le service snapshot n'en crée volontairement pas).
- Écart par transfert (ligne 15).

## Capabilities

### Modified Capabilities
- `account-management`: la carte d'un compte affiche l'écart du dernier relevé.
