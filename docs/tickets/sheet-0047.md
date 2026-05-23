# Ticket sheet-0047: Hyper-Dank Adoption Acceptance

## Summary

Complete final compatibility, screenshot, accessibility, and documentation acceptance for the
Hyper-Dank adoption epic.

## Dependencies

- Follows `sheet-0041` through `sheet-0046`.

## Implementation

- Run the complete Campaign Ledger verification suite after all migrations.
- Run the Hyper-Dank package or compatibility command used by this epic, expected as
  `bun run test:packages` or the narrower command documented by `sheet-0041`.
- Refresh deliberate PR evidence screenshots for the visible surfaces changed by UI migration.
- Confirm light and dark screenshots are paired in two-column PR tables.
- Record final acceptance notes and any deferred follow-ups.

## Interfaces

- Compatibility tests.
- Screenshot evidence under `docs/pr-screenshots/`.
- README, architecture docs, and operations acceptance docs.
- PR body and review evidence.

## Tests First

- Add acceptance-doc checks for the final Hyper-Dank adoption note before writing the note.
- Confirm CI and local verification use the same npm dependency-consumption route.

## Acceptance Criteria

- Public Hyper-Dank package import paths are covered by Campaign Ledger compatibility checks.
- Local and CI verification pass.
- Screenshots and Pa11y cover changed user-facing surfaces.
- Final docs record adopted packages, remaining app-owned boundaries, and deferred follow-ups.
- The epic integration branch is ready to target `main`.

## Acceptance Notes

- [Hyper-Dank Adoption Acceptance](../operations/hyper-dank-adoption-acceptance.md) records the
  completed package source, compatibility checks, screenshot evidence, app-owned boundaries, and
  follow-ups.
- `bun run test:hyper-dank` remains the focused public-package compatibility gate.
- `bun run verify` remains the final local acceptance command and captures routine screenshots to a
  temporary directory.
- No user-facing UI changed in this acceptance ticket; existing tracked screenshots under
  `docs/pr-screenshots/` remain the deliberate UI evidence set from the migration tickets.
