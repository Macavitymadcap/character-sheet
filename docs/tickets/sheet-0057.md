# Ticket sheet-0057: Rules Detail, Mechanics, Reset Cadence, And Stat Blocks

## Summary

Make rules usable during play by filling readable rule detail, searchable mechanics, reset cadence,
character-specific action metadata, and stat block support where local source data provides it.

## Dependencies

- Builds on public/private source boundaries from `sheet-0052` and `sheet-0056`.

## Implementation

- Ensure fresh accepted setup exposes the full accepted SRD import, including searches such as
  Bless.
- Extend rule mechanics metadata for action timing, bonus actions, reactions, passive traits,
  charges, daily/dawn recovery, short rests, and long rests.
- Render features, traits, spells, equipment, and actions as compact disclosures with full playable
  text where data exists.
- Replace static sheet action assumptions with character-specific rule/mechanic-driven action,
  bonus-action, reaction, and resource surfaces.
- Add stat block entity support for imported local source files where available.
- Keep detail rendering source-aware and safe for public versus private sources.
- Keep this as rules presentation and metadata, not a full automatic character builder.

## Interfaces And Data Changes

- Rules importer/parser metadata.
- `rules_entities`, `rule_mechanics`, and any stat block support tables/read models.
- `RulesPage`, `RulesDetailPage`, `SheetTabPanel`, action/spell/feature disclosure components.
- `character_rule_links` and resource read models.

## Tests First

- Add importer tests for mechanics/reset cadence/stat block fixtures.
- Add repository tests for filtering/searching Bless and stat blocks in a fresh accepted import.
- Add route/component tests for rule detail rendering by type.
- Add sheet component tests for feature/spell/action disclosures with full text, resource controls,
  and reset cadence.
- Add smoke coverage for opening a sheet rule disclosure, following a rule link, searching Bless,
  and returning to the sheet.

## Acceptance Criteria

- Bless and the accepted SRD catalogue are searchable in a fresh accepted setup.
- Rule detail pages show useful play text and metadata.
- Sheet feature/spell/action disclosures include full rule text where available.
- Per-day, dawn, charges, rests, actions, bonus actions, and reactions can be represented.
- Stat blocks are imported and rendered where local source data supports them.
- `bun run verify` passes.
