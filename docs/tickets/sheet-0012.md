# Ticket sheet-0012: Group-Use Data And Permission Foundations

## Summary

Extend the local SQLite model, repository contracts, and permission guards so later tickets can support multiple users, multiple characters, campaign wiki material, image assets, factions, notes, and sessions.

## Implementation

- Add schema and repository contracts for group-use characters, wiki pages, image assets, factions, character faction choices, note creation metadata, and campaign sessions.
- Preserve existing Lynott seed data while adding enough seed records to exercise a multi-player Rovnost campaign.
- Add shared permission helpers for campaign membership, Game Master ownership, character ownership, wiki visibility, and asset visibility.
- Keep storage local-first. Image assets store metadata and an app-managed relative storage key, never an absolute local source path.
- Keep route-facing contracts database-agnostic enough for a later Postgres adapter.

## Tests First

- Write schema tests for constraints, cascades, visibility values, asset metadata, and faction selection uniqueness.
- Write repository tests for listing a player's characters, listing a Game Master's campaign characters, wiki visibility, asset visibility, and faction reads.
- Write guard tests for unauthenticated users, campaign members, non-members, Game Masters, and admins.
- Verify `seedDatabase()` remains idempotent.

## Acceptance Criteria

- Existing `sheet-0001` tests still pass.
- New table groups support later tickets without adding route-specific SQL to route handlers.
- Permission guards centralise campaign, character, wiki, and asset access decisions.
- Seed data includes a small multi-user campaign shape without changing Lynott's current sheet behaviour.
