# Backend reference code (TypeScript)

Copy, adapt names, keep the shapes. Each block starts with its target path. Checked by compiling in
a witness project (Zod 4, Prisma 6+, Next.js 16).

## Filter schema — `<shared>/filter/list-query.schema.ts`

```ts
// file: shared/filter/list-query.schema.ts
import { z } from "zod";

const isStringSchema = (schema: z.core.$ZodType): boolean => {
  while (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    schema = schema.unwrap();
  }
  return schema instanceof z.ZodString;
};

const operators = <T extends z.ZodType>(value: T) => {
  const base = z.strictObject({ eq: value, not: value, in: z.array(value).max(100), gte: value, lte: value });
  // `contains` is a substring match: only offered on string fields.
  return (isStringSchema(value) ? base.extend({ contains: z.string().min(1) }) : base).partial();
};

type FieldFilters<S extends Record<string, z.ZodType>> = {
  [K in keyof S]: z.ZodOptional<ReturnType<typeof operators<S[K]>>>;
};

export const listQuerySchema = <S extends Record<string, z.ZodType>>(fields: S) => {
  const where = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, operators(value).optional()]),
  ) as FieldFilters<S>;
  const keys = Object.keys(fields) as [Extract<keyof S, string>, ...Extract<keyof S, string>[]];
  return z.object({
    where: z.object(where).optional(),
    orderBy: z
      .object({ field: z.enum(keys), direction: z.enum(["asc", "desc"]).default("asc") })
      .optional(),
    take: z.number().int().min(1).max(100).default(20),
    cursor: z.string().optional(),
  });
};

export type ListQuery = {
  where?: Record<string, Partial<Record<"eq" | "not" | "in" | "gte" | "lte" | "contains", unknown>> | undefined>;
  orderBy?: { field: string; direction: "asc" | "desc" };
  take: number;
  cursor?: string;
};

export type Page<T> = { items: T[]; nextCursor: string | null };
```

## Prisma translator — `<shared or backend>/filter/to-prisma-args.ts`

Pure: no Prisma import, so it is unit-tested without a database.

```ts
// file: shared/filter/to-prisma-args.ts
import type { ListQuery } from "./list-query.schema";

const operatorMap = { eq: "equals", not: "not", in: "in", gte: "gte", lte: "lte" } as const;

const toFieldWhere = (ops: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(ops).flatMap(([op, value]): [string, unknown][] => {
      if (value === undefined) return [];
      if (op === "contains") return [["contains", value], ["mode", "insensitive"]];
      const mapped = operatorMap[op as keyof typeof operatorMap];
      return mapped ? [[mapped, value]] : [];
    }),
  );

export const toPrismaArgs = (query: ListQuery) => ({
  where: Object.fromEntries(
    Object.entries(query.where ?? {}).flatMap(([field, ops]) =>
      ops ? [[field, toFieldWhere(ops)]] : [],
    ),
  ),
  orderBy: query.orderBy ? [{ [query.orderBy.field]: query.orderBy.direction }, { id: "asc" }] : [{ id: "asc" }],
  take: query.take + 1,
  ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
});

export const toPage = <T extends { id: string }>(rows: T[], take: number) => {
  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  return { items, nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null };
};
```
`mode: "insensitive"` exists on PostgreSQL and MongoDB only; drop it for SQLite/MySQL.

## Generic CRUD service — `<backend>/common/crud.service.ts`

```ts
// file: server/common/crud.service.ts
import type { ListQuery, Page } from "@/shared/filter/list-query.schema";
import { toPage, toPrismaArgs } from "@/shared/filter/to-prisma-args";
import { NotFoundError } from "./errors";

type Delegate<T, C, U> = {
  findMany(args: ReturnType<typeof toPrismaArgs>): Promise<T[]>;
  findUnique(args: { where: { id: string } }): Promise<T | null>;
  create(args: { data: C }): Promise<T>;
  update(args: { where: { id: string }; data: U }): Promise<T>;
  delete(args: { where: { id: string } }): Promise<T>;
};

export const createCrudService = <T extends { id: string }, C, U>(
  name: string,
  delegate: Delegate<T, C, U>,
) => ({
  findMany: async (query: ListQuery): Promise<Page<T>> =>
    toPage(await delegate.findMany(toPrismaArgs(query)), query.take),
  findById: async (id: string): Promise<T> => {
    const row = await delegate.findUnique({ where: { id } });
    if (!row) throw new NotFoundError(name, id);
    return row;
  },
  create: (data: C) => delegate.create({ data }),
  update: (id: string, data: U) => delegate.update({ where: { id }, data }),
  remove: (id: string) => delegate.delete({ where: { id } }),
});
```
Usage: `export const chargeService = createCrudService("charge", db.charge);`. If the Prisma
delegate is not assignable, wrap it in a 5-line adapter object, or use per-resource services (BE-5).

## Errors and HTTP mapping — `<backend>/common/errors.ts`, `http.ts`

```ts
// file: server/common/errors.ts
export class NotFoundError extends Error {
  readonly code = "not_found";
  constructor(resource: string, id: string) {
    super(`${resource} ${id} not found`);
  }
}
export class ConflictError extends Error {
  readonly code = "conflict";
}
```

```ts
// file: server/common/http.ts
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ConflictError, NotFoundError } from "./errors";

const body = (code: string, message: string, details?: unknown) => ({ error: { code, message, details } });

// Prisma "record not found" (update/delete on a missing id), matched by code to avoid importing the client.
const isPrismaNotFound = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && error.code === "P2025";

export const toHttpError = (error: unknown) => {
  if (error instanceof ZodError) return NextResponse.json(body("validation", "Invalid input", error.issues), { status: 400 });
  if (error instanceof SyntaxError) return NextResponse.json(body("validation", "Malformed JSON"), { status: 400 });
  if (isPrismaNotFound(error)) return NextResponse.json(body("not_found", "Record not found"), { status: 404 });
  if (error instanceof NotFoundError) return NextResponse.json(body(error.code, error.message), { status: 404 });
  if (error instanceof ConflictError) return NextResponse.json(body(error.code, error.message), { status: 409 });
  console.error(error);
  return NextResponse.json(body("internal", "Internal error"), { status: 500 });
};

export const handle = (fn: () => Promise<unknown>, status = 200) =>
  fn().then((data) => NextResponse.json(data, { status }), toHttpError);
```

## Route handlers — `app/api/charges/route.ts` and `[id]/route.ts`

```ts
// file: app/api/charges/route.ts
import type { NextRequest } from "next/server";
import { chargeCreateSchema, chargeListQuerySchema } from "@/shared/schemas/charge";
import { chargeService } from "@/server/charges/charge.service";
import { handle } from "@/server/common/http";

export const GET = (req: NextRequest) =>
  handle(async () => {
    const raw = req.nextUrl.searchParams.get("q");
    return chargeService.findMany(chargeListQuerySchema.parse(raw ? JSON.parse(raw) : {}));
  });

export const POST = (req: NextRequest) =>
  handle(async () => chargeService.create(chargeCreateSchema.parse(await req.json())), 201);
```

```ts
// file: app/api/charges/[id]/route.ts
import type { NextRequest } from "next/server";
import { chargeUpdateSchema } from "@/shared/schemas/charge";
import { chargeService } from "@/server/charges/charge.service";
import { handle } from "@/server/common/http";

type Ctx = { params: Promise<{ id: string }> };

export const GET = (_req: NextRequest, { params }: Ctx) =>
  handle(async () => chargeService.findById((await params).id));

export const PATCH = (req: NextRequest, { params }: Ctx) =>
  handle(async () => chargeService.update((await params).id, chargeUpdateSchema.parse(await req.json())));

export const DELETE = (_req: NextRequest, { params }: Ctx) =>
  handle(async () => chargeService.remove((await params).id));
```

## Resource schema — `<shared>/schemas/charge.ts`

```ts
// file: shared/schemas/charge.ts
import { z } from "zod";
import { listQuerySchema } from "../filter/list-query.schema";

export const chargeSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  amountCents: z.number().int(),
  dueDate: z.coerce.date(),
});
export const chargeCreateSchema = chargeSchema.omit({ id: true });
export const chargeUpdateSchema = chargeCreateSchema.partial();
export const chargeListQuerySchema = listQuerySchema({
  label: z.string(),
  amountCents: z.number().int(),
  dueDate: z.coerce.date(),
});

export type Charge = z.infer<typeof chargeSchema>;
export type ChargeCreate = z.infer<typeof chargeCreateSchema>;
export type ChargeListQuery = z.input<typeof chargeListQuerySchema>;
```
