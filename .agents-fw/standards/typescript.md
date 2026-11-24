# TypeScript standard

Applies to every TS project. Rule IDs come from the other standards; this file is conventions.

## Compiler and lint

- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes` when the codebase
  allows it. No `any` (use `unknown` and narrow). No non-null `!` outside tests.
- ESLint + Prettier (or Biome) as configured by the project; zero warnings in CI.

## Types

- Types come from Zod schemas: `type Charge = z.infer<typeof chargeSchema>`. No hand-written
  duplicate interface for the same shape.
- `type` for unions and data shapes; `interface` only for objects meant to be extended.
- Discriminated unions over boolean flags: `{ status: "paid"; paidAt: Date } | { status: "due" }`.
- `Result` for expected failures:
  ```ts
  export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
  export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
  export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
  ```

## Functions and data

- `const fn = (...) =>` for pure helpers; `function` declarations for React components and exported
  services. Explicit return types on exported functions.
- No mutation of inputs. `toSorted`, `toSpliced`, spread, `structuredClone` when needed.
- Named exports only (no default export) except where the framework requires it (`page.tsx`,
  `layout.tsx`, `route.ts` handlers are named by method).
- Imports: external, then aliased (`@/…`), then relative; no deep relative chains (`../../../`).

## Naming

| Thing | Convention | Example |
|---|---|---|
| Files | kebab-case + role suffix | `charge.service.ts`, `charges-view.tsx` |
| Components | PascalCase | `ChargesView`, `FormActions` |
| Functions | camelCase verb | `computeMonthlyTotal` |
| Booleans | `is/has/can` | `isOverdue` |
| Constants | camelCase, or UPPER_SNAKE for true env-level constants | `maxPageSize` |
| Zod schemas | camelCase + `Schema` | `chargeCreateSchema` |
| Query factories | camelCase + `Queries` | `chargeQueries` |

## Errors

- Domain functions return `Result`. Services throw typed errors (`NotFoundError`,
  `ConflictError`). Controllers map them to HTTP once, in `common/http`.
- Never swallow an error; never `catch` just to log and rethrow.
