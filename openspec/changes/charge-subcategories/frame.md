---
id: charge-subcategories
status: ready
branch: feat/charge-subcategories
tier: medium
locked_at: d16cc40
locked_tests:
  - apps/web/__tests__/charge-category.test.ts
  - apps/web/__tests__/charge-subcategory.service.test.ts
---

# Frame — charge-subcategories

OpenSpec change `openspec/changes/charge-subcategories/`: goal in `proposal.md`, acceptance criteria in
`specs/*/spec.md`, checklist in `tasks.md`. Rules: WF-3, WF-9, ROLE-1..4, TEST-1..5. Master row 10 (10a; the donut is row 10b).

## Summary

Une charge peut porter une sous-catégorie optionnelle (Abonnements → Mobile, Internet, Sport…), choisie dans une liste liée à sa catégorie, en création, en édition et sur la fiche. Le serveur refuse une sous-catégorie étrangère; changer la catégorie seule la remet à vide. Une migration (colonne nullable) est préparée mais pas appliquée à `dev.db`.

## Frame

### Create

| Path | Role | Exports (signatures) |
|---|---|---|
| `apps/web/src/components/charges/charge-category-fields.tsx` | shared form part (FE-9) | `ChargeCategoryFields(): JSX.Element` — category `SelectInput` + « Sous-catégorie » `SelectInput` (placeholder « Aucune », options from `listSubcategories(useWatch category)`, hidden when the list is empty); inside a `Form` |

### Modify

| Path | Change |
|---|---|
| `packages/shared/src/domain/charge-category.ts` | STUB: fill `CHARGE_CATEGORIES` and replace the three bodies (below). Barrel line already added |
| `packages/shared/src/schemas/charge.ts` | `chargeSchema.subcategory: z.string().min(1).nullable().default(null)` (after `category`; `category` stays `z.string().min(1)`, NO enum); `createChargeSchema.superRefine`: `checkChargeSubcategory(charge.category, charge.subcategory)` non-null → issue path `['subcategory']`; `chargeQuerySchema` unchanged |
| `apps/web/prisma/schema.prisma`, `apps/web/prisma/migrations/20261124230000_add_charge_subcategory/migration.sql` | ALREADY DONE by the Advisor, do not edit. Run `npx prisma generate` only |
| `apps/web/src/server/charges/charge.service.ts` | `create`: `checkChargeSubcategory` non-null → `HttpError(422, { message })` before any write; write `subcategory: input.subcategory ?? null`. `update`: after the 404 check, `const subcategory = resolveChargeSubcategory(existing, input)`; when `input.category !== undefined \|\| input.subcategory !== undefined`: check `(input.category ?? existing.category, subcategory)` (422 on refusal) and put `subcategory` in the written data; when neither is in the patch, write no `subcategory` key. `toPrisma` stays the only mapper (add the key there from a resolved value or set it in `update`; no second mapper) |
| `apps/web/src/components/charges/charge-create-form.tsx` | drop local `CATEGORIES`; render `<ChargeCategoryFields />` where the category select is; default `subcategory: null`; resolver step: `subcategory === '' \|\| not in listSubcategories(category)` → `null` before `zodResolver` (same place and motif as the `dueDay` clearing) |
| `apps/web/src/components/charges/charge-edit-form.tsx` | same as create; default value `charge.subcategory` |
| `apps/web/src/components/charges/charge-detail.tsx` | `<DetailRow label="Sous-catégorie" …/>` after « Catégorie », only when `charge.subcategory` |
| `ARCHITECTURE.md` | registry row `domain/charge-category.ts` → `CHARGE_CATEGORIES`, `listSubcategories`, `checkChargeSubcategory`, `resolveChargeSubcategory`; row `components/charges/charge-category-fields.tsx` (same commit, CTX-3) |
| `specs/current/charge-management/spec.md` | Advisor only, at review (SPEC-2/3) |

Taxonomy to write in `CHARGE_CATEGORIES` (exact strings, this order; the seven keys in the order of the old form lists):

- `Logement`: Loyer, Charges, Énergie, Eau
- `Santé`: LAMal, Complémentaire, Soins
- `Impôts & taxes`: Impôts, Redevances
- `Assurances`: Auto, Habitation, Responsabilité civile, Garantie, Vie
- `Abonnements`: Mobile, Internet, Sport
- `Médias`: Streaming, Presse
- `Divers`: (empty)

Bodies: `listSubcategories(c) = CHARGE_CATEGORIES[c] ?? []` (own-key lookup, not the prototype); `checkChargeSubcategory(c, s)`: `s === null` → `null`, else `listSubcategories(c).includes(s)` → `null`, else a non-empty message; `resolveChargeSubcategory(existing, patch)`: `patch.subcategory !== undefined` → it; else `patch.category !== undefined && patch.category !== existing.category` → `null`; else `existing.subcategory`.

### Read (allow-list)

- `ARCHITECTURE.md`
- `packages/shared/src/{domain/charge-category.ts,schemas/charge.ts}`
- `apps/web/src/server/charges/charge.service.ts`
- `apps/web/src/components/charges/{charge-create-form.tsx,charge-edit-form.tsx,charge-detail.tsx}`
- `apps/web/src/components/form/{select-input.tsx,form.tsx}` (do not edit)
- `apps/web/__tests__/{charge-category.test.ts,charge-subcategory.service.test.ts}`

### Reuse (from the registry)

- `SelectInput` (form kit, unchanged), `DetailRow`, `HttpError`, shared `createChargeSchema` / `updateChargeSchema`, the `dueDay` clearing in the resolvers as the exemplar for clearing a hidden field.

### Style exemplars

- `packages/shared/src/domain/income-link.ts` — pure domain file.
- `apps/web/src/components/patterns/show-closed-toggle.tsx` — small shared component.

### Libraries

- react-hook-form (`useWatch`, `useFormContext`), zod. None new.

### Forbidden

- `category` as a Zod enum, a Category table, editing `schema.prisma` or the migration, running `prisma migrate`, `db push`, `migrate dev` or touching `dev.db` (GIT-7 gate: the human applies the migration), `useEffect`, editing `SelectInput`, the donut, Sankey, `transaction` schemas, `updateChargeSchema` shape, a second category list anywhere, editing locked tests. Any file not listed: stop and ask.

## Tests

### Locked

- `apps/web/__tests__/charge-category.test.ts` — taxonomy, `listSubcategories`, `checkChargeSubcategory`, `resolveChargeSubcategory`, schema rules and legacy rows (TEST-1, TEST-2 schemas).
- `apps/web/__tests__/charge-subcategory.service.test.ts` — server re-check on create/update, reset on category change, untouched key (TEST-3, risky boundary).

Stubs the Executor replaces: `domain/charge-category.ts` (empty taxonomy, throwing bodies).

Proof of failure: `cd apps/web && npx jest __tests__/charge-category.test.ts __tests__/charge-subcategory.service.test.ts` → 27 failed, 3 passed (3 pins already hold by construction).

### Proposed by the Executor

| Path | What it covers | Status |
|---|---|---|

### Test change requests

| Test | Reason | Proposal | Decision |
|---|---|---|---|

## Gates

- Applying `20261124230000_add_charge_subcategory` to `dev.db` is a human gate (GIT-7). Mention it in the handoff and the PR.

## Handoffs

- `docs/handoffs/20261124-2233-charge-subcategories.md`
