# Mbongo

Household budget app for a France/Switzerland couple: CHF/EUR accounts, recurring and instalment
charges, CHF→EUR transfers, monthly budget and money-flow charts. Mobile-first PWA.

- Product context: `cdc.md`
- Architecture, stack, reuse registry, decisions: `ARCHITECTURE.md`
- Specs (current work): `specs/SPEC_MASTER.md` — current behaviour: `specs/current/` — archived specs: `openspec/changes/archive/`, `docs/specs/`
- Visible wording: `docs/LEXIQUE.md`

## Getting started

Requires Node >= 18 and npm >= 9.

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev            # http://localhost:3000
```

## Scripts

```bash
npm run dev            # all apps in dev mode (turbo)
npm run build          # production build
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm run test           # Jest (apps/web/__tests__)
npm run prisma:studio  # Prisma Studio
```

## Working with AI agents

Rules and process come from [agents-framework](https://github.com/Anco91/agents-framework),
installed in `.agents-fw/` and summarised in the managed block of `AGENTS.md`. It is the single
source of truth: Advisor writes a sub-spec and locks its tests, an Executor implements it inside
its Frame, a Reviewer checks it, and every session ends with a handoff in `docs/handoffs/`.

Checks: `bash .agents-fw/scripts/arch-check.sh ARCHITECTURE.md`.
Update the framework: `git pull` in the framework clone, then `init.sh update <this project>`.

## License

See `LICENSE`.
