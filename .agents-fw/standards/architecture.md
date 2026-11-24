# Architecture standard (ARCH)

Industrial, not dogmatic: the same shapes in every project, and only as much structure as the
problem needs. Cite rules by ID. Code: `reference/backend.md`, `reference/frontend.md`.

## Default profile: modular monolith, NestJS-style, pure core

```
<shared lib>/                 # framework-free, imported by front and back
  domain/<concept>.ts         # pure business functions: calculations, rules, invariants
  schemas/<resource>.ts       # Zod schemas: single source of truth for types and validation
  filter/                     # generic filter schema + query translator (BE-2)
<backend>/
  <resource>/
    <resource>.service.ts     # CRUD + findMany(query); no business rule inside
    <resource>.controller.ts  # validate (schema) -> call service -> map errors to HTTP
  common/                     # db client, http helpers, error mapping
<frontend>/
  app/<route>/page.tsx        # routing only
  components/
    ui/                       # primitives (shadcn)
    form/                     # form kit
    patterns/                 # PageLayout, DetailView, ListView, AsyncState, Guard
    <domain>/                 # <Resource>View, <Resource>Content, <Resource>Item...
  queries/<resource>.ts       # queryOptions factory (FE-1)
```
In a Next.js full-stack app (BFF) the backend lives in `src/server/` and the controllers are route
handlers in `app/api/`. With NestJS the same names are real Nest modules. In Python, see `python.md`.

## Rules

- **ARCH-1 MUST** — Default profile above: one module per resource, schema → service →
  controller/route; business logic as pure functions in the shared lib. MVC at the transport edge,
  nothing more.
  Why: CRUD + filter covers most needs; the rules live where they are testable and reusable.

- **ARCH-2 SHOULD** — Escalate only on a written need in `ARCHITECTURE.md` > Decisions:
  - tactical DDD (entities, value objects, aggregates) when invariants are many and interlocked
    (e.g. accounting, booking with overlaps);
  - ports/adapters only around a replaceable external integration (payment, scraping, LLM, email);
  - a separate backend service only for a different scaling or security need.
  Why: each layer costs files, reading and tokens; it must buy something.

- **ARCH-3 MUST** — Principles (SOLID, Clean Code, design patterns) serve readability and change.
  An abstraction exists only with two real uses or an external boundary. Name the pattern when you
  use one (`// strategy: one pricing rule per plan`).
  Why: speculative abstractions are code to read, test and maintain for nothing.

- **ARCH-4 MUST** — Functions first. A class only for encapsulated state with an invariant, an
  identity, or a framework requirement (NestJS provider, ORM entity). Immutable data; composition over
  inheritance; expected business failures returned as values (`Result`), exceptions for the
  unexpected.
  Why: pure functions compose, test without mocks, and move between front and back.

- **ARCH-5 MUST** — Same names, same places, same shapes in every project: file names in kebab-case
  with a role suffix (`charge.service.ts`, `charge.schema.ts`, `charges-view.tsx`), one exported
  concept per file, folders by resource then by role. A local signature (house style) is allowed when
  written in `ARCHITECTURE.md` > Decisions.
  Why: anyone (human or agent) finds anything without searching.

- **ARCH-6 MUST** — Analyse before implementing. The Frame lists what will be reused, and what will
  become reusable: a shared element is planned before its second use, not extracted after the third.
  Why: designing reuse up front is cheaper than refactoring three copies.

- **ARCH-7 SHOULD** — Function size: one level of abstraction, ~30 lines, ≤ 4 parameters (group the
  rest in an object). Guard clauses over nesting.
  Why: short functions are cheap to read for humans and for models.

- **ARCH-8 MUST** — Dependencies point inward: UI and transport depend on the shared lib; the shared
  lib depends on nothing of the app (no ORM, no framework, no HTTP).
  Why: the core stays portable and testable.

## Escalation examples

| Signal | Answer |
|---|---|
| A rule needs data from 3 resources | Pure function taking the 3 inputs; the service only loads them |
| Same `if` on a type in 4 places | Strategy map `{ [type]: handler }` in the domain lib |
| Payment provider may change | Port `PaymentGateway` + one adapter; nothing else hexagonal |
| A value with rules (money, period) | Value type + pure functions (`Money`, `addMoney`), not a class tree |
