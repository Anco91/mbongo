# Current behaviour, by capability

One file per capability (`<capability>/spec.md`), written as requirements with scenarios. It says what
the app does **now**, in terms a human reads. Sub-specs in `specs/NN-*.md` say what to change; this
folder is what remains true after the change.

Origin: migrated from `openspec/specs/` (2026-11-24). `openspec/changes/archive/` stays as history.

## Rules (SPEC-1..3, see `AGENTS.md`)

- SPEC-1: every sub-spec starts with a `## Summary` (why, what changes for the user, 3 lines).
- SPEC-2: every sub-spec that changes visible behaviour lists its `specs/current/<capability>/spec.md`
  under Frame > Modify. The Executor does not edit it.
- SPEC-3: at review the Advisor updates the capability file (requirements + scenarios) before the PR
  merges. A sub-spec is `done` only when its capability file is updated or the Summary says `no behaviour change`.

Capabilities: account-management, alerts, app-shell, charge-management, dashboard, deferred-card,
exchange-rate, household-members, income-management, monthly-budget, payment-schedule, provisions,
transfer-management, ui-feedback.
