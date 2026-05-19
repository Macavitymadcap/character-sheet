# Ticket sheet-0022: SRD Parser And Metadata Expansion

## Summary

Expand importer/parser support for full SRD 5.1 rule types and searchable metadata.

## Implementation

- Parse SRD classes, subclasses where present, species/races, backgrounds, feats where present,
  spells, equipment, weapons, armour, adventuring gear, conditions, actions, senses,
  proficiencies, and core rules.
- Extract metadata needed for filtering and sheet linking, such as tags, spell level, school, class
  availability, equipment category, and searchable text.
- Keep parser failures explicit and auditable.

## Tests First

- Add parser fixtures and expectations for each supported SRD rule type before implementation.

## Acceptance Criteria

- SRD source files import into structured rule entities and mechanics with useful metadata.
- Unsupported or malformed source files fail with actionable errors.

## Implementation Notes

- Expanded SRD fixture coverage for actions, classes, subclasses, core rules, equipment categories,
  feats, proficiencies, senses, species, and spells.
- Added parser recognition for the SRD rule types needed by the epic.
- Added deterministic `tags` and `searchableText` metadata for later filtering and sheet-linking
  tickets.
- Added spell, background, and equipment metadata extraction while keeping imports local-first and
  schema-compatible.
