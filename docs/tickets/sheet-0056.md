# Ticket sheet-0056: Campaign-Scoped Private Rules Sources

## Summary

Allow the Rovnost campaign to attach private local rules sources while preserving public SRD
boundaries, source provenance, and repository safety.

## Dependencies

- Depends on `sheet-0055` for reliable Game Master/admin access checks.

## Implementation

- Add campaign-scoped rules-source metadata for private table-owned content.
- Add or extend import paths so a Game Master/operator can import local Rovnost source files without
  exposing them publicly.
- Mark imported private sources with campaign scope, visibility, provenance, and public-export
  eligibility.
- Ensure public routes and public local-data exports exclude private/campaign-scoped source text.
- Add campaign-facing rules source management or status UI sufficient to attach, verify, and list
  Rovnost sources.
- Keep SRD, local campaign, and private/third-party source labels distinct.
- Avoid committing owned rules text as fixtures; use tiny synthetic fixtures for tests.

## Interfaces And Data Changes

- Tables/read models: `rules_sources`, campaign-to-source mapping, visibility/public-export fields.
- Import service/source contract.
- Routes for campaign rules-source management or status.
- Rules repository filters for public, campaign, and authenticated contexts.

## Tests First

- Add schema/repository tests for campaign-scoped rules source visibility.
- Add importer tests using synthetic private fixtures.
- Add route tests proving public users cannot read private rules while permitted campaign users can.
- Add component tests for source labels and rules-source status UI.

## Acceptance Criteria

- Rovnost can attach private campaign-scoped rules sources.
- Public users and public exports cannot read private source text.
- Permitted campaign users can find private campaign rules with clear provenance.
- SRD content remains public and distinct from private sources.
- `bun run verify` passes.
