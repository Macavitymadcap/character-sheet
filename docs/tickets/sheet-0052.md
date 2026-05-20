# Ticket sheet-0052: Public SRD Rules And Home Page Navigation

## Summary

Make SRD rules publicly browseable and rewrite the home page so visitors understand public rules,
browser-local play, signed-in sheets, and campaign tools from the first screen.

## Dependencies

- Builds on the naming baseline from `sheet-0051`.

## Implementation

- Allow unauthenticated users to browse SRD-category rules at `/rules` and
  `/rules/:entityType/:slug`.
- Keep private, local campaign, and third-party non-SRD sources behind the correct authenticated
  visibility checks.
- Update the home page to link to public SRD rules, public local character tracking, public local
  campaign tracking, sign-in, and the signed-in user's role destination.
- Update the site header navigation so public users can reach public rules without signing in.
- Keep source labels visible on rules list and detail pages.
- Ensure admin, player, Game Master, and public rule routes all read from the accepted SRD import
  rather than a sparse starter corpus when the full import is present.

## Interfaces

- Routes: `/`, `/rules`, `/rules/:entityType`, `/rules/:entityType/:slug`.
- Guards: public SRD read access versus private/campaign source access.
- Components: `HomePage`, `SiteHeader`, `RulesPage`, `RulesDetailPage`.
- Repository read models for source category and visibility.

## Tests First

- Add route tests proving public users can read SRD rules and cannot read private or campaign-scoped
  rules.
- Add route tests proving signed-in users keep existing rules access.
- Add component tests for home-page copy and links.
- Add component or route tests for source labels and public-safe empty states.
- Extend Pa11y targets to include public rules if not already covered.

## Acceptance Criteria

- A signed-out visitor can find and read SRD rules without being redirected to login.
- Private/campaign-scoped rules are not exposed publicly.
- The home page clearly routes visitors to public rules, local play, and sign-in.
- Existing signed-in rules workflows continue to work.
- `bun run verify` passes.
