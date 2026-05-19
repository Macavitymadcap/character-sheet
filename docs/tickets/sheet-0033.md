# Ticket sheet-0033: Hosted Data, Backup, And Seed Operations

## Summary

Define the hosted SQLite data posture for the first Railway rehearsal, including seed, migration, backup, and reset operations.

## Implementation

- Decide and document where the hosted SQLite database lives for the rehearsal deployment.
- Add or document safe seed/reset commands for preparing hosted group data.
- Document backup and restore steps that do not require manual database surgery.
- Confirm migrations/bootstrap remain idempotent against existing hosted data.

## Tests First

- Add repository or script tests for idempotent hosted-style bootstrap and seed flows where practical.
- Add smoke coverage for fresh hosted-like seed preparation.

## Acceptance Criteria

- A fresh hosted rehearsal can be prepared predictably.
- Existing hosted data is not overwritten accidentally by normal startup.
- Backup and restore steps are documented.
- `bun run verify` passes.

## Implementation Notes

- Added `bun run hosted:data -- migrate|prepare|backup|restore` for explicit hosted SQLite operations.
- Changed app startup to bootstrap schema without seeding mutable data; hosted and local seed preparation are now named commands.
- Documented the Railway `/data/character-sheet.sqlite3` database path, `/data/backups` backup posture, restore confirmation, and deliberate reseed flow.
- Added hosted-data tests for fresh preparation, non-destructive migration, seed refusal on existing databases, and confirmed backup/restore.
