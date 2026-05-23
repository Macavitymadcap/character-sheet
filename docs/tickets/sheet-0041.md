# Ticket sheet-0041: Hyper-Dank Consumption Foundations

## Summary

Prove Campaign Ledger can consume the current Hyper-Dank packages through their public package paths
before any app code migrates to them.

## Dependencies

- Builds on the accepted `sheet-0040` epic plan.
- Tracks Hyper-Dank `hyper-dank-v2.3.1`, where the `pace-0060` consumer-docs epic has merged to
  `main` and `pace-0062` proved package tarballs as the near-term downstream install route while the
  packages were not npm-published.

## Implementation

- Added the required Hyper-Dank package dependencies from npm once publication became available.
- Keep `hono` and `typescript` available for package peers. Add `@playwright/test` only if this
  ticket or later automation work uses Playwright-backed Hyper-Dank automation helpers.
- Added `scripts/hyper-dank-compat.test.tsx` and `bun run test:hyper-dank` to import the packages
  through public package names.
- Keep the first dependency change narrow; do not migrate UI, transport, data, or automation code in
  this ticket.
- Updated README and architecture notes with the chosen package-consumption boundary.

## Interfaces

- `package.json` and lockfile.
- Compatibility test or script under `scripts/` or `src/`.
- README and architecture documentation.

## Tests First

- Add a failing compatibility check for the public Hyper-Dank import paths before adding the package
  dependencies.
- Run Hyper-Dank `bun run test:packages` or the equivalent package smoke as appropriate before
  refreshing dependency versions.

## Acceptance Criteria

- Campaign Ledger can install or resolve the Hyper-Dank packages through their documented public
  package paths.
- A compatibility check imports the required public package paths.
- The docs explain why the earlier tarball route was temporary and why npm is now the default.
- No Campaign Ledger runtime behaviour changes in this ticket.
- `bun run verify` passes.

## Acceptance Notes

- Hyper-Dank packages were initially packed from the sibling `../hyper-dank` checkout with `bun run
  pack:packages` after the `hyper-dank-v2.3.1` release and vendored under `vendor/hyper-dank/` so CI
  installs did not require that sibling checkout.
- After npm publication, Campaign Ledger switched the package dependencies to registry semver ranges
  and removed the vendored tarballs.
- Campaign Ledger now resolves `@macavitymadcap/hyper-dank-ui`,
  `@macavitymadcap/hyper-dank-data`, `@macavitymadcap/hyper-dank-transport`, and
  `@macavitymadcap/hyper-dank-automation` from npm.
- `bun run test:hyper-dank` and `bun run verify` pass with no runtime migration beyond dependency
  resolution and public import coverage.
