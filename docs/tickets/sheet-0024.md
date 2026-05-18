# Ticket sheet-0024: Rules Browsing UI

## Summary

Build accessible rules list and detail pages for imported SRD content.

## Implementation

- Add `/rules`, `/rules/:entityType`, and `/rules/:entityType/:slug` routes.
- Render compact filters, search, grouped counts, result lists, and rule detail pages.
- Keep pages dense, mobile-friendly, and suitable for table use.
- Preserve unauthenticated behaviour according to the app's current auth boundary while keeping the
  route structure public-safe for a later public rules mode.

## Tests First

- Add route and component tests for filters, search results, detail pages, bad slugs, empty states,
  and mobile-friendly markup.

## Acceptance Criteria

- Signed-in users can browse, search, filter, and read SRD rules in the app.
