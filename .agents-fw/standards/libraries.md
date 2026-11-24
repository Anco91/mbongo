# Libraries standard (LIB)

Craftsmanship is choosing the smallest maintainable surface of code. Delegate to proven libraries.
Cite rules by ID.

## Default registry

| Need | TypeScript | Python |
|---|---|---|
| Validation, types at the boundary | Zod | Pydantic |
| Forms | react-hook-form + `@hookform/resolvers` (zodResolver) | — |
| Server state on the client | TanStack Query | — |
| URL state (filters, tabs, pagination) | nuqs | — |
| Dates | date-fns (+ `@date-fns/tz` for time zones) | stdlib `datetime` + `zoneinfo` |
| UI primitives | shadcn/ui (Radix-based) | — |
| Icons | lucide-react | — |
| ORM | Prisma (or Drizzle when already chosen) | SQLAlchemy 2 |
| HTTP API | Next.js route handlers / NestJS | FastAPI |
| Tests | Vitest (or Jest when already chosen) | pytest |
| Money / decimals | integer cents, or `decimal.js` when division matters | `decimal.Decimal` |
| i18n | next-intl | — |

A project overrides a line in `ARCHITECTURE.md` > Libraries, with the reason in Decisions.

## Rules

- **LIB-1 MUST** — Before writing a utility, check the project registry (`ARCHITECTURE.md` >
  Libraries), then this default registry. Use the library when it covers the need.
  Why: library code is tested by thousands of users and costs no tokens to write.

- **LIB-2 MUST** — Never by hand:
  - date arithmetic or formatting with native `Date` methods (use date-fns);
  - validation with `if` chains (use the schema);
  - form state, dirty tracking, errors (use react-hook-form);
  - a primitive that shadcn/ui provides (Button, Input, Select, Dialog, Sheet, Table…);
  - fetch + loading + cache state in a component (use TanStack Query);
  - money with floats.
  Why: these are the classic hand-rolled sources of bugs.

- **LIB-3 MUST** — A dependency outside the registry needs a row in `ARCHITECTURE.md` > Decisions
  (need, alternatives considered, reason), approved by the Advisor in the sub-spec.
  Why: every dependency is code you maintain and a supply-chain risk.

- **LIB-4 SHOULD** — Current stable major, pinned by the lockfile. Read the current docs through
  Context7 or the official site before using an API (CTX-7).
  Why: majors change APIs (Zod 3 → 4, TanStack Query 4 → 5, Next.js 14 → 16).

- **LIB-5 SHOULD** — Prefer a library with active maintenance, types included, and no transitive
  bloat. Check the last release date and the open security advisories before adding it.
  Why: an abandoned dependency becomes your code.

- **LIB-6 MUST** — Wrap a library only to standardise its use (the form kit wraps react-hook-form, the
  query factory wraps TanStack Query). Never wrap "in case we change library".
  Why: a pass-through wrapper adds a layer and hides the docs.
