# Ticket sheet-0025: Sheet Rule Links

## Summary

Connect character sheet tabs to imported SRD rules through `character_rule_links` and rule detail
routes.

## Implementation

- Link visible class features, species traits, background features, spells, equipment, and
  conditions from sheet tabs to rule detail pages.
- Add focused link-management behaviour only where existing manual sheet workflows need it.
- Preserve Game Master and player permissions for character-owned rule selections.

## Tests First

- Add repository, route, and component tests for linked rules, missing rules, forbidden edits, and
  rendered sheet links.

## Acceptance Criteria

- Players can open relevant SRD rules from the character sheet while playing.
