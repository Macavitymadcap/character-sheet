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
