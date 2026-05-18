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

## Provenance

Imported mechanics include a `provenance` object in `data_json`:

- `originalPath`: the local source path used for the import.
- `ruleType`: the resolved rule entity type.
- `source`: the source abbreviation, such as `SRD 5.1`.
- `srdVersion`: `5.1` for files imported from the SRD 5.1 source or fixture folders.

The SRD source is stored as:

- `slug`: `srd-5-1`
- `name`: `Systems Reference Document 5.1`
- `abbreviation`: `SRD 5.1`

## Import Result

`RulesImportService.importFromLocalSource(sourcePath)` preserves the existing `entities` and
`imported` fields and also reports:

- `skippedFiles`: unsupported files discovered while walking the source tree.
- `sourceCounts`: imported entity counts grouped by source slug.

`bun run import:rules -- <path>` remains the command-line entry point. Live fetching from external
rules sites is out of scope for this epic.
