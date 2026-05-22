# Ticket sheet-0044: Adopt Hyper-Dank Data Lifecycle Helpers

## Summary

Adopt useful `@macavitymadcap/hyper-dank-data` lifecycle or migration-planning helpers without
changing Campaign Ledger's SQLite schema ownership or repository model.

## Dependencies

- Requires `sheet-0041`.

## Implementation

- Review Hyper-Dank data helpers for migration ordering, idempotent bootstrap, provider lifecycle,
  or test database setup.
- Adopt only helpers that reduce local framework code without forcing Postgres, Better Auth, or
  shared domain repositories.
- Keep Campaign Ledger migrations, seed data, schema names, repositories, and data access contracts
  app-owned.
- Update architecture docs if the database lifecycle boundary changes.

## Interfaces

- Database bootstrap and migration scripts.
- SQLite repository tests.
- Hosted data operations and local test database setup.

## Tests First

- Add or tighten idempotency tests for in-memory and file-backed SQLite bootstrap before replacing
  lifecycle code.
- Keep hosted-data tests covering migrate, prepare, backup, and restore paths.

## Acceptance Criteria

- Any adopted data helper imports from `@macavitymadcap/hyper-dank-data`.
- SQLite remains the active local and hosted rehearsal store.
- Schema, seed, and repository behaviour stay unchanged.
- Hosted data operations still pass.
- `bun run verify` passes.
