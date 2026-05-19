# SRD 5.1 Rules Import Contract

## Purpose

`sheet-0021` defines the local SRD 5.1 import boundary before the app imports the full corpus. The
importer remains offline and local-first: it reads files from disk, parses supported Markdown or
structured JSON, and writes structured rules into SQLite through `RulesImportService` and
`RulesSeedRepository`.

## Source Layout

The full SRD corpus should live under a local folder named `docs/rules/srd-5.1/` when the corpus is
added. `sheet-0021` adds `docs/rules/srd-5.1-fixtures/` as a tiny contract fixture, not as the full
rules source.

Expected folders are grouped by rule type:

```text
docs/rules/srd-5.1/
├── actions/
├── backgrounds/
├── classes/
├── conditions/
├── core-rules/
├── equipment/
├── feats/
├── proficiencies/
├── senses/
├── species/
└── spells/
    └── level-1/
```

Markdown files must start with a level-one heading. JSON files must contain either one
`RuleEntitySeedInput`, an array of `RuleEntitySeedInput`, or an object with an `entities` array.
Other files are skipped and reported in the import result.

## Parsed Metadata

SRD Markdown imports emit metadata inside each mechanic's `data_json` so later tickets can add
filters and sheet links without reparsing source files. The parser currently emits:

- `tags`: deterministic tags derived from rule type, source folders, subtitles, spell level, and
  equipment category.
- `searchableText`: normalised plain text built from subtitles and body copy.
- Spell metadata: level, school, casting time, range, components, duration, higher-level text, and
  class availability when the source includes a `Classes` field.
- Background metadata: feature name, skill proficiencies, tool proficiencies, and equipment.
- Equipment metadata: category, supporting armour, weapon, adventuring gear, and generic equipment
  folders.

The parser recognises SRD actions, backgrounds, classes, class features, subclasses, conditions,
core rules, equipment, feats, proficiencies, senses, species, and spells. Commercial non-SRD source
types remain out of scope for the SRD epic.

## Provenance

Imported mechanics include a `provenance` object in `data_json`:

- `originalPath`: the local source path used for the import.
- `ruleType`: the resolved rule entity type.
- `source`: the source abbreviation, such as `SRD 5.1`.
- `srdVersion`: `5.1` for files imported from the SRD 5.1 source or fixture folders.

Rule sources also carry a `contentCategory`:

- `srd` for the SRD 5.1 corpus.
- `local` for local campaign material.
- `third_party` for non-SRD book material currently needed by Lynott.

The SRD source is stored as:

- `slug`: `srd-5-1`
- `name`: `Systems Reference Document 5.1`
- `abbreviation`: `SRD 5.1`
- `contentCategory`: `srd`

## Import Result

`RulesImportService.importFromLocalSource(sourcePath)` preserves the existing `entities` and
`imported` fields and also reports:

- `skippedFiles`: unsupported files discovered while walking the source tree.
- `sourceCounts`: imported entity counts grouped by source slug.

`bun run import:rules -- <path>` remains the command-line entry point. Live fetching from external
rules sites is out of scope for this epic.
