# Ticket sheet-0053: Public Local Play Storage And Export

## Summary

Add browser-local character and campaign tracking for public visitors, with versioned export and
import so the data is portable and honestly presented as local-only.

## Dependencies

- Depends on `sheet-0052` for public navigation entry points.

## Implementation

- Add public local-play pages, expected as `/local/characters` and `/local/campaigns`.
- Store public play data in browser local storage, not SQLite.
- Define a versioned local-data document shape for characters, campaign notes, and metadata.
- Add export to a JSON file and import from that JSON shape.
- Validate imported documents before writing them to local storage.
- Show clear local-only persistence copy and export prompts without creating a marketing landing
  page.
- Keep server-backed `/characters`, `/campaigns/:campaignSlug`, and `/sheet/:characterRef` separate
  from browser-local public data.

## Interfaces

- Routes/pages: `/local/characters`, `/local/campaigns`.
- Browser local storage keys and versioned JSON export shape.
- Components for local character/campaign list, edit forms, import, export, empty states, and
  validation errors.

## Tests First

- Add component tests for public local-play empty, populated, import, export, and error states.
- Add browser-level or script coverage for creating local data, exporting it, clearing state, and
  importing it again.
- Add validation tests for accepted and rejected local-data documents.
- Add accessibility coverage for local character and local campaign pages.

## Acceptance Criteria

- Public users can track at least one local character and one local campaign record without signing
  in.
- Public users can export and import their local data.
- Invalid imports fail with a readable error and do not overwrite existing local data.
- The UI is clear that browser-local data is not server-backed.
- `bun run verify` passes.
