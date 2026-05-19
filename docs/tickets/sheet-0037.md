# Ticket sheet-0037: Campaign Subpage Split And Management Polish

## Summary

Split the Game Master campaign landing page into focused management subpages after the first hosted rehearsal.

## Context

`sheet-0036` accepted the current campaign page for the Railway rehearsal, but the page now combines campaign summary, members, sessions, wiki creation, image upload, and image browsing. That is workable for the first remote table check; it will become harder to scan as campaign content grows.

## Implementation

- Keep `/campaigns/rovnost-shadows` as a compact campaign overview.
- Move session management to a focused campaign sessions route.
- Move wiki creation and page management to a focused campaign wiki route.
- Move image upload and browsing to a focused campaign images route.
- Preserve existing campaign permission checks and player-visible read routes.
- Update navigation, docs, smoke coverage, accessibility targets, and screenshots for the new routes.

## Tests First

- Add route tests for each new campaign management route before moving markup.
- Add component tests for the split page states and empty states.
- Extend MVP smoke, Pa11y, and screenshot coverage for the new campaign subpages.

## Acceptance Criteria

- The campaign overview is shorter and easier to scan on mobile.
- Game Masters can still create and edit sessions, wiki pages, and images.
- Player-facing wiki and asset visibility stays protected.
- Screenshots cover the split campaign pages in the relevant mobile scroll states.
- `bun run verify` passes.
