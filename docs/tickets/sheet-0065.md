# Ticket sheet-0065: Player Preview And Visibility Audit

## Summary

Add a player-preview workflow and visibility audit UI so a Game Master can confirm what players can
currently see across wiki pages, sessions, NPCs, notes, and images before a session.

This ticket reduces the risk of accidentally revealing private prep material.

## Dependencies

- Requires `sheet-0063` NPC visibility foundations.
- Builds on `sheet-0064` for NPC reveal state.
- Uses existing campaign wiki, session, image, and note visibility checks.

## Implementation

- Add `/campaigns/:campaignSlug/preview/player` for campaign Game Masters.
- Reuse production player visibility guards and read models rather than building a separate
  approximate preview path.
- Render a preview of player-visible campaign material: wiki pages, sessions, revealed NPCs,
  player-visible images, and any linked public rules or assets.
- Add a Game Master-only visibility audit panel that lists hidden versus visible counts for wiki
  pages, sessions, NPCs, notes, and images.
- Add direct links from hidden/visible audit rows back to the relevant management page where the Game
  Master can change visibility.
- Make it visually clear that preview mode is a Game Master tool and not a real player session.
- Update architecture and README docs for the preview route.

## Interfaces

- Route: `/campaigns/:campaignSlug/preview/player`.
- Reused repository read models for player-visible campaign material.
- Components/pages: player preview page and visibility audit summary.
- Existing campaign, wiki, session, image, and NPC visibility fields.

## Tests First

- Add route tests proving only campaign Game Masters can access player preview.
- Add route tests proving preview output uses player-visible filtering for wiki pages, sessions,
  images, and NPCs.
- Add tests proving private Game Master notes, unrevealed NPCs, and private images do not appear in
  preview HTML.
- Add component tests for audit counts, empty states, visibility labels, and management links.
- Add Pa11y and screenshot targets for preview and audit views.

## Acceptance Criteria

- A Game Master can open a player preview for the campaign.
- Preview uses the same visibility rules as real player routes.
- Hidden NPCs, private notes, Game-Master-only images, and private imported drafts stay hidden.
- The audit panel shows what is visible and hidden by content type.
- The Game Master can navigate from audit results to the relevant management surface.
- Preview and audit views are covered by route, component, accessibility, and screenshot checks.
- `bun run verify` passes.
