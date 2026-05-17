# Ticket sheet-0017: Campaign Wiki Import And Image Assets

## Summary

Add the first campaign wiki and image asset support, using the existing Rovnost player-facing Google Docs Markdown exports and PNG art as the source shape.

## Implementation

- Add campaign wiki pages with title, slug, page type, tags, visibility, body Markdown, and source metadata.
- Add a safe Markdown renderer/importer for the current Google Docs export patterns: title lines, bold headings, italic quotes, bullet lists, horizontal rules, and scene breaks.
- Add image asset upload/copy support for PNG, JPEG, and WebP with title, alt text, caption, dimensions, visibility, and app-managed storage key.
- Add protected asset routes that enforce campaign and visibility permissions.
- Add page cover, inline attachment, and gallery attachment support.
- Seed or fixture the initial Rovnost material: campaign blurb, factions guide, opening teaser, session zero kit, faction sigils, Magister Vallen portrait, Astril map, campaign cover, and Skywright sigil.

## Tests First

- Write importer tests based on representative snippets from the Rovnost Markdown exports.
- Write asset tests for metadata, allowed file types, missing alt text, protected reads, and non-member rejection.
- Write route/component tests for wiki list/detail, edit forms, image upload forms, and pages with covers/galleries.
- Add screenshots for a wiki page with a cover image, a map page, and a faction-style page with sigil art.

## Acceptance Criteria

- Game Masters can create and edit campaign wiki pages.
- Player-visible wiki pages can be read by campaign players.
- Game Master-only pages and assets are hidden from players.
- Uploaded images are copied into app-managed local storage and rendered with alt text.
- Raw local source paths, such as Downloads paths, are never persisted or rendered.
