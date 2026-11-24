# Backend standard (BE)

CRUD + a powerful filter covers most use cases. Business rules live in the shared lib as pure
functions. Services and controllers stay thin and identical across resources. Cite rules by ID.
Code: `reference/backend.md` (TypeScript), `reference/python.md` (Python).

## Shape of a resource

| Layer | File | Does | Never does |
|---|---|---|---|
| Schema | `<shared>/schemas/<resource>.ts` | Zod: entity, create, update, list query | logic |
| Domain | `<shared>/domain/<concept>.ts` | pure rules and calculations | I/O |
| Service | `<backend>/<resource>/<resource>.service.ts` | CRUD + `findMany(query)` via the filter translator | HTTP, business rules |
| Controller | `<backend>/<resource>/<resource>.controller.ts` or `app/api/<resource>/route.ts` | parse input with the schema, call service, map errors | logic, DB calls |

## Rules

- **BE-1 MUST** — A service exposes the CRUD of one resource plus `findMany(query)`. A controller or
  route parses input with the schema, delegates to the service, and maps errors to HTTP. Nothing else.
  Why: every resource reads the same; a reviewer sees any extra logic immediately.

- **BE-2 MUST** — The filter is industrialised once, in the shared lib:
  - `listQuerySchema(fields)` builds the query schema: per-field operators
    `eq, not, in, gte, lte, contains`, `orderBy { field, direction }`, `take` (1..100), `cursor`;
  - one translator per ORM, `toPrismaArgs(query)` (or `apply_query` in Python), pure and tested;
  - services call the translator; they never build `where` by hand.
  Why: one tested filter engine instead of N ad-hoc query builders.

- **BE-3 MUST** — Calculations and business rules live in the shared lib as pure functions. The
  frontend calls them for display, previews and simulations, so the backend does not compute what the
  client can.
  Why: the same function is tested once and used everywhere; the backend stays light.

- **BE-4 MUST** — Security exception: authorisation, input validation, and every invariant that
  protects data integrity (balances, uniqueness, state transitions, money written to the DB) are
  enforced on the server, reusing the same pure functions. The client is never trusted.
  Why: anything computed only on the client can be forged.
  - Good: client shows `computeInvoiceTotal(lines)`; the service recomputes it with the same function
    before writing.
  - Bad: the API accepts `total` from the request body.

- **BE-5 SHOULD** — Prefer one generic `createCrudService(delegate)` over N copied services. Write a
  dedicated service method only for a real need outside CRUD (bulk import, transactional multi-write),
  named in the sub-spec. If the ORM's types fight the generic, keep per-resource services that are
  10-line calls to the translator: the translator is the mandatory part.
  Why: copies drift; a generic that needs `as any` everywhere is worse than small copies.

- **BE-6 MUST** — Lists are paginated by cursor and capped (`take` ≤ 100). A list endpoint returns
  `{ items, nextCursor }`.
  Why: an unbounded list is an outage waiting for data.

- **BE-7 MUST** — Errors: services throw a small set of typed errors (`NotFoundError`,
  `ConflictError`, `ForbiddenError`, `ValidationError`); one function in `common/http` maps them to
  status codes and a stable JSON body `{ error: { code, message, details? } }`.
  Why: one error contract for every endpoint and every client.

- **BE-8 SHOULD** — Writes that touch several rows run in one transaction; the service owns it.
  Why: partial writes are the hardest bugs to debug.

- **BE-9 MUST** — Server Components may call services directly; client code goes through HTTP.
  Both return the same shape, parsed by the same schema.
  Why: no HTTP hop on the server, one type everywhere.

## Query contract

Client → `GET /api/<resource>?q=<url-encoded JSON of the list query>`; `GET/PATCH/DELETE
/api/<resource>/<id>`; `POST /api/<resource>`. The `q` JSON is validated by the resource's
`listQuerySchema`. Example:

```json
{ "where": { "amount": { "gte": 100 }, "label": { "contains": "rent" } },
  "orderBy": { "field": "dueDate", "direction": "asc" }, "take": 20 }
```
