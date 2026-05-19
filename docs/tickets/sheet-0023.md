# Ticket sheet-0023: Rules Read Models, Search, And Filtering

## Summary

Add rules repository read models for browsing, filtering, search, source precedence, and character
rule links.

## Implementation

- Add query APIs for rules index counts, type filters, text search, source filters, spell filters,
  equipment filters, and detail lookup by type/slug.
- Preserve source provenance and deterministic ordering.
- Add read/update APIs for `character_rule_links` where later sheet UI needs them.

## Tests First

- Add repository tests for each filter, search path, missing slug, duplicate source, and linked-rule
  scenario.

## Acceptance Criteria

- Routes can read rules without knowing importer or SQLite details.
- Search and filters remain deterministic across repeated imports.

## Implementation Notes

- Added `RulesRepository` read models for rule type counts, filtered summaries, detail lookup, and
  enriched character rule links.
- Added deterministic filtering by entity type, text query, spell level, source, and equipment
  category.
- Preserved route-facing isolation from SQLite by keeping JSON parsing and provenance handling in
  the repository layer.
