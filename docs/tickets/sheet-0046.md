# Ticket sheet-0046: Remove Replaced Local Framework Code

## Summary

Clean up app-local framework code that has been replaced by Hyper-Dank package imports, and update
docs to describe the new boundaries.

## Dependencies

- Follows the relevant migration tickets from `sheet-0042` through `sheet-0045`.

## Implementation

- Remove unused local components, helpers, exports, styles, and tests after replacements are in
  place.
- Keep compatibility shims only where they protect an active Campaign Ledger contract.
- Update import paths, architecture diagrams, README guidance, and ticket notes to match the final
  package boundaries.
- Avoid unrelated refactors and keep domain code app-owned.

## Interfaces

- Local component and helper exports.
- README, architecture docs, and ticket references.
- Compatibility and docs-link tests.

## Tests First

- Add or update checks that fail on stale local framework imports or outdated docs where practical.
- Run docs-link and focused package-compatibility tests before broad verification.

## Acceptance Criteria

- Replaced local framework code is removed.
- Remaining local code has a clear Campaign Ledger-specific reason to exist.
- Docs describe Hyper-Dank as runtime dependencies, not only pattern references.
- `bun run verify` passes.
