---
tier: small
---
# 21 — Navigation performance and feedback

## Summary

Why: switching tabs feels very slow with no sign anything happened.
What changes: the dev server compiles with Turbopack (route compile drops from seconds to ~0.4 s) and the tab bar shows an immediate pending state on the tapped tab.
No change to data or business rules.

## Profile (2026-11-25)

- Production (`next build` + `next start`): every page answers in 6-30 ms. Server prefetch is not the cause.
- Every route already has a `loading.tsx`; it cannot show while the dev server compiles the route on first visit (webpack dev, several seconds per route).
- `next dev --turbopack`: /accounts 0.55 s, /schedule 0.66 s (first route 4.8 s includes warm-up).
- Cause: on-demand route compilation in `next dev` plus no instant click feedback.

## Frame

tier: small

Modify:
- `apps/web/package.json`: script `dev` becomes `next dev --turbopack`.
- `apps/web/src/components/patterns/tab-nav.tsx`: per-tab pending indicator using `useLinkStatus` from `next/link` (child component rendered inside each `Link`; pending tab gets the active colour and `aria-busy`, a short pulse on the icon). No new dependency.

Reuse: existing `Link`, Tailwind classes. Forbidden: any other file, `useEffect`, new library.
Checks: npm run test, typecheck, lint, build. No locked test (glue).
