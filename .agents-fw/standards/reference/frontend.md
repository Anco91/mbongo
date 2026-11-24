# Frontend reference code (React / Next.js)

Copy, adapt names, keep the shapes. Each block starts with its target path. Checked by compiling in
a witness project (Next.js 16, React 19, TanStack Query 5, react-hook-form 7, Zod 4, shadcn/ui).

## Query factory — `queries/create-resource-queries.ts`, `queries/charges.ts`

```ts
// file: queries/create-resource-queries.ts
import { queryOptions } from "@tanstack/react-query";
import type { Page } from "@/shared/filter/list-query.schema";

export type ResourceApi<T, Q> = {
  list: (query: Q) => Promise<Page<T>>;
  detail: (id: string) => Promise<T>;
};

export const createResourceQueries = <T, Q>(resource: string, api: ResourceApi<T, Q>) => ({
  all: [resource] as const,
  list: (query: Q) => queryOptions({ queryKey: [resource, "list", query] as const, queryFn: () => api.list(query) }),
  detail: (id: string) => queryOptions({ queryKey: [resource, "detail", id] as const, queryFn: () => api.detail(id) }),
});
```

```ts
// file: queries/charges.ts
import { z } from "zod";
import { chargeSchema, type Charge, type ChargeListQuery } from "@/shared/schemas/charge";
import { createResourceQueries } from "./create-resource-queries";

const pageSchema = z.object({ items: z.array(chargeSchema), nextCursor: z.string().nullable() });

const getJson = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json() as Promise<unknown>;
};

export const chargeHttp = {
  list: async (query: ChargeListQuery) =>
    pageSchema.parse(await getJson(`/api/charges?q=${encodeURIComponent(JSON.stringify(query))}`)),
  detail: async (id: string): Promise<Charge> => chargeSchema.parse(await getJson(`/api/charges/${id}`)),
};

export const chargeQueries = createResourceQueries("charges", chargeHttp);
```
Server side, build the same factory on the service so the keys match:
`createResourceQueries("charges", { list: (q) => chargeService.findMany(chargeListQuerySchema.parse(q)), detail: chargeService.findById })`
in `queries/charges.server.ts` (import `server-only`).

## Generic Guard — `components/patterns/guard.tsx`

```tsx
// file: components/patterns/guard.tsx
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

type PrefetchOptions = Pick<Parameters<QueryClient["prefetchQuery"]>[0], "queryKey">;

export async function Guard({ queries, children }: { queries: PrefetchOptions[]; children: ReactNode }) {
  const queryClient = new QueryClient();
  await Promise.all(queries.map((options) => queryClient.prefetchQuery(options)));
  return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>;
}
```

## View and Content — `components/charges/`

```tsx
// file: components/charges/charges-view.tsx
import { Suspense } from "react";
import { Guard } from "@/components/patterns/guard";
import { PageContent, PageHeader, PageLayout } from "@/components/patterns/page-layout";
import { chargeServerQueries } from "@/queries/charges.server";
import type { ChargeListQuery } from "@/shared/schemas/charge";
import { ChargesContent } from "./charges-content";

export function ChargesView({ query }: { query: ChargeListQuery }) {
  return (
    <PageLayout>
      <PageHeader title="Charges" />
      <PageContent>
        <Suspense fallback={<p>Loading…</p>}>
          <Guard queries={[chargeServerQueries.list(query)]}>
            <ChargesContent query={query} />
          </Guard>
        </Suspense>
      </PageContent>
    </PageLayout>
  );
}
```

```tsx
// file: components/charges/charges-content.tsx
"use client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ListEmpty, ListView } from "@/components/patterns/list-view";
import { chargeQueries } from "@/queries/charges";
import type { ChargeListQuery } from "@/shared/schemas/charge";
import { ChargeItem } from "./charge-item";

export function ChargesContent({ query }: { query: ChargeListQuery }) {
  const { data } = useSuspenseQuery(chargeQueries.list(query));
  if (data.items.length === 0) return <ListEmpty>No charges</ListEmpty>;
  return (
    <ListView>
      {data.items.map((charge) => (
        <ChargeItem key={charge.id} charge={charge} />
      ))}
    </ListView>
  );
}
```

## Form kit — `components/form/form.tsx`

```tsx
// file: components/form/form.tsx
"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { FormProvider, useForm, useFormContext, type DefaultValues, type FieldValues } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";

type FormProps<S extends z.ZodType<FieldValues, FieldValues>> = {
  schema: S;
  defaultValues: DefaultValues<z.input<S>>;
  onSubmit: (values: z.output<S>) => unknown;
  children: ReactNode;
};

export function Form<S extends z.ZodType<FieldValues, FieldValues>>({ schema, defaultValues, onSubmit, children }: FormProps<S>) {
  const form = useForm<z.input<S>, unknown, z.output<S>>({ resolver: zodResolver(schema), defaultValues });
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
        {children}
      </form>
    </FormProvider>
  );
}

export function FormTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}

export function FormFields({ children }: { children: ReactNode }) {
  return <div className="grid gap-4">{children}</div>;
}

type FormActionsProps = { mode: "create" | "edit"; onDelete?: () => void; onCancel?: () => void };

export function FormActions({ mode, onDelete, onCancel }: FormActionsProps) {
  const { formState } = useFormContext();
  return (
    <div className="flex justify-end gap-2">
      {mode === "edit" && onDelete ? (
        <Button type="button" variant="destructive" onClick={onDelete}>Delete</Button>
      ) : null}
      {onCancel ? <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button> : null}
      <Button type="submit" disabled={formState.isSubmitting}>{mode === "create" ? "Create" : "Save"}</Button>
    </div>
  );
}
```
Field components (`TextField`, `NumberField`, `DateField`, `SelectField`) live in
`components/form/fields/`, read `useFormContext()`, wrap the shadcn primitive, show the label and the
error at the same place. Labels come from props (i18n-ready).

Usage — a whole form:
```tsx
<Form schema={chargeCreateSchema} defaultValues={{ label: "", amountCents: 0, dueDate: new Date() }} onSubmit={create.mutateAsync}>
  <FormTitle>New charge</FormTitle>
  <FormFields>
    <TextField name="label" label="Label" />
    <NumberField name="amountCents" label="Amount" />
    <DateField name="dueDate" label="Due date" />
  </FormFields>
  <FormActions mode="create" onCancel={close} />
</Form>
```

## Page layout and detail view — `components/patterns/`

```tsx
// file: components/patterns/page-layout.tsx
import type { ReactNode } from "react";

export function PageLayout({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-6xl space-y-6 p-6">{children}</main>;
}

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </header>
  );
}

export function PageContent({ children }: { children: ReactNode }) {
  return <section className="space-y-4">{children}</section>;
}
```

```tsx
// file: components/patterns/detail-view.tsx
import type { ReactNode } from "react";

export function DetailView({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <article className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {actions ? <div className="flex gap-2">{actions}</div> : null}
      </header>
      {children}
    </article>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <dl className="grid grid-cols-[12rem_1fr] gap-x-4 gap-y-2">{children}</dl>
    </section>
  );
}

export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </>
  );
}
```

```tsx
// file: components/patterns/list-view.tsx
import type { ReactNode } from "react";

export function ListView({ filters, children }: { filters?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-4">
      {filters ? <div className="flex flex-wrap gap-2">{filters}</div> : null}
      <ul className="divide-y rounded-md border">{children}</ul>
    </div>
  );
}

export function ListEmpty({ children }: { children: ReactNode }) {
  return <p className="py-12 text-center text-muted-foreground">{children}</p>;
}
```
