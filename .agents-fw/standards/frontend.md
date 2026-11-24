# Frontend standard (FE)

Server state first, composition over inline code, one standard per structure. React + Next.js App
Router; the principles hold for any React stack. Cite rules by ID. Code: `reference/frontend.md`.

## Screen architecture

```
app/charges/page.tsx          page: route params -> <ChargesView query={...} />        (server)
components/charges/
  charges-view.tsx            View: PageLayout, title, actions, Suspense, Guard        (server)
  charges-content.tsx         Content: useSuspenseQuery -> ListView of ChargeItem      (client)
  charge-item.tsx             one item, pure presentation                             (client or server)
components/patterns/guard.tsx Guard: prefetch queryOptions -> HydrationBoundary         (server)
queries/charges.ts            chargeQueries: list(query), detail(id) -> queryOptions    (shared)
```
Data flow: the Guard prefetches on the server with the same `queryOptions` the Content reads, so the
first render has the data (no client loading state) and the cache then refreshes and invalidates it
normally. `useSuspenseQuery` guarantees `data` is defined, like the old `children(data)` render prop,
but works across the server/client boundary (a function prop cannot be passed from a Server
Component to a Client Component).

## Rules

- **FE-1 MUST** — Server data goes through TanStack Query. One factory per resource,
  `<resource>Queries.list(query)` / `.detail(id)`, returning `queryOptions`; it is the only source of
  query keys. Mutations invalidate through the factory keys.
  Why: one key per data, one cache, no stale copy in local state.

- **FE-2 MUST** — Page → View → Guard → Content. The page routes; the View composes the layout and
  wraps the Guard in `Suspense`; the Guard (async Server Component) prefetches the given
  `queryOptions` into a `QueryClient` and renders `HydrationBoundary`; the Content reads with
  `useSuspenseQuery`. One generic Guard, not one per domain. Errors go to the route's `error.tsx`.
  Why: same screen shape everywhere; data guaranteed at render; no duplicated guards.

- **FE-3 MUST** — No `useEffect` to fetch, derive, or react to a user action. Derive during render;
  act in the event handler; fetch with the query factory. `useEffect` is allowed only to synchronise
  with an external system (event listener, timer, subscription, imperative DOM/widget, storage), with
  a one-line `why` comment.
  Why: effects that compute or fetch cause extra renders, races and stale state ("You might not need
  an effect").

- **FE-4 MUST** — State placement:
  - server data → TanStack Query;
  - shareable UI state (filters, sort, tab, page) → URL (nuqs);
  - ephemeral UI state (open, hover, draft) → `useState` in the lowest component;
  - no global store; React Context only for stable, low-churn injection (theme, session).
  No prop drilling past 2 levels: read the query where it is needed, or compose with `children`.
  Why: each state has one owner; components read what they need instead of receiving it through
  five layers.

- **FE-5 MUST** — Structures are compound components with named exports: `Form`, `FormTitle`,
  `FormFields`, `FormActions`; `PageLayout`, `PageHeader`, `PageContent`; `DetailView`,
  `DetailSection`, `DetailRow`; `ListView`, `ListEmpty`. Not `Form.Title` dot notation.
  Why: composition reads like the screen; dot notation breaks when a Server Component imports a
  `"use client"` module.

- **FE-6 MUST** — One form kit: react-hook-form + `zodResolver` + the shared schema. Title, field
  area, error display, and standard actions (create, save, delete, cancel) belong to the kit. A
  screen only provides its fields and its submit/delete handlers.
  Why: every form in the app looks and behaves the same; a new form is 20 lines.

- **FE-7 MUST** — Standard structures with fixed positions: `PageLayout` (title left, actions right,
  content below), `DetailView` (title, actions, sections of label/value rows), `ListView` (filters,
  items, empty state, pagination), `AsyncState` (loading skeleton, empty, error). Same positions in
  the whole app.
  Why: industrial consistency; users and developers know where things are.

- **FE-8 MUST** — Atomic UI layers: `ui/` primitives (shadcn), `form/` kit, `patterns/` structures,
  `<domain>/` business components. Styling lives in primitives and patterns (variants), never in
  views. Domain components compose; they do not style.
  Why: a design change is made once.

- **FE-9 MUST** — No repeated inline JSX. A JSX block that appears twice becomes a component; a list
  renders an item component; a complex condition gets a name (`const canEdit = ...`) or a component.
  Why: repeated inline JSX is the most common duplication in React code and costs tokens each time.

- **FE-10 SHOULD** — Server Components by default; `"use client"` as low in the tree as possible.
  Use `use cache` (Next.js 16) only for public or slowly changing data, never for per-user data.
  Why: less JavaScript shipped, and no accidental cross-user cache.

- **FE-11 SHOULD** — Mutations: `useMutation` with `onSuccess` invalidating
  `<resource>Queries.all`. Optimistic updates only when latency is visible and rollback is simple.
  Server Actions are fine for form posts local to the app; they still call the service and the
  schema.
  Why: one mutation path, predictable cache.

- **FE-12 MUST** — Presentation logic (status, labels, formatting, totals) is a pure function in the
  shared lib or next to the component, tested (TEST-2); the component maps its result to UI.
  Why: logic stays testable without rendering.

## Allowed `useEffect` list

Window/document listeners, `IntersectionObserver`/`ResizeObserver`, timers and intervals,
WebSocket/SSE subscriptions, third-party imperative widgets (maps, charts, editors), focus management
after a state change, `localStorage` sync. Anything else: justify in the sub-spec.
