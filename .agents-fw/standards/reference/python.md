# Backend reference code (Python: FastAPI, Pydantic v2, SQLAlchemy 2)

Same shapes as `backend.md`. Each block starts with its target path.

## Filter model — `src/<pkg>/filter/list_query.py`

```python
# file: src/app/filter/list_query.py
from typing import Any, Generic, Literal, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class Ops(BaseModel, Generic[T]):
    eq: T | None = None
    not_: T | None = Field(default=None, alias="not")
    in_: list[T] | None = Field(default=None, alias="in", max_length=100)
    gte: T | None = None
    lte: T | None = None
    contains: str | None = Field(default=None, min_length=1)


class OrderBy(BaseModel):
    field: str
    direction: Literal["asc", "desc"] = "asc"


class ListQuery(BaseModel):
    where: dict[str, Ops[Any]] = {}
    order_by: OrderBy | None = Field(default=None, alias="orderBy")
    take: int = Field(default=20, ge=1, le=100)
    cursor: str | None = None


class Page(BaseModel, Generic[T]):
    items: list[T]
    next_cursor: str | None = Field(alias="nextCursor")
```

## SQLAlchemy translator — `src/<pkg>/filter/apply_query.py`

```python
# file: src/app/filter/apply_query.py
from sqlalchemy import Select

from .list_query import ListQuery


def apply_query(stmt: Select, model: type, query: ListQuery, allowed: set[str]) -> Select:
    for name, ops in query.where.items():
        if name not in allowed:
            raise ValueError(f"filter on {name} not allowed")
        col = getattr(model, name)
        if ops.eq is not None:
            stmt = stmt.where(col == ops.eq)
        if ops.not_ is not None:
            stmt = stmt.where(col != ops.not_)
        if ops.in_ is not None:
            stmt = stmt.where(col.in_(ops.in_))
        if ops.gte is not None:
            stmt = stmt.where(col >= ops.gte)
        if ops.lte is not None:
            stmt = stmt.where(col <= ops.lte)
        if ops.contains is not None:
            stmt = stmt.where(col.ilike(f"%{ops.contains}%"))
    if query.order_by and query.order_by.field in allowed:
        col = getattr(model, query.order_by.field)
        stmt = stmt.order_by(col.desc() if query.order_by.direction == "desc" else col.asc())
    stmt = stmt.order_by(model.id.asc())
    if query.cursor:
        stmt = stmt.where(model.id > query.cursor)
    return stmt.limit(query.take + 1)
```
Cursor by `id` works with `id` ordering; with another sort key use a keyset `(key, id)` cursor.

## CRUD router factory — `src/<pkg>/common/crud_router.py`

```python
# file: src/app/common/crud_router.py
import json

from fastapi import APIRouter, HTTPException, Query
from pydantic import ValidationError

from ..filter.list_query import ListQuery


def crud_router(prefix: str, service, create_model: type, update_model: type) -> APIRouter:
    router = APIRouter(prefix=prefix)

    @router.get("")
    def find_many(q: str = Query(default="{}")):
        try:
            query = ListQuery.model_validate(json.loads(q))
        except (json.JSONDecodeError, ValidationError) as error:
            raise HTTPException(422, f"invalid list query: {error}") from error
        return service.find_many(query)

    @router.get("/{item_id}")
    def find_by_id(item_id: str):
        item = service.find_by_id(item_id)
        if item is None:
            raise HTTPException(404, f"{prefix} {item_id} not found")
        return item

    @router.post("", status_code=201)
    def create(body: create_model):  # type: ignore[valid-type]
        return service.create(body)

    @router.patch("/{item_id}")
    def update(item_id: str, body: update_model):  # type: ignore[valid-type]
        return service.update(item_id, body)

    @router.delete("/{item_id}", status_code=204)
    def remove(item_id: str) -> None:
        service.remove(item_id)

    return router
```
