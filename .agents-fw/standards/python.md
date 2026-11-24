# Python standard

Same philosophy as TypeScript: pure core, CRUD + filter at the edge, libraries first.
Code: `reference/python.md`.

## Layout

```
src/<package>/
  domain/<concept>.py        # pure functions, dataclasses(frozen=True); no I/O, no framework
  schemas/<resource>.py      # Pydantic models: input, output, filter
  filter/                    # generic filter model + SQLAlchemy translator (BE-2)
  <resource>/
    service.py               # CRUD + find_many(query)
    router.py                # FastAPI router: validate -> service -> HTTP errors
  common/                    # db session, error mapping
tests/                       # mirrors src; pytest
```

## Conventions

- Python ≥ 3.12, type hints everywhere, `mypy --strict` or `pyright` strict in CI; `ruff` for lint
  and format.
- Functions first; `@dataclass(frozen=True)` for value types; classes only for state with an
  invariant or a framework requirement (ARCH-4).
- Pydantic v2 at the boundary only; the domain takes and returns plain dataclasses or primitives.
- `Decimal` for money, `datetime` always timezone-aware (`zoneinfo`).
- Expected failures: return a `Result`-like union or raise a small set of domain exceptions mapped
  once in `common/`. No bare `except`.
- Names: `snake_case` functions and modules, `PascalCase` classes, `test_<rule>` test names.
- Dependencies managed with `uv` (or the project's tool), pinned by the lockfile.

## Tests

- pytest, P1 on `domain/`, P2 on schemas and the filter translator (TEST-1).
- Boundary tests use a real test database (SQLite in memory or a disposable Postgres), not mocks of
  your own services (TEST-6).
