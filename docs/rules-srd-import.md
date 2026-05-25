# SRD 5.1 Rules Import Contract

## Purpose

`sheet-0021` defines the local SRD 5.1 import boundary before the app imports the full corpus. The
importer remains offline and local-first: it reads files from disk, parses supported Markdown or
structured JSON, and writes structured rules into SQLite through `RulesImportService` and
`RulesSeedRepository`.

## Source Layout

The full SRD corpus lives under `docs/rules/srd-5.1/`. `docs/rules/srd-5.1-fixtures/` is a tiny
contract fixture, not the full rules source.

The committed corpus is structured JSON generated from the CC-BY SRD conversion. Markdown corpus
folders, when used for hand-maintained additions, should be grouped by rule type:

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
├── stat-blocks/
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
- Mechanics metadata: action timing, charges, reset cadence, and passive trait hints where the
  source text provides them.
- Stat block metadata: armour class, hit points, speed, challenge, actions, and reactions for
  Markdown files under `stat-blocks/`.

The parser recognises SRD actions, backgrounds, classes, class features, subclasses, conditions,
core rules, equipment, feats, proficiencies, senses, species, spells, and local stat blocks.
Commercial non-SRD source types remain out of scope for the SRD epic.

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

`bun run import:rules:srd` imports the full committed SRD corpus from `docs/rules/srd-5.1/` and is
the preferred operator command for restoring a fresh local database from the partial seeded rule
state to the full searchable public rules browser. `bun run import:rules -- <path>` remains the
generic command-line entry point for targeted imports. Live fetching from external rules sites is
out of scope for this epic.
