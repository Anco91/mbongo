## Decisions

- **Statut `CLOSED`, pas d'indicateur d'archive**: `Transfer.status` est du texte libre, zéro migration, une seule source de vérité. Rejeté: colonne `archivedAt` (migration, deux états à garder cohérents).
- **Clôture depuis tout état** (`ESTIMATED` ou `COMPLETED`): permet de ranger un envoi abandonné. Un transfert clos n'a jamais de transaction retirée ni ajoutée: les jambes déjà créées restent (neutre pour budget et patrimoine, cf. décision modèle de rapprochement).
- **`POST /api/transfers/{id}/close`**, pas un `PATCH` surchargé: `PATCH` reste la finalisation (schéma `updateTransferSchema` inchangé). Même motif que `POST /api/incomes/{id}/link`. Clore un transfert déjà clos renvoie le transfert tel quel (idempotent, aucune écriture).
- **Finaliser un transfert clos → 409** (`Transfer is closed`), aucune transaction créée. Le 409 « déjà complété » reste.
- **`findLatestRate` compte `CLOSED` comme réalisé**: un transfert clos portant un `rateEffective` reste candidat au taux de repli. Un transfert clos sans `rateEffective` (envoi abandonné) retombe dans le repli sur taux estimé, comme un `ESTIMATED`.
- **Masquage côté client**, fonction pure `filterVisibleTransfers(transfers, showClosed)` dans `packages/shared/src/domain/transfer-archive.ts`; l'API liste tout (le taux de repli du tableau de bord a besoin des clos). Même motif que la liste des comptes.
- **Case réutilisée**: `ShowClosedToggle` reçoit une prop optionnelle `label` (défaut inchangé « Afficher les comptes clôturés »).
- **Badge**: libellé « Clos » (gris par défaut du `StatusBadge`).
- Slice de 10 fichiers de production, au-dessus du repère de 8: une seule tranche verticale indivisible (statut + API + écran), fichiers courts.

## Kickoff

**Product**: plus petite tranche visible = bouton « Clore » + case d'affichage. Hors périmètre: rouvrir, supprimer.
**Architect**: règles pures dans `domain/transfer-archive.ts`; service `close`; route `[id]/close`; hook `useCloseTransfer`. Frame medium. Risque: `findLatestRate` oublie `CLOSED` et le patrimoine perd son taux.
**Skeptic**: pin: `CLOSED` réalisé dans `findLatestRate`, `CLOSED` sans taux effectif, finalisation d'un clos = 409 sans écriture, clôture idempotente, clôture sans toucher aux transactions.
**Decisions**:
- Decision: `CLOSED` dans le texte libre because zéro migration; rejected colonne d'archive.
- Decision: route `POST …/close` because `PATCH` = finalisation; rejected statut dans le corps du `PATCH`.
