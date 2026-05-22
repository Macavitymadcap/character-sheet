# Ticket sheet-0041: Hyper-Dank Consumption Foundations

## Summary

Prove Campaign Ledger can consume the current Hyper-Dank packages through a repeatable route before
any app code migrates to them.

## Dependencies

- Builds on the accepted `sheet-0040` epic plan.
- Tracks Hyper-Dank `pace-0060` installability guidance while the packages are not npm-published.

## Implementation

- Choose and document the current consumption path: local tarballs, GitHub packages, or another
  verified route from Hyper-Dank's installability work.
- Add the required Hyper-Dank package dependencies without assuming npm registry publication.
- Add a compatibility script or test that imports the packages through public package names.
- Keep the first dependency change narrow; do not migrate UI, transport, data, or automation code in
  this ticket.
- Update README and architecture notes with the chosen package-consumption boundary.

## Interfaces

- `package.json` and lockfile.
- Compatibility test or script under `scripts/` or `src/`.
- README and architecture documentation.

## Tests First

- Add a failing compatibility check for the public Hyper-Dank import paths before adding
  dependencies.
- Run the selected Hyper-Dank package build or pack command if the consumption route requires it.

## Acceptance Criteria

- Campaign Ledger can install or resolve the Hyper-Dank packages through the documented route.
- A compatibility check imports the required public package paths.
- The docs explain why the route is temporary if npm publication is still unavailable.
- No Campaign Ledger runtime behaviour changes in this ticket.
- `bun run verify` passes.
