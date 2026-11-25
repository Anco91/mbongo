---
id: 37-external-transfers
status: ready
branch: spec/37-external-transfers
tier: medium
locked_at: 0aa7f759e7c683e6a47a94f6b44c8731c6ed7399
locked_tests:
  - apps/web/__tests__/transfer-external.test.ts
---

# 37 — Virements vers un compte externe

Master: `specs/SPEC_MASTER.md` · Needs: 33 · Rules: WF-3, WF-7, TEST-1..5, BE-1..4, FE-1..9

## Summary

- Pourquoi : un virement vers un compte hors foyer (ex. « CHARGES MAISON » → une personne) n'a pas de compte cible ; aujourd'hui Mbongo l'oblige ou ne le connaît pas.
- Ce qui change : un virement peut n'avoir qu'une jambe source. On saisit un libellé de destinataire à la place du compte cible ; pas de taux, pas de frais, statut « complété » d'emblée. Le mémo existant est affiché sur tout virement.
- Changement de comportement visible : oui (formulaire et liste des virements). `specs/current/transfers/spec.md` mis à jour à la revue (SPEC-3). La sortie dans Sankey/budget vient en ligne 44.

## Decisions (PM)

- Virement externe = `targetAccountId` null + `externalLabel` texte libre (pas d'entité tant qu'un seul usage). Exactement un des deux est renseigné.
- Créé `COMPLETED` d'emblée : `rateEstimated` 1, `rateDate` = `sentAt`, `amountReceived`/`rateEffective`/`fees`/`receivedAt` null. Jambe `SOURCE` seule (`-amountSent`, devise du compte source). `update` (réception) d'un virement externe : 409.
- `checkTransferLegs` : un externe `COMPLETED` sans `amountReceived` est cohérent ; une jambe `TARGET` est `TARGET_UNEXPECTED`.
- Patrimoine : la jambe source est une transaction réelle, la sortie est déjà dans les soldes. Sankey/budget (sortie non catégorisée, pas neutre) : ligne 44 ; d'ici là Sankey ignore les virements externes.
- Édition du mémo après création : hors périmètre (ligne ultérieure) ; affichage seulement.
- **Porte humaine GIT-7 levée le 2026-11-25** (PM, objectif utilisateur « ne t'arrête pas »). Migration Prisma (colonne `target_account_id` nullable + `external_label`). L'Executor s'arrête avant `prisma migrate` tant que l'humain n'a pas levé la porte ; le code et les tests purs avancent sans.

## Acceptance criteria

1. `apps/web/__tests__/transfer-external.test.ts` passe (verrouillé) ; les tests de virements existants restent verts.
2. `createTransferSchema` accepte une cible null avec `externalLabel` non vide, refuse cible + libellé, ni l'un ni l'autre, libellé blanc.
3. `POST /api/transfers` crée un externe avec la seule jambe source, statut `COMPLETED`, compte source clos refusé (422) ; `PATCH` d'un externe : 409.
4. Le formulaire propose « Compte externe » : libellé à la place du compte cible, pas de taux ; la liste affiche « source → libellé » et le mémo.
5. Typecheck, lint, suite complète, `arch-check.sh` verts ; `GET /transfers` répond 200 (dev server, aucune écriture).

## Frame

### Create

| Path | Role | Exports |
|---|---|---|
| `packages/shared/src/domain/transfer-external.ts` | règles pures (stub verrouillé : remplacer les corps) | `isExternalTransfer(t: { targetAccountId: string \| null }): boolean`, `checkExternalTransferSource(source: TransferAccountRef): string \| null` (même message que `checkTransferAccounts`) |
| `apps/web/prisma/migrations/<ts>_external_transfers/` | migration (porte humaine) | `targetAccountId` nullable, `externalLabel String?` |

### Modify

| Path | Change |
|---|---|
| `apps/web/prisma/schema.prisma` | `Transfer.targetAccountId String?`, relation optionnelle, `externalLabel String?` |
| `packages/shared/src/schemas/transfer.ts` | `targetAccountId` nullable, `externalLabel: z.string().nullable().default(null)` (trim, non vide si présent) ; `createTransferSchema` : exactement un des deux, message sur `externalLabel` / `targetAccountId` ; la règle source ≠ cible reste pour l'interne |
| `packages/shared/src/domain/transfer-legs.ts` | `targetAccountId: string \| null` ; externe : pas de `AMOUNT_RECEIVED_MISSING` ni `FEES_GAP` |
| `packages/shared/src/lib/calculation/{active-accounts,member-scope,sankey,projected-balance}.ts` | gardes null : externe gardé si sa source est gardée ; Sankey l'ignore ; projection : pas de jambe cible manquante |
| `apps/web/src/server/transfers/transfer.service.ts` | `create` : branche externe (source seule, `COMPLETED`) ; `update` : 409 si externe ; `toTransfer` mappe `externalLabel` |
| `apps/web/src/components/transfers/transfer-create-form.tsx` | bascule « Compte externe » (ToggleInput du kit), `externalLabel` via `TextInput`, taux masqué ; `buildTransferFormSchema`/resolver : `rateEstimated` 1 et `rateDate` = `sentAt` pour un externe |
| `apps/web/src/components/transfers/transfers-content.tsx` | titre « source → libellé » pour un externe ; mémo affiché ; pas de bloc réception |
| `ARCHITECTURE.md` | une ligne registre : `transfer-external.ts` |
| `specs/current/transfers/spec.md`, `specs/SPEC_MASTER.md` | Advisor (SPEC-3, ligne 37). L'Executor n'y touche pas. |

### Read (allow-list)

`ARCHITECTURE.md`, les fichiers de Modify, `packages/shared/src/domain/transfer-accounts.ts`, `apps/web/__tests__/transfer-external.test.ts`, `apps/web/__tests__/transfer.service.test.ts` (modèle de test service), `.agents-fw/standards/backend.md > Service`, `frontend.md > Form kit`.

### Reuse / Libraries / Forbidden

- Reuse : `checkTransferAccounts` (message), `ToggleInput`/`TextInput` (form kit), `ShowMoreList`, `StatusBadge`.
- Libraries : zod, react-hook-form + zodResolver, date-fns. Aucune nouvelle dépendance.
- Forbidden : toucher au test verrouillé ; entité « destinataire » ; calcul du budget/Sankey pour l'externe (ligne 44) ; édition du mémo ; lancer `prisma migrate` avant la levée de la porte ; `npm run build` pendant que le dev server tourne.

## Proof of failure

`npx jest __tests__/transfer-external.test.ts` (apps/web) : 10 rouges (`not implemented` ×4 ; schéma refuse l'externe ; `checkTransferLegs` flague `AMOUNT_RECEIVED_MISSING`/`SOURCE` ; `scopeToMember` écarte l'externe), 5 verts (cas de refus déjà vrais).

## Handoffs

(aucun)
