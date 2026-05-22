# Ticket sheet-0045: Adopt Hyper-Dank Automation Helpers

## Summary

Adopt `@macavitymadcap/hyper-dank-automation` helpers for repeatable local verification mechanics
while preserving Campaign Ledger's app-specific targets and evidence.

## Dependencies

- Requires `sheet-0041`.

## Implementation

- Replace local script mechanics for local server readiness, Pa11y orchestration, screenshot
  capture, GitHub API helpers, or verification sequencing where Hyper-Dank exposes matching public
  helpers.
- Keep Campaign Ledger Pa11y URLs, screenshot targets, smoke workflow, and PR screenshot evidence
  definitions app-owned.
- Preserve the temporary screenshot directory behaviour for routine `bun run verify`.
- Update script tests and docs for any changed helper boundary.

## Interfaces

- `scripts/verify.ts`.
- `scripts/test-a11y.ts`.
- `scripts/capture-screenshots.ts`.
- `scripts/lib/` local app and GitHub helpers.
- README and operations docs.

## Tests First

- Add or update script tests proving target coverage, screenshot output routing, and helper
  configuration before replacing local mechanics.
- Run focused script tests before full verification.

## Acceptance Criteria

- Shared automation mechanics import from `@macavitymadcap/hyper-dank-automation` where useful.
- Campaign Ledger-specific target lists and smoke flows remain local and visible.
- `bun run verify` does not churn committed PR screenshots.
- `bun run verify` passes.
