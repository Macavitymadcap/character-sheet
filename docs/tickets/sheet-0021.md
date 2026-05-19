# Ticket sheet-0021: SRD Source Contract And Import Strategy

## Summary

Define the local SRD 5.1 source layout, importer contract, provenance handling, and seed strategy.

## Implementation

- Document the expected local SRD source folder shape and supported file formats.
- Define how SRD source, version, provenance, slugs, and source precedence are represented.
- Add fixtures that describe the minimum representative SRD rule types for later parser tickets.
- Keep the import path local-first and offline.

## Tests First

- Add importer contract tests for source discovery, duplicate files, provenance, and unsupported
  files.

## Acceptance Criteria

- The repo documents where SRD source files live locally and how `bun run import:rules` reads them.
- Later tickets can add parsers without revisiting the source contract.

## Implementation Notes

- Added `docs/rules-srd-import.md` as the SRD 5.1 import contract.
- Added tiny SRD fixture files under `docs/rules/srd-5.1-fixtures/` for parser-contract tests.
- Extended `RulesImportService.importFromLocalSource()` with `skippedFiles` and `sourceCounts`
  while preserving `entities` and `imported`.
- Added mechanic provenance metadata in `data_json` rather than changing the schema in this ticket.
