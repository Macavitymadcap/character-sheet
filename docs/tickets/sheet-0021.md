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
